export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = 10;

    const db = getAdminFirestore();
    const bucket = getAdminStorage();

    const allPages = await db.collection('lovepages').get();
    const docs = allPages.docs.slice(offset, offset + limit);
    
    let fixed = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    const moveAndFix = async (fileObj: any, pageId: string, folder: string) => {
        if (!fileObj?.path || !fileObj?.url) return fileObj;
        const oldPath = fileObj.path;
        const fileName = oldPath.split('/').pop();
        if (!fileName) return fileObj;
        const newPath = oldPath.startsWith('temp/') ? `lovepages/${pageId}/${folder}/${fileName}` : oldPath;

        try {
            if (oldPath.startsWith('temp/')) {
                const [exists] = await bucket.file(newPath).exists();
                if (!exists) await bucket.file(oldPath).copy(newPath);
            }
            await bucket.file(newPath).makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${newPath}`;
            return { path: newPath, url: publicUrl };
        } catch (e: any) {
            errors++;
            errorMessages.push(`${oldPath}: ${e.message}`);
            return fileObj;
        }
    };

    for (const doc of docs) {
        const data = doc.data();
        const pageId = doc.id;
        let updated: any = {};
        let hasChanges = false;

        const fix = async (fileObj: any, folder: string) => {
            if (!fileObj?.path) return fileObj;
            const result = await moveAndFix(fileObj, pageId, folder);
            if (result.url !== fileObj.url || result.path !== fileObj.path) hasChanges = true;
            return result;
        };

        if (data.galleryImages?.length) updated.galleryImages = await Promise.all(data.galleryImages.map((img: any) => fix(img, 'gallery')));
        if (data.puzzleImage) updated.puzzleImage = await fix(data.puzzleImage, 'puzzle');
        if (data.audioRecording) updated.audioRecording = await fix(data.audioRecording, 'audio');
        if (data.backgroundVideo) updated.backgroundVideo = await fix(data.backgroundVideo, 'video');
        if (data.memoryGameImages?.length) updated.memoryGameImages = await Promise.all(data.memoryGameImages.map((img: any) => fix(img, 'memory-game')));
        if (data.timelineEvents?.length) {
            updated.timelineEvents = await Promise.all(
                data.timelineEvents.map(async (e: any) => {
                    if (!e?.image) return e ?? null;
                    const fixedImg = await fix(e.image, 'timeline');
                    return JSON.parse(JSON.stringify({ ...e, image: fixedImg }, (_, v) => v === undefined ? null : v));
                })
            );
        }

        if (hasChanges) {
            const safeUpdate = JSON.parse(JSON.stringify(updated, (_, v) => v === undefined ? null : v));
            await doc.ref.update(safeUpdate);
            fixed++;
        }
    }

    const nextOffset = offset + limit;
    const hasMore = nextOffset < allPages.size;

    return NextResponse.json({ 
        fixed, errors, 
        processed: `${offset + docs.length}/${allPages.size}`,
        nextUrl: hasMore ? `/api/fix-images?offset=${nextOffset}` : null,
        errorMessages: errorMessages.slice(0, 10)
    });
  } catch (e: any) {
    return NextResponse.json({ fatal: e.message }, { status: 500 });
  }
}
