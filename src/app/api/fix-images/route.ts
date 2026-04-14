export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { isAdminRequest } from '@/lib/admin-guard';

let PUBLIC_BASE = '';

function isPublicUrlCorrect(url: string, expectedPath: string): boolean {
  return url === `${PUBLIC_BASE}/${expectedPath}`;
}

// ========================
// MODE: SCAN — Check file existence in batches
// ========================
async function handleScan(request: Request) {
  const started = Date.now();
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '10');

  const db = getAdminFirestore();
  const bucket = getAdminStorage();

  const snapshot = await db.collection('lovepages').orderBy('__name__').offset(offset).limit(limit).get();
  const totalSnapshot = await db.collection('lovepages').count().get();
  const totalCount = totalSnapshot.data().count;

  const pages: any[] = [];

  for (const doc of snapshot.docs) {
    if (Date.now() - started > 20000) break;

    const data = doc.data();
    const pageId = doc.id;
    let totalFiles = 0;
    let tempFiles = 0;
    let existingFiles = 0;
    let missingFiles = 0;
    let badUrlFiles = 0;

    const checkFile = async (obj: any) => {
      if (!obj?.path) return;
      totalFiles++;

      const isTemp = obj.path.startsWith('temp/');
      if (isTemp) tempFiles++;

      // Check if file actually exists
      try {
        const targetPath = isTemp
          ? `lovepages/${pageId}/${obj.path.split('/').slice(2).join('/')}` // approximate target
          : obj.path;

        // Check source (temp) first, then target (lovepages)
        if (isTemp) {
          const [sourceExists] = await bucket.file(obj.path).exists();
          if (sourceExists) {
            existingFiles++;
            return;
          }
          // Source gone, check if already moved
          const [targetExists] = await bucket.file(targetPath).exists();
          if (targetExists) {
            existingFiles++;
            badUrlFiles++;
            return;
          }
          missingFiles++;
        } else {
          const [exists] = await bucket.file(obj.path).exists();
          if (exists) {
            existingFiles++;
            // Check if URL is correct
            const expectedUrl = `https://storage.googleapis.com/${bucket.name}/${obj.path}`;
            if (obj.url !== expectedUrl) badUrlFiles++;
          } else {
            missingFiles++;
          }
        }
      } catch {
        missingFiles++;
      }
    };

    const allFiles: any[] = [];
    if (data.galleryImages?.length) allFiles.push(...data.galleryImages);
    if (data.puzzleImage) allFiles.push(data.puzzleImage);
    if (data.audioRecording) allFiles.push(data.audioRecording);
    if (data.backgroundVideo) allFiles.push(data.backgroundVideo);
    if (data.memoryGameImages?.length) allFiles.push(...data.memoryGameImages);
    if (data.timelineEvents?.length) {
      data.timelineEvents.forEach((e: any) => { if (e?.image) allFiles.push(e.image); });
    }

    await Promise.all(allFiles.map(checkFile));

    let status: 'ok' | 'fixable' | 'lost' | 'partial' = 'ok';
    if (missingFiles > 0 && existingFiles === 0) status = 'lost';
    else if (missingFiles > 0 && existingFiles > 0) status = 'partial';
    else if (badUrlFiles > 0 || tempFiles > 0) status = 'fixable';

    pages.push({
      id: pageId,
      userId: data.userId,
      plan: data.plan || 'unknown',
      title: data.title || 'Sem título',
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      totalFiles,
      tempFiles,
      existingFiles,
      missingFiles,
      badUrlFiles,
      status,
    });
  }

  const nextOffset = offset + snapshot.docs.length;
  const hasMore = nextOffset < totalCount;

  return NextResponse.json({
    pages,
    processed: `${Math.min(nextOffset, totalCount)}/${totalCount}`,
    elapsed: `${Date.now() - started}ms`,
    nextUrl: hasMore ? `/api/fix-images?mode=scan&offset=${nextOffset}` : null,
    summary: {
      ok: pages.filter((p) => p.status === 'ok').length,
      fixable: pages.filter((p) => p.status === 'fixable').length,
      partial: pages.filter((p) => p.status === 'partial').length,
      lost: pages.filter((p) => p.status === 'lost').length,
    },
  });
}

