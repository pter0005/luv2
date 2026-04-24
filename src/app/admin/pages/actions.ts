'use server';

import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/admin-action-guard';

// ── HELPER: gera URL Firebase Storage com token (sem makePublic) ──
// Se setMetadata falhar (IAM sem storage.objects.update, transiente, etc.),
// tenta re-ler do bucket — pode ter escrito mas só a response ter falhado.
// Se realmente falhou, ainda retorna a URL com o token gerado localmente —
// mesmo que o backend ainda não tenha persistido, o token tá no state e a
// próxima chamada eventualmente sincroniza.
async function getTokenUrl(file: any, bucket: any): Promise<string> {
    let token: string | undefined;
    try {
        const [metadata] = await file.getMetadata();
        token = metadata?.metadata?.firebaseStorageDownloadTokens;
    } catch { /* trata igual a "sem token" */ }

    if (!token) {
        token = randomUUID();
        try {
            await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
        } catch (setErr) {
            // Set falhou — pode ser IAM, network transient, ou race.
            // Re-tenta ler: se o metadata agora tem token, usa esse em vez do
            // gerado localmente (evita dois tokens concorrentes pro mesmo file).
            try {
                const [retry] = await file.getMetadata();
                const existing = retry?.metadata?.firebaseStorageDownloadTokens;
                if (existing) token = existing;
            } catch { /* mantém o randomUUID como fallback */ }
        }
    }
    const encoded = encodeURIComponent(file.name);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
}

// ── HELPER: move arquivo de temp/ para lovepages/ com token URL ───
// Alinhado com moveFileWithRetry em criar/fazer-eu-mesmo/actions.ts: 4 tentativas
// com backoff exponencial (1.5s, 3s, 4.5s, 6s) pra lidar com transient errors
// do Cloud Storage (network, contention). Check de sourceExists antes de copy
// evita erro falso-positivo quando o source já foi movido em attempt anterior.
async function moveFile(bucket: any, oldPath: string, newPath: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const maxRetries = 4;
    let lastError: any = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const sourceFile = bucket.file(oldPath);
            const targetFile = bucket.file(newPath);
            const [targetExists] = await targetFile.exists();
            if (!targetExists) {
                const [sourceExists] = await sourceFile.exists();
                if (!sourceExists) {
                    // Source já foi movido antes mas doc não atualizou, ou foi deletado pelo TTL.
                    // Sem source e sem target = nada a fazer, retorna erro.
                    return { success: false, error: 'source_missing' };
                }
                await sourceFile.copy(targetFile);
            }
            const url = await getTokenUrl(targetFile, bucket);
            try {
                const [srcStill] = await sourceFile.exists();
                if (srcStill) await sourceFile.delete();
            } catch { /* cleanup non-critical */ }
            return { success: true, url };
        } catch (error: any) {
            lastError = error;
            if (attempt < maxRetries) {
                // Backoff exponencial 1.5s × attempt: 1.5s → 3s → 4.5s
                await new Promise(r => setTimeout(r, 1500 * attempt));
            }
        }
    }
    return { success: false, error: lastError?.message || 'unknown' };
}

// ── HELPER: corrige URL quebrada de arquivo já em lovepages/ ──────
async function fixBrokenUrl(bucket: any, fileObj: any): Promise<any> {
    if (!fileObj?.url || !fileObj?.path) return fileObj;
    const isFirebaseUrl = fileObj.url.includes('firebasestorage.googleapis.com/v0/b/');
    const hasToken = fileObj.url.includes('?alt=media&token=');
    if (isFirebaseUrl && hasToken) return fileObj; // já está correto
    // URL quebrada (storage.googleapis.com sem token ou sem alt=media)
    try {
        const file = bucket.file(fileObj.path);
        const [exists] = await file.exists();
        if (!exists) return fileObj;
        const url = await getTokenUrl(file, bucket);
        return { ...fileObj, url };
    } catch {
        return fileObj;
    }
}

// ── REPROCESSAR UMA PÁGINA ESPECÍFICA ────────────────────────────
// Lock via transação: evita que dois admins apertando "Reprocessar" ao mesmo
// tempo batam no bucket em paralelo (race no sourceFile.delete). Lock expira
// em 5 min pra não travar o doc se a action crashar no meio.
const REPROCESS_LOCK_TTL_MS = 5 * 60 * 1000;

