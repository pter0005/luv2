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

// ── MARCAR COMO IRRECUPERÁVEIS (limpa painel de erros antigos) ─────
// Varre `failed_file_moves` pendentes e, pra cada um, checa se o source
// AINDA existe no Storage. Se não existe mais (o TTL do bucket deletou),
// marca como `resolved: true, resolution: 'unrecoverable'`. Isso zera o
// painel de erros "55 erros no site" que o admin não tem ação pra tomar
// (arquivos não podem voltar).
export async function markIrrecoverableAsResolved(): Promise<{
  success: boolean;
  checked: number;
  marked: number;
  stillRecoverable: number;
  error?: string;
}> {
  await requireAdmin();
  const db = getAdminFirestore();
  const bucket = getAdminStorage();

  try {
    const snap = await db.collection('failed_file_moves')
      .where('resolved', '==', false)
      .limit(500)
      .get();

    if (snap.empty) return { success: true, checked: 0, marked: 0, stillRecoverable: 0 };

    let marked = 0;
    let stillRecoverable = 0;
    const batch = db.batch();

    // Checa existência em paralelo limitado pra não estourar rate limit
    const CHECK_CONCURRENCY = 5;
    const docs = snap.docs;
    let idx = 0;
    await Promise.all(Array(CHECK_CONCURRENCY).fill(null).map(async () => {
      while (idx < docs.length) {
        const doc = docs[idx++];
        const d = doc.data();
        const path = d.oldPath || d.newPath;
        if (!path) {
          // Log inválido — marca como resolved pra limpar ruído
          batch.update(doc.ref, { resolved: true, resolvedAt: Timestamp.now(), resolution: 'invalid_log' });
          marked++;
          continue;
        }
        try {
          const file = bucket.file(path);
          const [exists] = await file.exists();
          if (!exists) {
            // Arquivo sumiu do Storage (TTL bucket ou já foi movido) — marca irrecuperável.
            // Se foi movido, o doc da página já tem a URL nova. Se sumiu, não há o que fazer.
            batch.update(doc.ref, {
              resolved: true,
              resolvedAt: Timestamp.now(),
              resolution: 'unrecoverable',
              reason: 'source_deleted_from_storage',
            });
            marked++;
          } else {
            stillRecoverable++;
          }
        } catch {
          // Erro no check — não marca, deixa pra próxima
          stillRecoverable++;
        }
      }
    }));

    if (marked > 0) await batch.commit();
    revalidatePath('/admin/pages');
    revalidatePath('/admin');

    return { success: true, checked: snap.size, marked, stillRecoverable };
  } catch (err: any) {
    return { success: false, checked: 0, marked: 0, stillRecoverable: 0, error: err?.message || 'unknown' };
  }
}

