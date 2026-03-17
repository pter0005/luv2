export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';

export async function GET() {
  try {
    const db = getAdminFirestore();
    const bucket = getAdminStorage();

    const pages = await db.collection('lovepages').get();
    let fixed = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (const doc of pages.docs) {
        const data = doc.data();
        let updated: any = {};
        let hasChanges = false;

        const fixUrl = async (fileObj: any) => {
            if (!fileObj?.path || !fileObj?.url) return fileObj;
            if (fileObj.url.includes('storage.googleapis.com') && !fileObj.url.includes('token=')) return fileObj;
            try {
                const [url] = await bucket.file(fileObj.path).getSignedUrl({
                    action: 'read',
                    expires: '01-01-2035',
                });
                hasChanges = true;
                return { ...fileObj, url };
            } catch (e: any) {
                errors++;
                errorMessages.push(`${fileObj.path}: ${e.message}`);
                return fileObj;
            }
        };

        if (data.galleryImages?.length) updated.galleryImages = await Promise.all(data.galleryImages.map(fixUrl));
        if (data.puzzleImage) updated.puzzleImage = await fixUrl(data.puzzleImage);
        if (data.audioRecording) updated.audioRecording = await fixUrl(data.audioRecording);
        if (data.timelineEvents?.length) {
            updated.timelineEvents = await Promise.all(
                data.timelineEvents.map(async (e: any) => ({
                    ...e,
                    image: e.image ? await fixUrl(e.image) : e.image
                }))
            );
        }

        if (hasChanges) {
            await doc.ref.update(updated);
            fixed++;
        }
    }

    return NextResponse.json({ fixed, errors, total: pages.size, errorMessages: errorMessages.slice(0, 10) });
  } catch (e: any) {
    return NextResponse.json({ fatal: e.message, stack: e.stack }, { status: 500 });
  }
}
