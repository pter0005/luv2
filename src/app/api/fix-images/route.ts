
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    const db = getAdminFirestore();
    const bucket = getAdminStorage();

    // If specific page requested, show detailed info
    if (pageId) {
      const doc = await db.collection('lovepages').doc(pageId).get();
      if (!doc.exists) return NextResponse.json({ error: 'Page not found' });

      const data = doc.data()!;
      const userId = data.userId || 'unknown';

      // Collect all file paths from Firestore
      const firestorePaths: string[] = [];
      const addPath = (obj: any) => {
        if (obj?.path) firestorePaths.push(obj.path);
      };

      data.galleryImages?.forEach(addPath);
      addPath(data.puzzleImage);
      addPath(data.audioRecording);
      addPath(data.backgroundVideo);
      data.memoryGameImages?.forEach(addPath);
      data.timelineEvents?.forEach((e: any) => addPath(e?.image));

      // Check which files actually exist
      const checks = await Promise.all(
        firestorePaths.map(async (path) => {
          try {
            const [exists] = await bucket.file(path).exists();
            return { path, exists };
          } catch {
            return { path, exists: false };
          }
        })
      );

      // Also check if files exist under lovepages/{pageId}/
      const [lovepageFiles] = await bucket.getFiles({ prefix: `lovepages/${pageId}/` });
      const [tempFiles] = await bucket.getFiles({ prefix: `temp/${userId}/` });

      return NextResponse.json({
        pageId,
        userId,
        firestorePaths: checks,
        existingInLovepages: lovepageFiles.map((f) => f.name),
        existingInTemp: tempFiles.map((f) => f.name),
        summary: {
          totalPaths: firestorePaths.length,
          existing: checks.filter((c) => c.exists).length,
          missing: checks.filter((c) => !c.exists).length,
        },
      });
    }

    // No pageId — show overview of all pages
    const allPages = await db.collection('lovepages').get();

    // Sample: check first 5 files from Storage
    const [tempFiles] = await bucket.getFiles({ prefix: 'temp/', maxResults: 20 });
    const [lovepageFiles] = await bucket.getFiles({ prefix: 'lovepages/', maxResults: 20 });

    // Count pages with temp paths
    let pagesWithTempPaths = 0;
    let totalFilePaths = 0;
    const samplePages: any[] = [];

    for (const doc of allPages.docs.slice(0, 5)) {
      const data = doc.data();
      let tempCount = 0;
      let totalCount = 0;

      const checkPath = (obj: any) => {
        if (obj?.path) {
          totalCount++;
          if (obj.path.startsWith('temp/')) tempCount++;
        }
      };

      data.galleryImages?.forEach(checkPath);
      checkPath(data.puzzleImage);
      checkPath(data.audioRecording);
      checkPath(data.backgroundVideo);
      data.memoryGameImages?.forEach(checkPath);
      data.timelineEvents?.forEach((e: any) => checkPath(e?.image));

      if (tempCount > 0) pagesWithTempPaths++;
      totalFilePaths += totalCount;

      samplePages.push({
        id: doc.id,
        userId: data.userId,
        totalFiles: totalCount,
        tempFiles: tempCount,
      });
    }

    return NextResponse.json({
      totalPages: allPages.size,
      samplePages,
      storageOverview: {
        tempFilesFound: tempFiles.length,
        tempSamples: tempFiles.map((f) => f.name).slice(0, 10),
        lovepageFilesFound: lovepageFiles.length,
        lovepageSamples: lovepageFiles.map((f) => f.name).slice(0, 10),
      },
      bucketName: bucket.name,
    });
  } catch (e: any) {
    return NextResponse.json({ fatal: e.message }, { status: 500 });
  }
}