// ========================
// MODE: DIAGNOSTIC — Single page or overview
// ========================
async function handleDiagnostic(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('pageId');

  const db = getAdminFirestore();
  const bucket = getAdminStorage();

  if (pageId) {
    const doc = await db.collection('lovepages').doc(pageId).get();
    if (!doc.exists) return NextResponse.json({ error: 'Page not found' });

    const data = doc.data()!;
    const userId = data.userId || 'unknown';

    const firestorePaths: string[] = [];
    const addPath = (obj: any) => { if (obj?.path) firestorePaths.push(obj.path); };
    data.galleryImages?.forEach(addPath);
    addPath(data.puzzleImage);
    addPath(data.audioRecording);
    addPath(data.backgroundVideo);
    data.memoryGameImages?.forEach(addPath);
    data.timelineEvents?.forEach((e: any) => addPath(e?.image));

    const checks = await Promise.all(
      firestorePaths.map(async (path) => {
        try { const [exists] = await bucket.file(path).exists(); return { path, exists }; }
        catch { return { path, exists: false }; }
      })
    );

    const [lovepageFiles] = await bucket.getFiles({ prefix: `lovepages/${pageId}/` });
    const [tempFiles] = await bucket.getFiles({ prefix: `temp/${userId}/` });

    return NextResponse.json({
      pageId, userId,
      title: data.title,
      plan: data.plan,
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

  // Overview
  const totalSnapshot = await db.collection('lovepages').count().get();
  const [tempFiles] = await bucket.getFiles({ prefix: 'temp/', maxResults: 20 });
  const [lovepageFiles] = await bucket.getFiles({ prefix: 'lovepages/', maxResults: 20 });

  return NextResponse.json({
    totalPages: totalSnapshot.data().count,
    storageOverview: {
      tempFilesFound: tempFiles.length,
      tempSamples: tempFiles.map((f) => f.name).slice(0, 10),
      lovepageFilesFound: lovepageFiles.length,
      lovepageSamples: lovepageFiles.map((f) => f.name).slice(0, 10),
    },
    bucketName: bucket.name,
  });
}

// ========================
// MODE: FIX — Move files and fix URLs
// ========================
async function handleFix(request: Request) {
  const started = Date.now();
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '10');
  const dryRun = searchParams.get('dry') === '1';

  const db = getAdminFirestore();
  const bucket = getAdminStorage();
  PUBLIC_BASE = `https://storage.googleapis.com/${bucket.name}`;

  const snapshot = await db.collection('lovepages').orderBy('__name__').offset(offset).limit(limit).get();
  const totalSnapshot = await db.collection('lovepages').count().get();
  const totalCount = totalSnapshot.data().count;

  let fixed = 0;
  let skipped = 0;
  let errors = 0;
  const errorMessages: string[] = [];
  const fixedPages: string[] = [];

  const fixFile = async (fileObj: any, pageId: string, folder: string): Promise<{ result: any; changed: boolean }> => {
    if (!fileObj || typeof fileObj === 'string') return { result: fileObj, changed: false };
    const oldPath = fileObj.path;
    if (!oldPath) return { result: fileObj, changed: false };
    const fileName = oldPath.split('/').pop();
    if (!fileName) return { result: fileObj, changed: false };

    const isTemp = oldPath.startsWith('temp/');
    const targetPath = isTemp ? `lovepages/${pageId}/${folder}/${fileName}` : oldPath;

    if (!isTemp && fileObj.url && isPublicUrlCorrect(fileObj.url, targetPath)) {
      skipped++;
      return { result: fileObj, changed: false };
    }

    if (dryRun) {
      return { result: { path: targetPath, url: `${PUBLIC_BASE}/${targetPath}` }, changed: true };
    }

    try {
      const targetFile = bucket.file(targetPath);

      if (isTemp) {
        const sourceFile = bucket.file(oldPath);
        const [sourceExists] = await sourceFile.exists();
        if (!sourceExists) {
          const [targetExists] = await targetFile.exists();
          if (!targetExists) {
            errors++;
            errorMessages.push(`[${pageId}] Arquivo perdido: ${oldPath}`);
            return { result: fileObj, changed: false };
          }
        } else {
          const [targetExists] = await targetFile.exists();
          if (!targetExists) await sourceFile.copy(targetFile);
        }
      } else {
        const [exists] = await targetFile.exists();
        if (!exists) {
          errors++;
          errorMessages.push(`[${pageId}] Não encontrado: ${targetPath}`);
          return { result: fileObj, changed: false };
        }
      }

      await targetFile.makePublic();
      return { result: { path: targetPath, url: `${PUBLIC_BASE}/${targetPath}` }, changed: true };
    } catch (e: any) {
      errors++;
      errorMessages.push(`[${pageId}] ${oldPath}: ${e.message}`);
      return { result: fileObj, changed: false };
    }
  };

  for (const doc of snapshot.docs) {
    if (Date.now() - started > 20000) {
      errorMessages.push(`Timeout: parou em ${doc.id}`);
      break;
    }

    const data = doc.data();
    const pageId = doc.id;
    const updates: Record<string, any> = {};
    let pageChanged = false;

    if (data.galleryImages?.length) {
      const results = await Promise.all(data.galleryImages.map((img: any) => fixFile(img, pageId, 'gallery')));
      if (results.some((r) => r.changed)) { updates.galleryImages = results.map((r) => r.result); pageChanged = true; }
    }

    if (data.puzzleImage) {
      const { result, changed } = await fixFile(data.puzzleImage, pageId, 'puzzle');
      if (changed) { updates.puzzleImage = result; pageChanged = true; }
    }

    if (data.audioRecording) {
      const { result, changed } = await fixFile(data.audioRecording, pageId, 'audio');
      if (changed) { updates.audioRecording = result; pageChanged = true; }
    }

    if (data.backgroundVideo) {
      const { result, changed } = await fixFile(data.backgroundVideo, pageId, 'video');
      if (changed) { updates.backgroundVideo = result; pageChanged = true; }
    }

    if (data.memoryGameImages?.length) {
      const results = await Promise.all(data.memoryGameImages.map((img: any) => fixFile(img, pageId, 'memory-game')));
      if (results.some((r) => r.changed)) { updates.memoryGameImages = results.map((r) => r.result); pageChanged = true; }
    }

    if (data.timelineEvents?.length) {
      let anyChanged = false;
      const fixedEvents = await Promise.all(
        data.timelineEvents.map(async (event: any) => {
          if (!event?.image) return event ?? null;
          const { result, changed } = await fixFile(event.image, pageId, 'timeline');
          if (changed) anyChanged = true;
          return { ...event, image: changed ? result : event.image };
        })
      );
      if (anyChanged) {
        updates.timelineEvents = JSON.parse(JSON.stringify(fixedEvents, (_, v) => v === undefined ? null : v));
        pageChanged = true;
      }
    }

    if (pageChanged) {
      if (!dryRun) {
        const safeUpdates = JSON.parse(JSON.stringify(updates, (_, v) => v === undefined ? null : v));
        await doc.ref.update(safeUpdates);
      }
      fixed++;
      fixedPages.push(pageId);
    }
  }

  const nextOffset = offset + snapshot.docs.length;
  const hasMore = nextOffset < totalCount;

  return NextResponse.json({
    dryRun, fixed, skipped, errors,
    processed: `${Math.min(nextOffset, totalCount)}/${totalCount}`,
    elapsed: `${Date.now() - started}ms`,
    fixedPages,
    nextUrl: hasMore ? `/api/fix-images?offset=${nextOffset}${dryRun ? '&dry=1' : ''}` : null,
    errorMessages: errorMessages.slice(0, 20),
  });
}

// ========================
// ROUTER
// ========================
export async function GET(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    if (mode === 'scan') return handleScan(request);
    if (mode === 'diagnostic') return handleDiagnostic(request);
    return handleFix(request);
  } catch (e: any) {
    return NextResponse.json({ fatal: e.message, stack: e.stack?.split('\n').slice(0, 5) }, { status: 500 });
  }
}

    