// ── REPROCESSAR EM LOTE (todas as páginas com issues) ─────────────
// Roda reprocessPageFiles sequencialmente em cada página com problemas.
// Sequencial pra não estressar o Cloud Storage + permitir progress tracking.
// Retorna resumo por página. Demora longo em lote grande — chamar com timeout
// relaxado (fetch `keepalive` no client ou progress polling).
export async function reprocessAllPages(): Promise<{
  success: boolean;
  total: number;
  processed: number;
  totalMoved: number;
  totalFailed: number;
  results: Array<{ pageId: string; moved: number; failed: number; error?: string }>;
  error?: string;
}> {
  await requireAdmin();
  try {
    const { pagesWithIssues } = await getAdminPagesData();
    const results: Array<{ pageId: string; moved: number; failed: number; error?: string }> = [];
    let totalMoved = 0;
    let totalFailed = 0;

    // Cap em 30 pra não timeout em lote grande — admin chama de novo pra resto
    const BATCH_CAP = 30;
    const toProcess = pagesWithIssues.slice(0, BATCH_CAP);

    for (const page of toProcess) {
      try {
        const res = await reprocessPageFiles(page.id);
        totalMoved += res.moved || 0;
        totalFailed += res.failed || 0;
        results.push({ pageId: page.id, moved: res.moved || 0, failed: res.failed || 0, error: res.error });
      } catch (err: any) {
        results.push({ pageId: page.id, moved: 0, failed: 0, error: err?.message || 'unknown' });
      }
    }

    return {
      success: true,
      total: pagesWithIssues.length,
      processed: toProcess.length,
      totalMoved,
      totalFailed,
      results,
    };
  } catch (err: any) {
    return {
      success: false, total: 0, processed: 0, totalMoved: 0, totalFailed: 0, results: [],
      error: err?.message || 'unknown',
    };
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

// ── DELETAR PÁGINA MANUALMENTE (admin only) ───────────────────────
// Remove o doc da lovepages + tenta deletar arquivos do Storage. Soft delete:
// move o doc inteiro pra deleted_lovepages com timestamp + admin who did it,
// pra ter audit trail. Storage usa Cloud soft-delete (7 dias de janela de
// recuperação). Por isso é REVERSÍVEL via /admin/diagnostico-uploads se
// admin deletou por engano.
//
// Fluxo:
//   1. Snapshot do doc atual
//   2. Copy pra deleted_lovepages/{pageId} com metadata (deletedAt, deletedBy, reason)
//   3. Delete o doc original em lovepages/
//   4. Best-effort: deleta arquivos do Storage (galleryImages, timeline, etc)
//   5. Marca payment_intent associado como deletedByAdmin (não conta na receita)
//   6. revalidatePath de admin + página pública (que agora retorna 404)
//
// USE CASE: cliente pediu reembolso e vc quer apagar a página, OU descobriu
// fraude/conteúdo inadequado.
export async function deletePage(pageId: string, reason?: string): Promise<{
  success: boolean;
  filesDeleted?: number;
  filesFailedToDelete?: number;
  error?: string;
}> {
    await requireAdmin();

    // SEGURANÇA: deletes globalmente desabilitados via feature flag.
    // Defesa em camadas — UI esconde botão E server bloqueia.
    const { ADMIN_DELETES_ENABLED, DELETES_DISABLED_MSG } = await import('@/lib/admin-feature-flags');
    if (!ADMIN_DELETES_ENABLED) {
        return { success: false, error: DELETES_DISABLED_MSG };
    }

    const db = getAdminFirestore();
    const bucket = getAdminStorage();

    if (!pageId || typeof pageId !== 'string' || pageId.length < 4) {
        return { success: false, error: 'pageId inválido.' };
    }

    try {
        const pageRef = db.collection('lovepages').doc(pageId);
        const snap = await pageRef.get();
        if (!snap.exists) return { success: false, error: 'Página não encontrada (pode já ter sido deletada).' };

        const data = snap.data()!;

        // ── 1. Snapshot pra deleted_lovepages (soft delete + audit) ──────────
        const archive = {
            ...data,
            _originalPageId: pageId,
            _deletedAt: Timestamp.now(),
            _deletedBy: 'admin',
            _deleteReason: reason || null,
        };
        await db.collection('deleted_lovepages').doc(pageId).set(archive);

        // ── 2. Remove o doc original ─────────────────────────────────────────
        await pageRef.delete();

        // ── 3. Marca payment_intent associado (se houver) como deletado ──────
        // Importante pra dashboard de receita NÃO contar essa venda.
        if (data.intentId) {
            try {
                await db.collection('payment_intents').doc(data.intentId).update({
                    deletedByAdmin: true,
                    deletedAt: Timestamp.now(),
                    deletedBy: 'admin',
                    deleteReason: reason || null,
                });
            } catch { /* intent pode não existir ou já ter expirado */ }
        }

        // ── 4. Storage cleanup — best-effort, não bloqueia o retorno ─────────
        // Cloud Storage soft-delete (7 dias) cobre rollback. Aqui só removemos
        // do "active state" — recuperação via /admin/diagnostico-uploads.
        let filesDeleted = 0;
        let filesFailedToDelete = 0;

        const collectPaths = (): string[] => {
            const paths: string[] = [];
            const pushIfPath = (obj: any) => {
                if (obj?.path && typeof obj.path === 'string') paths.push(obj.path);
            };

            if (Array.isArray(data.galleryImages)) data.galleryImages.forEach(pushIfPath);
            if (Array.isArray(data.timelineEvents)) data.timelineEvents.forEach((ev: any) => pushIfPath(ev?.image));
            if (Array.isArray(data.memoryGameImages)) data.memoryGameImages.forEach(pushIfPath);
            pushIfPath(data.puzzleImage);
            pushIfPath(data.audioRecording);
            pushIfPath(data.backgroundVideo);

            return paths.filter(p => p.startsWith('lovepages/') || p.startsWith('temp/'));
        };

        const paths = collectPaths();
        for (const path of paths) {
            try {
                await bucket.file(path).delete();
                filesDeleted++;
            } catch {
                filesFailedToDelete++;
            }
        }

        revalidatePath('/admin/pages');
        revalidatePath('/admin');
        revalidatePath(`/p/${pageId}`);

        return { success: true, filesDeleted, filesFailedToDelete };
    } catch (error: any) {
        return { success: false, error: error?.message || 'unknown' };
    }
}

// ── BUSCAR PÁGINA POR ID (busca rápida no admin) ──────────────────
export async function getPageQuickInfo(pageId: string): Promise<{
  success: boolean;
  found?: boolean;
  data?: {
    id: string;
    title: string;
    plan: string;
    paidAmount: number | null;
    currency: string | null;
    market: string | null;
    createdAt: string | null;
    paymentId: string | null;
    ownerEmail: string | null;
    whatsappNumber: string | null;
    isGift: boolean;
  };
  error?: string;
}> {
    await requireAdmin();
    const db = getAdminFirestore();

    if (!pageId || typeof pageId !== 'string') return { success: false, error: 'pageId inválido.' };

    try {
        const snap = await db.collection('lovepages').doc(pageId).get();
        if (!snap.exists) return { success: true, found: false };
        const d = snap.data()!;

        return {
            success: true,
            found: true,
            data: {
                id: pageId,
                title: (d.title as string) || 'Sem título',
                plan: (d.plan as string) || 'desconhecido',
                paidAmount: typeof d.paidAmount === 'number' ? d.paidAmount : null,
                currency: (d.currency as string) || null,
                market: (d.market as string) || null,
                createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
                paymentId: (d.paymentId as string) || null,
                ownerEmail: (d.ownerEmail as string) || (d.guestEmail as string) || null,
                whatsappNumber: (d.whatsappNumber as string) || null,
                isGift: !!d.isGift,
            },
        };
    } catch (error: any) {
        return { success: false, error: error?.message || 'unknown' };
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
