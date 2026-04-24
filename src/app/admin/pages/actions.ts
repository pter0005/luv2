'use server';

import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/admin-action-guard';

// ── HELPER: gera URL Firebase Storage com token (sem makePublic) ──
async function getTokenUrl(file: any, bucket: any): Promise<string> {
    const [metadata] = await file.getMetadata();
    let token: string = metadata?.metadata?.firebaseStorageDownloadTokens;
    if (!token) {
        token = randomUUID();
        await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
    }
    const encoded = encodeURIComponent(file.name);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
}

// ── HELPER: move arquivo de temp/ para lovepages/ com token URL ───
async function moveFile(bucket: any, oldPath: string, newPath: string): Promise<{ success: boolean; url?: string; error?: string }> {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const sourceFile = bucket.file(oldPath);
            const targetFile = bucket.file(newPath);
            const [targetExists] = await targetFile.exists();
            if (!targetExists) await sourceFile.copy(targetFile);
            const url = await getTokenUrl(targetFile, bucket);
            try { await sourceFile.delete(); } catch (_) {}
            return { success: true, url };
        } catch (error: any) {
            if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
            else return { success: false, error: error.message };
        }
    }
    return { success: false, error: 'unknown' };
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
export async function reprocessPageFiles(pageId: string): Promise<{ success: boolean; moved: number; failed: number; error?: string }> {
    await requireAdmin();
    const db = getAdminFirestore();
    const bucket = getAdminStorage();

    try {
        const pageRef = db.collection('lovepages').doc(pageId);
        const pageSnap = await pageRef.get();
        if (!pageSnap.exists) return { success: false, moved: 0, failed: 0, error: 'Página não encontrada.' };

        const data = pageSnap.data()!;
        const updates: any = {};
        let moved = 0;
        let failed = 0;

        const tryMove = async (fileObj: any, folder: string) => {
            if (!fileObj?.path) return fileObj;
            // Arquivo ainda em temp/ — mover para lovepages/
            if (fileObj.path.startsWith('temp/')) {
                const fileName = fileObj.path.split('/').pop();
                if (!fileName) return fileObj;
                const newPath = `lovepages/${pageId}/${folder}/${fileName}`;
                const result = await moveFile(bucket, fileObj.path, newPath);
                if (result.success) { moved++; return { url: result.url, path: newPath }; }
                else { failed++; return fileObj; }
            }
            // Arquivo já em lovepages/ mas com URL quebrada — só corrige a URL
            if (fileObj.path.startsWith('lovepages/')) {
                const fixed = await fixBrokenUrl(bucket, fileObj);
                if (fixed.url !== fileObj.url) moved++;
                return fixed;
            }
            return fileObj;
        };

        // Galeria
        if (data.galleryImages?.length) {
            const updated = await Promise.all(data.galleryImages.map((img: any) => tryMove(img, 'gallery')));
            updates.galleryImages = updated;
        }

        // Timeline
        if (data.timelineEvents?.length) {
            const updated = await Promise.all(data.timelineEvents.map(async (ev: any) => {
                if (ev.image) ev.image = await tryMove(ev.image, 'timeline');
                return ev;
            }));
            updates.timelineEvents = updated;
        }

        // Puzzle
        if (data.puzzleImage) updates.puzzleImage = await tryMove(data.puzzleImage, 'puzzle');

        // Áudio
        if (data.audioRecording) updates.audioRecording = await tryMove(data.audioRecording, 'audio');

        // Vídeo
        if (data.backgroundVideo) updates.backgroundVideo = await tryMove(data.backgroundVideo, 'video');

        // Jogo da memória
        if (data.memoryGameImages?.length) {
            const updated = await Promise.all(data.memoryGameImages.map((img: any) => tryMove(img, 'memory-game')));
            updates.memoryGameImages = updated;
        }

        if (Object.keys(updates).length > 0) {
            await pageRef.update(updates);
        }

        // Marcar failed_file_moves relacionados como resolvidos
        const failedMovesSnap = await db.collection('failed_file_moves')
            .where('pageId', '==', pageId)
            .where('resolved', '==', false)
            .get();
        
        const batch = db.batch();
        failedMovesSnap.docs.forEach(doc => {
            batch.update(doc.ref, { resolved: true, resolvedAt: Timestamp.now(), resolution: 'manual_reprocess' });
        });
        await batch.commit();

        revalidatePath('/admin/pages');
        return { success: true, moved, failed };

    } catch (error: any) {
        return { success: false, moved: 0, failed: 0, error: error.message };
    }
}

// ── REMOVER REFERÊNCIAS QUEBRADAS ─────────────────────────────────
// Quando arquivos já foram limpos pelo Cloud Storage (temp/ expira ~24h),
// o reprocessPageFiles não consegue mover (source não existe). Essa função
// checa quais arquivos ainda existem no bucket e REMOVE do doc Firestore
// apenas as referências órfãs. Fotos irrecuperáveis — só use quando cliente
// confirmar que não tem backup.
import { FieldValue } from 'firebase-admin/firestore';

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
// Varre recursivamente qualquer valor procurando `path` que começa com 'temp/'.
// Detecta o problema MESMO quando `failed_file_moves` não foi escrito (bug
// que acontecia quando o próprio `.add()` também falhava).
function findTempPaths(obj: any, paths: string[] = []): string[] {
    if (!obj || typeof obj !== 'object') return paths;
    if (Array.isArray(obj)) {
        obj.forEach(item => findTempPaths(item, paths));
        return paths;
    }
    if (typeof obj.path === 'string' && obj.path.startsWith('temp/')) {
        paths.push(obj.path);
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
    const allFailedSnap = await db.collection('failed_file_moves').get();
    const totalFailed = allFailedSnap.size;
    const totalResolved = allFailedSnap.docs.filter(d => d.data().resolved).length;
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