export async function reprocessPageFiles(pageId: string): Promise<{ success: boolean; moved: number; failed: number; error?: string }> {
    await requireAdmin();
    const db = getAdminFirestore();
    const bucket = getAdminStorage();

    const pageRef = db.collection('lovepages').doc(pageId);

    // ── 1. Claim do lock via transação atômica ──────────────────────────────
    try {
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(pageRef);
            if (!snap.exists) throw new Error('PAGE_NOT_FOUND');
            const d = snap.data() || {};
            const lockedAt = d._reprocessLockAt?.toMillis?.() ?? 0;
            if (lockedAt && Date.now() - lockedAt < REPROCESS_LOCK_TTL_MS) {
                throw new Error('LOCKED');
            }
            tx.update(pageRef, { _reprocessLockAt: Timestamp.now() });
        });
    } catch (err: any) {
        if (err?.message === 'PAGE_NOT_FOUND') return { success: false, moved: 0, failed: 0, error: 'Página não encontrada.' };
        if (err?.message === 'LOCKED') return { success: false, moved: 0, failed: 0, error: 'Outra operação de reprocesso está em andamento. Espere 5min.' };
        return { success: false, moved: 0, failed: 0, error: err?.message || 'Falha ao obter lock.' };
    }

    // A partir daqui garantimos unlock no finally, inclusive em erro
    try {
        const pageSnap = await pageRef.get();
        const data = pageSnap.data()!;
        const updates: any = {};
        let moved = 0;
        let failed = 0;

        const tryMove = async (fileObj: any, folder: string) => {
            if (!fileObj?.path) return fileObj;
            if (fileObj.path.startsWith('temp/')) {
                const fileName = fileObj.path.split('/').pop();
                if (!fileName) return fileObj;
                const newPath = `lovepages/${pageId}/${folder}/${fileName}`;
                const result = await moveFile(bucket, fileObj.path, newPath);
                if (result.success) { moved++; return { url: result.url, path: newPath }; }
                else { failed++; return fileObj; }
            }
            if (fileObj.path.startsWith('lovepages/')) {
                const fixed = await fixBrokenUrl(bucket, fileObj);
                if (fixed.url !== fileObj.url) moved++;
                return fixed;
            }
            return fileObj;
        };

        if (data.galleryImages?.length) {
            updates.galleryImages = await Promise.all(data.galleryImages.map((img: any) => tryMove(img, 'gallery')));
        }
        if (data.timelineEvents?.length) {
            updates.timelineEvents = await Promise.all(data.timelineEvents.map(async (ev: any) => {
                if (ev.image) ev.image = await tryMove(ev.image, 'timeline');
                return ev;
            }));
        }
        if (data.puzzleImage) updates.puzzleImage = await tryMove(data.puzzleImage, 'puzzle');
        if (data.audioRecording) updates.audioRecording = await tryMove(data.audioRecording, 'audio');
        if (data.backgroundVideo) updates.backgroundVideo = await tryMove(data.backgroundVideo, 'video');
        if (data.memoryGameImages?.length) {
            updates.memoryGameImages = await Promise.all(data.memoryGameImages.map((img: any) => tryMove(img, 'memory-game')));
        }

        // Libera o lock + flag updatedAt pro cache invalidate pegar
        updates._reprocessLockAt = FieldValue.delete();
        updates.updatedAt = Timestamp.now();

        if (Object.keys(updates).length > 0) {
            await pageRef.update(updates);
        }

        // Marca failed_file_moves relacionados como resolvidos (audit trail)
        const failedMovesSnap = await db.collection('failed_file_moves')
            .where('pageId', '==', pageId)
            .where('resolved', '==', false)
            .get();
        const batch = db.batch();
        failedMovesSnap.docs.forEach(doc => {
            batch.update(doc.ref, {
                resolved: true,
                resolvedAt: Timestamp.now(),
                resolution: 'manual_reprocess',
                movedCount: moved,
                failedCount: failed,
            });
        });
        await batch.commit();

        // Invalida cache da página pública também — a URL nova só aparece
        // pro cliente se Next.js re-render. Sem isso cliente vê a versão cached
        // por até 60s (dependendo da config).
        revalidatePath('/admin/pages');
        revalidatePath(`/p/${pageId}`);

        return { success: true, moved, failed };
    } catch (error: any) {
        // Libera o lock mesmo em erro pra não travar por 5min
        try {
            await pageRef.update({ _reprocessLockAt: FieldValue.delete() });
        } catch { /* ignore */ }
        return { success: false, moved: 0, failed: 0, error: error.message };
    }
}

// ── REMOVER REFERÊNCIAS QUEBRADAS ─────────────────────────────────
// Quando arquivos já foram limpos pelo Cloud Storage (temp/ expira ~24h),
// o reprocessPageFiles não consegue mover (source não existe). Essa função
// checa quais arquivos ainda existem no bucket e REMOVE do doc Firestore
// apenas as referências órfãs. Fotos irrecuperáveis — só use quando cliente
// confirmar que não tem backup.

