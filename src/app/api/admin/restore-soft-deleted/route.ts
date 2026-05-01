export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-guard';
import { getAdminApp, getAdminStorage } from '@/lib/firebase/admin/config';

/**
 * Restaura objetos soft-deleted do bucket via JSON API do GCS.
 *
 * O cliente node @google-cloud/storage 6.x não expõe softDeleted/restore
 * diretamente, então chamamos a REST API com OAuth token do service account
 * (mesma cred do Admin SDK).
 *
 * Estado em memória do processo: ok pra single-instance (Netlify Function),
 * basta rodar 1x. Se reiniciar, perde o progresso, mas o restore é idempotente
 * (objeto já restaurado não aparece mais na listagem soft-deleted).
 */

type Job = {
  id: string;
  status: 'running' | 'done' | 'error';
  startedAt: number;
  finishedAt?: number;
  prefix: string;
  hoursWindow: number | null;
  totalFound: number;
  restored: number;
  failed: number;
  errors: string[];
  done: boolean;
};

const JOBS = new Map<string, Job>();

async function getAccessToken(): Promise<string> {
  const app = getAdminApp();
  const cred: any = (app as any).options?.credential;
  if (!cred?.getAccessToken) throw new Error('no_access_token_method');
  const t = await cred.getAccessToken();
  return t.access_token;
}

function parseTimestamp(v: any): number | null {
  if (!v) return null;
  if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
  if (typeof v === 'string') {
    const ms = Date.parse(v);
    if (!isNaN(ms)) return ms;
    const num = Number(v);
    if (!isNaN(num)) return num < 1e12 ? num * 1000 : num;
  }
  return null;
}

async function listSoftDeleted(
  bucket: string,
  prefix: string,
  token: string,
  deletedAfterMs: number | null,
): Promise<Array<{ name: string; generation: string; size: string; timeDeleted: number | null }>> {
  const all: Array<{ name: string; generation: string; size: string; timeDeleted: number | null }> = [];
  let pageToken = '';
  // Sem fields= filter — GCS pode omitir timeDeleted se não for fields-friendly.
  // Pegamos o objeto inteiro (default response) e extraímos o que precisamos.
  for (let i = 0; i < 200; i++) {
    const url = new URL(`https://storage.googleapis.com/storage/v1/b/${bucket}/o`);
    url.searchParams.set('softDeleted', 'true');
    url.searchParams.set('prefix', prefix);
    url.searchParams.set('maxResults', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`list_failed_${res.status}: ${txt.slice(0, 200)}`);
    }
    const data: any = await res.json();
    if (Array.isArray(data.items)) {
      for (const it of data.items) {
        if (!it?.name || !it?.generation) continue;
        // softDeleteTime é o nome novo, timeDeleted é legacy — aceita ambos.
        const t = parseTimestamp(it.softDeleteTime || it.timeDeleted || it.updated);
        if (deletedAfterMs !== null && t !== null && t < deletedAfterMs) continue;
        // Se NÃO tem timestamp, INCLUI por padrão (não filtra fora).
        all.push({ name: it.name, generation: String(it.generation), size: String(it.size || 0), timeDeleted: t });
      }
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return all;
}

async function restoreOne(bucket: string, name: string, generation: string, token: string): Promise<void> {
  const encName = encodeURIComponent(name);
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encName}/restore?generation=${generation}`;
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Length': '0' } });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`restore_${res.status}: ${txt.slice(0, 120)}`);
  }
}

async function runJob(jobId: string, prefix: string, deletedAfterMs: number | null) {
  const job = JOBS.get(jobId)!;
  try {
    const token = await getAccessToken();
    const bucket = getAdminStorage().name;
    const allItems = await listSoftDeleted(bucket, prefix, token, null);
    const items = deletedAfterMs !== null
      ? allItems.filter(it => it.timeDeleted === null || it.timeDeleted >= deletedAfterMs)
      : allItems;
    job.totalFound = items.length;
    if (items.length === 0) {
      job.status = 'done';
      job.done = true;
      job.finishedAt = Date.now();
      return;
    }

    const CONCURRENCY = 12;
    let cursor = 0;
    async function worker() {
      while (cursor < items.length) {
        const idx = cursor++;
        const it = items[idx];
        try {
          await restoreOne(bucket, it.name, it.generation, token);
          job.restored++;
        } catch (err: any) {
          job.failed++;
          if (job.errors.length < 30) job.errors.push(`${it.name}: ${err?.message || err}`);
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
  const prefix = typeof body.prefix === 'string' && body.prefix ? body.prefix : 'temp/';
  const dryRun = !!body.dryRun;
  // Janela em horas (ex: 48). null = sem filtro (restaura tudo da janela soft-delete).
  const hoursWindow = Number.isFinite(body.hoursWindow) && body.hoursWindow > 0 ? Number(body.hoursWindow) : null;
  const deletedAfterMs = hoursWindow !== null ? Date.now() - hoursWindow * 60 * 60 * 1000 : null;

  if (dryRun) {
    try {
      const token = await getAccessToken();
      const bucket = getAdminStorage().name;
      // Sempre lista TUDO (sem filtro server) e filtra na memória pra dar diagnóstico
      const allItems = await listSoftDeleted(bucket, prefix, token, null);
      const filteredItems = deletedAfterMs !== null
        ? allItems.filter(it => it.timeDeleted === null || it.timeDeleted >= deletedAfterMs)
        : allItems;
      const withTimestamp = allItems.filter(it => it.timeDeleted !== null).length;
      const totalSize = filteredItems.reduce((sum, it) => sum + Number(it.size || 0), 0);
      return NextResponse.json({
        ok: true, dryRun: true,
        count: filteredItems.length,
        totalSizeMB: Math.round(totalSize / 1024 / 1024),
        sample: filteredItems.slice(0, 5).map(i => i.name),
        diagnostic: {
          totalInBucket: allItems.length,
          withTimestamp,
          withoutTimestamp: allItems.length - withTimestamp,
          filterApplied: deletedAfterMs !== null,
          cutoffMs: deletedAfterMs,
        },
      });
    } catch (err: any) {
      return NextResponse.json({ error: 'list_failed', message: err?.message }, { status: 500 });
    }
  }

  const jobId = `restore_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: Job = {
    id: jobId,
    status: 'running',
    startedAt: Date.now(),
    prefix,
    hoursWindow,
    totalFound: 0,
    restored: 0,
    failed: 0,
    errors: [],
    done: false,
  };
  JOBS.set(jobId, job);
  runJob(jobId, prefix, deletedAfterMs); // fire-and-forget
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
  // Lista todos os jobs (debug)
  return NextResponse.json({ jobs: Array.from(JOBS.values()).slice(-10) });
}
