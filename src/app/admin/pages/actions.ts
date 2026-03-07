'use server';

import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

// ── HELPER: move um arquivo com retry (espelho do actions.ts) ─────
async function moveFile(bucket: any, oldPath: string, newPath: string): Promise<{ success: boolean; url?: string; error?: string }> {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await bucket.file(oldPath).move(newPath);
            const newFileRef = bucket.file(newPath);
            await newFileRef.makePublic();
            return { success: true, url: newFileRef.publicUrl() };
        } catch (error: any) {
            if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
            else return { success: false, error: error.message };
        }
    }
    return { success: false, error: 'unknown' };
}

// ── REPROCESSAR UMA PÁGINA ESPECÍFICA ────────────────────────────
export async function reprocessPageFiles(pageId: string): Promise<{ success: boolean; moved: number; failed: number; error?: string }> {
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
            if (!fileObj?.path?.startsWith('temp/')) return fileObj;
            const fileName = fileObj.path.split('/').pop();
            if (!fileName) return fileObj;
            const newPath = `lovepages/${pageId}/${folder}/${fileName}`;
            const result = await moveFile(bucket, fileObj.path, newPath);
            if (result.success) {
                moved++;
                return { url: result.url, path: newPath };
            } else {
                failed++;
                return fileObj;
            }
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

// ── BUSCAR DADOS PARA A PÁGINA DE MONITORAMENTO ───────────────────
export async function getAdminPagesData() {
    const db = getAdminFirestore();

    // Páginas com arquivos ainda em temp/ (failed_file_moves não resolvidos)
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

    // Buscar detalhes das páginas com issues
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
                createdAt: pageData.createdAt?.toDate?.()?.toISOString() || null,
                failedFiles: failedMovesByPage.get(pageId) || [],
            });
        } catch {
            // página pode ter sido deletada
        }
    }

    // Estatísticas gerais de failed_file_moves
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