export async function removeBrokenFileRefs(pageId: string): Promise<{ success: boolean; removed: number; error?: string }> {
    await requireAdmin();
    const db = getAdminFirestore();
    const bucket = getAdminStorage();

    try {
        const ref = db.collection('lovepages').doc(pageId);
        const snap = await ref.get();
        if (!snap.exists) return { success: false, removed: 0, error: 'Página não encontrada.' };
        const data = snap.data()!;

        const fileExists = async (path: string): Promise<boolean> => {
            if (!path) return false;
            try {
                const [exists] = await bucket.file(path).exists();
                return exists;
            } catch { return false; }
        };

        let removed = 0;
        const updates: any = {};

        const cleanIfBroken = async (obj: any): Promise<any | null> => {
            if (!obj || !obj.path) return obj;
            const ok = await fileExists(obj.path);
            if (!ok) { removed++; return null; }
            return obj;
        };

        if (Array.isArray(data.galleryImages)) {
            const cleaned = (await Promise.all(data.galleryImages.map(cleanIfBroken))).filter(Boolean);
            if (cleaned.length !== data.galleryImages.length) updates.galleryImages = cleaned;
        }
        if (Array.isArray(data.timelineEvents)) {
            updates.timelineEvents = await Promise.all(data.timelineEvents.map(async (ev: any) => {
                if (ev?.image) {
                    const kept = await cleanIfBroken(ev.image);
                    if (!kept) return { ...ev, image: null };
                }
                return ev;
            }));
        }
        if (Array.isArray(data.memoryGameImages)) {
            const cleaned = (await Promise.all(data.memoryGameImages.map(cleanIfBroken))).filter(Boolean);
            if (cleaned.length !== data.memoryGameImages.length) updates.memoryGameImages = cleaned;
        }
        if (data.puzzleImage) {
            const r = await cleanIfBroken(data.puzzleImage);
            if (!r) updates.puzzleImage = FieldValue.delete();
        }
        if (data.audioRecording) {
            const r = await cleanIfBroken(data.audioRecording);
            if (!r) updates.audioRecording = FieldValue.delete();
        }
        if (data.backgroundVideo) {
            const r = await cleanIfBroken(data.backgroundVideo);
            if (!r) updates.backgroundVideo = FieldValue.delete();
        }

        if (Object.keys(updates).length > 0) {
            await ref.update(updates);
            revalidatePath(`/p/${pageId}`);
            revalidatePath('/admin/pages');
        }

        return { success: true, removed };
    } catch (error: any) {
        return { success: false, removed: 0, error: error.message };
    }
}

// ── BUSCAR DADOS PARA A PÁGINA DE MONITORAMENTO ───────────────────
// Varre recursivamente procurando `path` que começa com 'temp/' OU `url`
// que ainda referencia `/temp/` (inclusive encoded `%2Ftemp%2F`). Detecta:
//  - `failed_file_moves` escrito corretamente (caminho feliz)
//  - Scan direto do doc: `path` ficou em temp/ (add() do log também falhou)
//  - URL stale: `path` foi atualizado pra lovepages/ mas `url` continua
//    apontando pra temp/ (desync entre 2 campos, raro mas acontece)
function findTempPaths(obj: any, paths: string[] = []): string[] {
    if (!obj || typeof obj !== 'object') return paths;
    if (Array.isArray(obj)) {
        obj.forEach(item => findTempPaths(item, paths));
        return paths;
    }
    if (typeof obj.path === 'string' && obj.path.startsWith('temp/')) {
        paths.push(obj.path);
    }
    if (typeof obj.url === 'string') {
        // Detecta tanto literal "/temp/" quanto encoded "%2Ftemp%2F" (Firebase
        // Storage SDK às vezes retorna URLs encoded). Só adiciona se ainda não
        // encontrou um path temp nesse mesmo objeto (evita duplicar).
        const urlHasTemp = obj.url.includes('/temp/') || obj.url.includes('%2Ftemp%2F');
        const pathAlreadyTemp = typeof obj.path === 'string' && obj.path.startsWith('temp/');
        if (urlHasTemp && !pathAlreadyTemp) {
            paths.push(obj.path || obj.url);
        }
    }
    Object.values(obj).forEach(v => findTempPaths(v, paths));
    return paths;
}

