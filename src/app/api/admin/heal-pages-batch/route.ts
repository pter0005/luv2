export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-guard';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

/**
 * Varre lovepages e tenta reconectar imagens que estão em refs `temp/`
 * (arquivos que foram restaurados via soft-delete agora existem de novo
 * no Storage, então move pra lovepages/ e atualiza a URL no doc).
 *
 * Roda em background com tracking via /api/admin/heal-pages-batch?jobId=X.
 *
 * Janela: filtra lovepages criadas nas últimas N horas (default 72h, cobre
 * 48h soft-delete + margem). Ajustável via ?hoursWindow=.
 */

type HealJob = {
  id: string;
  status: 'running' | 'done' | 'error';
  startedAt: number;
  finishedAt?: number;
  hoursWindow: number | null;
  totalPages: number;
  pagesProcessed: number;
  pagesHealed: number;
  filesHealed: number;
  filesFailed: number;
  errors: string[];
  done: boolean;
};

const JOBS = new Map<string, HealJob>();

async function moveFile(bucket: any, oldPath: string, newPath: string): Promise<{ ok: boolean; url?: string }> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const src = bucket.file(oldPath);
      const dst = bucket.file(newPath);
      const [dstExists] = await dst.exists();
      if (!dstExists) {
        const [srcExists] = await src.exists();
        if (!srcExists) return { ok: false };
        await src.copy(dst);
      }
      const [md] = await dst.getMetadata();
      let token = md?.metadata?.firebaseStorageDownloadTokens;
      if (!token) {
        token = randomUUID();
        try { await dst.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } }); } catch { /* usa local */ }
      }
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newPath)}?alt=media&token=${token}`;
      return { ok: true, url };
    } catch {
      if (attempt < 3) await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  return { ok: false };
}

async function healOnePage(pageId: string, data: any, bucket: any): Promise<{ healed: number; failed: number }> {
  const updates: any = {};
  let healed = 0;
  let failed = 0;

  const tryHeal = async (obj: any, folder: string) => {
    if (!obj?.path?.startsWith('temp/')) return obj;
    const fileName = obj.path.split('/').pop();
    if (!fileName) return obj;
    const newPath = `lovepages/${pageId}/${folder}/${fileName}`;
    const r = await moveFile(bucket, obj.path, newPath);
    if (r.ok && r.url) { healed++; return { url: r.url, path: newPath }; }
    failed++;
    return obj;
  };

  if (Array.isArray(data.galleryImages)) {
    const updated = await Promise.all(data.galleryImages.map((i: any) => tryHeal(i, 'gallery')));
    if (updated.some((_: any, i: number) => updated[i] !== data.galleryImages[i])) updates.galleryImages = updated;
  }
  if (Array.isArray(data.timelineEvents)) {
    let changed = false;
    const updated = await Promise.all(data.timelineEvents.map(async (ev: any) => {
      if (ev?.image) {
        const h = await tryHeal(ev.image, 'timeline');
        if (h !== ev.image) { changed = true; return { ...ev, image: h }; }
      }
      return ev;
    }));
    if (changed) updates.timelineEvents = updated;
  }
  if (Array.isArray(data.memoryGameImages)) {
    const updated = await Promise.all(data.memoryGameImages.map((i: any) => tryHeal(i, 'memory-game')));
    if (updated.some((_: any, i: number) => updated[i] !== data.memoryGameImages[i])) updates.memoryGameImages = updated;
  }
  if (data.puzzleImage) {
    const h = await tryHeal(data.puzzleImage, 'puzzle');
    if (h !== data.puzzleImage) updates.puzzleImage = h;
  }
  if (data.audioRecording) {
    const h = await tryHeal(data.audioRecording, 'audio');
    if (h !== data.audioRecording) updates.audioRecording = h;
  }
  if (data.backgroundVideo) {
    const h = await tryHeal(data.backgroundVideo, 'video');
    if (h !== data.backgroundVideo) updates.backgroundVideo = h;
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = Timestamp.now();
    const db = getAdminFirestore();
    await db.collection('lovepages').doc(pageId).update(updates);
  }

  return { healed, failed };
}

async function runHealJob(jobId: string, hoursWindow: number | null) {
  const job = JOBS.get(jobId)!;
  try {
    const db = getAdminFirestore();
    const bucket = getAdminStorage();

    let q: any = db.collection('lovepages').orderBy('createdAt', 'desc');
    if (hoursWindow !== null) {
      const cutoff = Timestamp.fromMillis(Date.now() - hoursWindow * 60 * 60 * 1000);
      q = q.where('createdAt', '>=', cutoff);
    }
    const snap = await q.limit(2000).get();
    const candidates: Array<{ id: string; data: any }> = [];
    snap.forEach((doc: any) => {
      const data = doc.data();
      const hasTempRef = (Array.isArray(data.galleryImages) && data.galleryImages.some((i: any) => i?.path?.startsWith('temp/')))
        || (Array.isArray(data.timelineEvents) && data.timelineEvents.some((e: any) => e?.image?.path?.startsWith('temp/')))
        || (Array.isArray(data.memoryGameImages) && data.memoryGameImages.some((i: any) => i?.path?.startsWith('temp/')))
        || data.puzzleImage?.path?.startsWith('temp/')
        || data.audioRecording?.path?.startsWith('temp/')
        || data.backgroundVideo?.path?.startsWith('temp/');
      if (hasTempRef) candidates.push({ id: doc.id, data });
    });

    job.totalPages = candidates.length;
    if (candidates.length === 0) {
      job.status = 'done';
      job.done = true;
      job.finishedAt = Date.now();
      return;
    }

    const CONCURRENCY = 4;
    let cursor = 0;
    async function worker() {
      while (cursor < candidates.length) {
        const idx = cursor++;
        const c = candidates[idx];
        try {
          const r = await healOnePage(c.id, c.data, bucket);
          job.pagesProcessed++;
          job.filesHealed += r.healed;
          job.filesFailed += r.failed;
          if (r.healed > 0) job.pagesHealed++;
        } catch (err: any) {
          job.pagesProcessed++;
          if (job.errors.length < 30) job.errors.push(`${c.id}: ${err?.message || err}`);
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

    job.status = 'done';
    job.done = true;
    job.finishedAt = Date.now();
  } catch (err: any) {
    job.status = 'error';
    job.done = true;
    job.errors.push(`fatal: ${err?.message || err}`);
    job.finishedAt = Date.now();
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const hoursWindow = Number.isFinite(body.hoursWindow) && body.hoursWindow > 0 ? Number(body.hoursWindow) : null;
  const dryRun = !!body.dryRun;

  if (dryRun) {
    try {
      const db = getAdminFirestore();
      let q: any = db.collection('lovepages').orderBy('createdAt', 'desc');
      if (hoursWindow !== null) {
        const cutoff = Timestamp.fromMillis(Date.now() - hoursWindow * 60 * 60 * 1000);
        q = q.where('createdAt', '>=', cutoff);
      }
      const snap = await q.limit(2000).get();
      let pagesWithTempRefs = 0;
      let totalTempRefs = 0;
      snap.forEach((doc: any) => {
        const data = doc.data();
        let count = 0;
        if (Array.isArray(data.galleryImages)) count += data.galleryImages.filter((i: any) => i?.path?.startsWith('temp/')).length;
        if (Array.isArray(data.timelineEvents)) count += data.timelineEvents.filter((e: any) => e?.image?.path?.startsWith('temp/')).length;
        if (Array.isArray(data.memoryGameImages)) count += data.memoryGameImages.filter((i: any) => i?.path?.startsWith('temp/')).length;
        if (data.puzzleImage?.path?.startsWith('temp/')) count++;
        if (data.audioRecording?.path?.startsWith('temp/')) count++;
        if (data.backgroundVideo?.path?.startsWith('temp/')) count++;
        if (count > 0) { pagesWithTempRefs++; totalTempRefs += count; }
      });
      return NextResponse.json({ ok: true, dryRun: true, pagesScanned: snap.size, pagesWithTempRefs, totalTempRefs });
    } catch (err: any) {
      return NextResponse.json({ error: 'scan_failed', message: err?.message }, { status: 500 });
    }
  }

  const jobId = `heal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: HealJob = {
    id: jobId,
    status: 'running',
    startedAt: Date.now(),
    hoursWindow,
    totalPages: 0,
    pagesProcessed: 0,
    pagesHealed: 0,
    filesHealed: 0,
    filesFailed: 0,
    errors: [],
    done: false,
  };
  JOBS.set(jobId, job);
  runHealJob(jobId, hoursWindow);
  return NextResponse.json({ ok: true, jobId });
}

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  if (jobId) {
    const job = JOBS.get(jobId);
    if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(job);
  }
  return NextResponse.json({ jobs: Array.from(JOBS.values()).slice(-10) });
}
