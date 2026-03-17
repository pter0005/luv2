export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';

// Bucket name será lido dinamicamente do getAdminStorage()
let PUBLIC_BASE = '';

function isPublicUrlCorrect(url: string, expectedPath: string): boolean {
  return url === `${PUBLIC_BASE}/${expectedPath}`;
}

function extractPath(fileObj: any): string | null {
  if (!fileObj) return null;
  if (typeof fileObj === 'string') return null; // URL-only strings can't be fixed without path
  return fileObj.path || null;
}

export async function GET(request: Request) {
  const started = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    const dryRun = searchParams.get('dry') === '1';

    const db = getAdminFirestore();
    const bucket = getAdminStorage();
    PUBLIC_BASE = `https://storage.googleapis.com/${bucket.name}`;

    // Use Firestore orderBy + offset for pagination (fine for ~167 docs)
    const snapshot = await db
      .collection('lovepages')
      .orderBy('__name__')
      .offset(offset)
      .limit(limit)
      .get();

    const totalSnapshot = await db.collection('lovepages').count().get();
    const totalCount = totalSnapshot.data().count;

    let fixed = 0;
    let skipped = 0;
    let errors = 0;
    const errorMessages: string[] = [];
    const fixedPages: string[] = [];

    /**
     * Fix a single file object: move from temp/ if needed, makePublic, return correct URL
     */
    const fixFile = async (
      fileObj: any,
      pageId: string,
      folder: string
    ): Promise<{ result: any; changed: boolean }> => {
      // Handle null/undefined
      if (!fileObj) return { result: fileObj, changed: false };

      // Handle string-only (just a URL, no path) — can't fix without knowing the storage path
      if (typeof fileObj === 'string') {
        return { result: fileObj, changed: false };
      }

      const oldPath = fileObj.path;
      if (!oldPath) return { result: fileObj, changed: false };

      const fileName = oldPath.split('/').pop();
      if (!fileName) return { result: fileObj, changed: false };

      // Determine target path
      const isTemp = oldPath.startsWith('temp/');
      const targetPath = isTemp
        ? `lovepages/${pageId}/${folder}/${fileName}`
        : oldPath;

      // Check if URL is already correct (skip unnecessary work on re-runs)
      if (!isTemp && fileObj.url && isPublicUrlCorrect(fileObj.url, targetPath)) {
        skipped++;
        return { result: fileObj, changed: false };
      }

      if (dryRun) {
        const newUrl = `${PUBLIC_BASE}/${targetPath}`;
        return {
          result: { path: targetPath, url: newUrl },
          changed: true,
        };
      }

      try {
        const targetFile = bucket.file(targetPath);

        if (isTemp) {
          const sourceFile = bucket.file(oldPath);

          // Check if source exists
          const [sourceExists] = await sourceFile.exists();
          if (!sourceExists) {
            // Source gone — check if target already exists (maybe already moved)
            const [targetExists] = await targetFile.exists();
            if (!targetExists) {
              errors++;
              errorMessages.push(`[${pageId}] Source missing & target missing: ${oldPath}`);
              return { result: fileObj, changed: false };
            }
            // Target exists, source doesn't — already moved, just fix URL
          } else {
            // Check if target already exists (avoid duplicate copy)
            const [targetExists] = await targetFile.exists();
            if (!targetExists) {
              await sourceFile.copy(targetFile);
            }
          }
        } else {
          // Not temp — just verify file exists before makePublic
          const [exists] = await targetFile.exists();
          if (!exists) {
            errors++;
            errorMessages.push(`[${pageId}] File not found at path: ${targetPath}`);
            return { result: fileObj, changed: false };
          }
        }

        // Make public and build URL
        await targetFile.makePublic();
        const publicUrl = `${PUBLIC_BASE}/${targetPath}`;

        return {
          result: { path: targetPath, url: publicUrl },
          changed: true,
        };
      } catch (e: any) {
        errors++;
        errorMessages.push(`[${pageId}] ${oldPath}: ${e.message}`);
        return { result: fileObj, changed: false };
      }
    };

    // Process each page
    for (const doc of snapshot.docs) {
      // Safety: abort if approaching Netlify timeout (20s of 26s)
      if (Date.now() - started > 20000) {
        errorMessages.push(`Timeout safety: stopped at doc ${doc.id}`);
        break;
      }

      const data = doc.data();
      const pageId = doc.id;
      const updates: Record<string, any> = {};
      let pageChanged = false;

      // --- Gallery Images ---
      if (data.galleryImages?.length) {
        const results = await Promise.all(
          data.galleryImages.map((img: any) => fixFile(img, pageId, 'gallery'))
        );
        if (results.some((r) => r.changed)) {
          updates.galleryImages = results.map((r) => r.result);
          pageChanged = true;
        }
      }

      // --- Puzzle Image ---
      if (data.puzzleImage) {
        const { result, changed } = await fixFile(data.puzzleImage, pageId, 'puzzle');
        if (changed) {
          updates.puzzleImage = result;
          pageChanged = true;
        }
      }

      // --- Audio Recording ---
      if (data.audioRecording) {
        const { result, changed } = await fixFile(data.audioRecording, pageId, 'audio');
        if (changed) {
          updates.audioRecording = result;
          pageChanged = true;
        }
      }

      // --- Background Video ---
      if (data.backgroundVideo) {
        const { result, changed } = await fixFile(data.backgroundVideo, pageId, 'video');
        if (changed) {
          updates.backgroundVideo = result;
          pageChanged = true;
        }
      }

      // --- Memory Game Images ---
      if (data.memoryGameImages?.length) {
        const results = await Promise.all(
          data.memoryGameImages.map((img: any) => fixFile(img, pageId, 'memory-game'))
        );
        if (results.some((r) => r.changed)) {
          updates.memoryGameImages = results.map((r) => r.result);
          pageChanged = true;
        }
      }

      // --- Timeline Events ---
      if (data.timelineEvents?.length) {
        let anyTimelineChanged = false;
        const fixedEvents = await Promise.all(
          data.timelineEvents.map(async (event: any) => {
            if (!event?.image) return event ?? null;
            const { result, changed } = await fixFile(event.image, pageId, 'timeline');
            if (changed) anyTimelineChanged = true;
            return { ...event, image: changed ? result : event.image };
          })
        );
        if (anyTimelineChanged) {
          // Sanitize undefined → null for Firestore
          updates.timelineEvents = JSON.parse(
            JSON.stringify(fixedEvents, (_, v) => (v === undefined ? null : v))
          );
          pageChanged = true;
        }
      }

      // --- Write updates ---
      if (pageChanged) {
        if (!dryRun) {
          const safeUpdates = JSON.parse(
            JSON.stringify(updates, (_, v) => (v === undefined ? null : v))
          );
          await doc.ref.update(safeUpdates);
        }
        fixed++;
        fixedPages.push(pageId);
      }
    }

    const nextOffset = offset + snapshot.docs.length;
    const hasMore = nextOffset < totalCount;

    return NextResponse.json({
      dryRun,
      fixed,
      skipped,
      errors,
      processed: `${Math.min(nextOffset, totalCount)}/${totalCount}`,
      elapsed: `${Date.now() - started}ms`,
      fixedPages,
      nextUrl: hasMore ? `/api/fix-images?offset=${nextOffset}${dryRun ? '&dry=1' : ''}` : null,
      errorMessages: errorMessages.slice(0, 20),
    });
  } catch (e: any) {
    return NextResponse.json(
      { fatal: e.message, stack: e.stack?.split('\n').slice(0, 5) },
      { status: 500 }
    );
  }
}