export async function getAdminPagesData() {
    await requireAdmin();
    const db = getAdminFirestore();

    // ── 1. failed_file_moves explicitos ─────────────────────────────────────
    const failedMovesSnap = await db.collection('failed_file_moves')
        .where('resolved', '==', false)
        .get();

    const pageIdsWithIssues = new Set<string>();
    const failedMovesByPage = new Map<string, any[]>();

    failedMovesSnap.docs.forEach(doc => {
        const d = doc.data();
        pageIdsWithIssues.add(d.pageId);
        const existing = failedMovesByPage.get(d.pageId) || [];
        failedMovesByPage.set(d.pageId, [...existing, {
            id: doc.id,
            oldPath: d.oldPath,
            newPath: d.newPath,
            error: d.error,
            createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
        }]);
    });

    // ── 2. Scan das páginas recentes procurando paths temp/ órfãos ──────────
    // Cobre o caso onde o próprio `failed_file_moves.add()` falhou ou os logs
    // foram resolvidos incorretamente. Limite últimos 200 pra manter perf.
    try {
        const recentPagesSnap = await db.collection('lovepages')
            .orderBy('createdAt', 'desc')
            .limit(200)
            .get();
        recentPagesSnap.docs.forEach(doc => {
            const tempPaths = findTempPaths(doc.data());
            if (tempPaths.length > 0) {
                pageIdsWithIssues.add(doc.id);
                // Injeta os temp/ paths encontrados como "failed files sintéticos"
                // pro UI mostrar — marca como `synthetic: true` pra diferenciar
                // do failed_file_moves original.
                const existing = failedMovesByPage.get(doc.id) || [];
                tempPaths.forEach(tp => {
                    // Só adiciona se ainda não tá coberto pelo failed_file_moves
                    if (!existing.some(e => e.oldPath === tp)) {
                        existing.push({
                            id: `synthetic_${doc.id}_${tp}`,
                            oldPath: tp,
                            newPath: `(não movido)`,
                            error: 'URL ainda aponta pra temp/ — arquivo pode ter sido deletado pelo Cloud Storage',
                            createdAt: null,
                            synthetic: true,
                        });
                    }
                });
                failedMovesByPage.set(doc.id, existing);
            }
        });
    } catch (e) {
        console.warn('[getAdminPagesData] scan de temp/ falhou:', e);
    }

    // ── 3. Detalhes das páginas com issues ──────────────────────────────────
    const pagesWithIssues: any[] = [];
    for (const pageId of pageIdsWithIssues) {
        try {
            const pageSnap = await db.collection('lovepages').doc(pageId).get();
            if (!pageSnap.exists) continue;
            const pageData = pageSnap.data()!;
            pagesWithIssues.push({
                id: pageId,
                title: pageData.title || 'Sem título',
                plan: pageData.plan || 'desconhecido',
                userId: pageData.userId,
                guestEmail: pageData.guestEmail || null,
                whatsappNumber: pageData.whatsappNumber || null,
                createdAt: pageData.createdAt?.toDate?.()?.toISOString() || null,
                failedFiles: failedMovesByPage.get(pageId) || [],
            });
        } catch {
            // página pode ter sido deletada
        }
    }

    // Ordena pior caso primeiro: VIP > avancado > basico, e dentro mais arquivos
    pagesWithIssues.sort((a, b) => {
        const planOrder: Record<string, number> = { vip: 0, avancado: 1, basico: 2 };
        const ao = planOrder[a.plan] ?? 99;
        const bo = planOrder[b.plan] ?? 99;
        if (ao !== bo) return ao - bo;
        return b.failedFiles.length - a.failedFiles.length;
    });

    // ── 4. Estatísticas gerais de failed_file_moves ─────────────────────────
    // Usa .count() em vez de .get() — escala O(1) em vez de O(N) conforme a
    // coleção cresce. Evita que a /admin/pages fique lenta depois de meses
    // de acumulo de logs (a coleção nunca é purgada).
    let totalFailed = 0;
    let totalResolved = 0;
    try {
        const totalCount = await db.collection('failed_file_moves').count().get();
        totalFailed = totalCount.data().count;
        const resolvedCount = await db.collection('failed_file_moves').where('resolved', '==', true).count().get();
        totalResolved = resolvedCount.data().count;
    } catch (e) {
        // Fallback se o SDK não suportar .count() (super antigo) — tira amostra
        console.warn('[getAdminPagesData] .count() falhou, usando fallback:', e);
        const sample = await db.collection('failed_file_moves').limit(1000).get();
        totalFailed = sample.size;
        totalResolved = sample.docs.filter(d => d.data().resolved).length;
    }
    const totalPending = totalFailed - totalResolved;

    return {
        pagesWithIssues,
        stats: {
            totalFailed,
            totalResolved,
            totalPending,
        }
    };
}
