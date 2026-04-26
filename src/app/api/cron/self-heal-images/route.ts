export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { logCriticalError } from '@/lib/log-critical-error';
import { randomUUID } from 'crypto';

/**
 * CRON — SELF-HEAL IMAGES
 *
 * Varre páginas finalizadas nas últimas 72h procurando arquivos ainda em
 * `temp/`. Para cada um, tenta mover pra `lovepages/{pageId}/`. Se o arquivo
 * ainda existe no storage, recupera automaticamente. Se já foi deletado pelo
 * lifecycle do bucket, loga pra admin agir manualmente.
 *
 * Roda de 30 em 30 minutos. Idempotente — se já está em lovepages/, pula.
 *
 * DIFERENÇA do reprocessPageFiles (admin manual):
 * - Este roda automático sem intervenção
 * - Limitado a 72h (não processa páginas velhas pra economizar quota)
 * - Cap de 50 páginas por execução (resto fica pra próxima)
 * - Sem lock individual (admin cron é único)
 */

const MAX_PAGES_PER_RUN = 50;
const HOURS_BACK = 72;
const CONCURRENCY = 2;

async function mapWithLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = Array(Math.min(limit, items.length)).fill(null).map(async () => {
    while (true) {
      const current = idx++;
      if (current >= items.length) break;
      results[current] = await fn(items[current]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function moveFile(bucket: any, oldPath: string, newPath: string): Promise<{ ok: boolean; url?: string; missing?: boolean; error?: string }> {
  const maxRetries = 5;
  let lastError: any = null;
  let source404Count = 0;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const sourceFile = bucket.file(oldPath);
      const targetFile = bucket.file(newPath);
      const [targetExists] = await targetFile.exists();
      if (!targetExists) {
        const [sourceExists] = await sourceFile.exists();
        if (!sourceExists) {
          source404Count++;
          // Eventual consistency: só confirma missing após 2 checks negativos.
          if (source404Count >= 2) return { ok: false, missing: true, error: 'source_missing' };
          throw new Error('source_not_found_retry');
        }
        await sourceFile.copy(targetFile);
      }
      const [metadata] = await targetFile.getMetadata();
      let token: string | undefined = metadata?.metadata?.firebaseStorageDownloadTokens;
      if (!token) {
        token = randomUUID();
        try { await targetFile.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } }); } catch { /* fallback ao local */ }
      }
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newPath)}?alt=media&token=${token}`;
      (async () => {
        try {
          const [srcStill] = await sourceFile.exists();
          if (srcStill) await sourceFile.delete();
        } catch { /* ignore */ }
      })();
      return { ok: true, url };
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const isRateLimit = err?.code === 429 || err?.code === 503
          || err?.message?.includes('429') || err?.message?.includes('503');
        const base = isRateLimit ? 2000 * Math.pow(2, attempt - 1) : 600 * Math.pow(2, attempt - 1);
        const cap = isRateLimit ? 15_000 : 8_000;
        const jitter = base * (0.8 + Math.random() * 0.4);
        await new Promise(r => setTimeout(r, Math.min(jitter, cap)));
      }
    }
  }
  return { ok: false, error: lastError?.message || 'unknown' };
}

// Varre fileObject (ou array) e retorna {obj atualizado, contagem de moves}
async function processFileField(
  bucket: any,
  obj: any,
  pageId: string,
  folder: string,
): Promise<{ value: any; moved: number; missing: number; failed: number }> {
  let moved = 0, missing = 0, failed = 0;
  if (!obj?.path) return { value: obj, moved, missing, failed };
  if (!obj.path.startsWith('temp/')) return { value: obj, moved, missing, failed };

  const fileName = obj.path.split('/').pop();
  if (!fileName) return { value: obj, moved, missing, failed };

  const newPath = `lovepages/${pageId}/${folder}/${fileName}`;
  const result = await moveFile(bucket, obj.path, newPath);
  if (result.ok) { moved++; return { value: { url: result.url!, path: newPath }, moved, missing, failed }; }
  if (result.missing) missing++;
  else failed++;
  return { value: obj, moved, missing, failed };
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminFirestore();
  const bucket = getAdminStorage();

  // Páginas criadas nas últimas HOURS_BACK horas
  const cutoff = Timestamp.fromMillis(Date.now() - HOURS_BACK * 60 * 60 * 1000);
  let totalMoved = 0, totalMissing = 0, totalFailed = 0, pagesProcessed = 0;
  const pageResults: Array<{ pageId: string; moved: number; missing: number; failed: number }> = [];

  try {
    // Firestore não permite query por "tem path com temp/" — busca recentes
    // e filtra em memória. Com limit 200, memory-safe.
    const snap = await db.collection('lovepages')
      .where('createdAt', '>=', cutoff)
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    for (const doc of snap.docs) {
      if (pagesProcessed >= MAX_PAGES_PER_RUN) break;

      const data = doc.data();
      const pageId = doc.id;

      // Varredura rápida: tem algum path com temp/? Se não, skip.
      const json = JSON.stringify(data);
      if (!json.includes('"temp/')) continue;

      let moved = 0, missing = 0, failed = 0;
      const updates: any = {};

      // Gallery
      if (Array.isArray(data.galleryImages)) {
        const processed = await mapWithLimit(
          data.galleryImages,
          CONCURRENCY,
          (img: any) => processFileField(bucket, img, pageId, 'gallery'),
        );
        const updatedArr = processed.map(p => p.value);
        processed.forEach(p => { moved += p.moved; missing += p.missing; failed += p.failed; });
        if (processed.some(p => p.moved > 0)) updates.galleryImages = updatedArr;
      }
      // Timeline
      if (Array.isArray(data.timelineEvents)) {
        let changed = false;
        const updated = await mapWithLimit(data.timelineEvents, CONCURRENCY, async (ev: any) => {
          if (ev?.image) {
            const r = await processFileField(bucket, ev.image, pageId, 'timeline');
            moved += r.moved; missing += r.missing; failed += r.failed;
            if (r.moved > 0) changed = true;
            return { ...ev, image: r.value };
          }
          return ev;
        });
        if (changed) updates.timelineEvents = updated;
      }
      // Memory game
      if (Array.isArray(data.memoryGameImages)) {
        const processed = await mapWithLimit(
          data.memoryGameImages,
          CONCURRENCY,
          (img: any) => processFileField(bucket, img, pageId, 'memory-game'),
        );
        const updatedArr = processed.map(p => p.value);
        processed.forEach(p => { moved += p.moved; missing += p.missing; failed += p.failed; });
        if (processed.some(p => p.moved > 0)) updates.memoryGameImages = updatedArr;
      }
      // Single files
      for (const [field, folder] of [['puzzleImage', 'puzzle'], ['audioRecording', 'audio'], ['backgroundVideo', 'video']] as const) {
        if (data[field]) {
          const r = await processFileField(bucket, data[field], pageId, folder);
          moved += r.moved; missing += r.missing; failed += r.failed;
          if (r.moved > 0) updates[field] = r.value;
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = Timestamp.now();
        updates._lastSelfHealAt = Timestamp.now();
        try {
          await doc.ref.update(updates);
          // Marca failed_file_moves relacionados como resolvidos
          try {
            const fmSnap = await db.collection('failed_file_moves')
              .where('pageId', '==', pageId)
              .where('resolved', '==', false)
              .limit(100)
              .get();
            if (!fmSnap.empty) {
              const batch = db.batch();
              fmSnap.docs.forEach(d => batch.update(d.ref, {
                resolved: true,
                resolvedAt: FieldValue.serverTimestamp(),
                resolution: 'auto_self_heal',
              }));
              await batch.commit();
            }
          } catch { /* best effort */ }
        } catch (err) {
          console.warn('[self-heal] failed to update page', pageId, err);
        }
      }

      totalMoved += moved;
      totalMissing += missing;
      totalFailed += failed;
      pageResults.push({ pageId, moved, missing, failed });
      pagesProcessed++;
    }

    // Se houve arquivos missing (source sumiu = irrecuperável), alerta
    if (totalMissing > 0) {
      await logCriticalError('page_creation', `Self-heal: ${totalMissing} arquivos irrecuperáveis`, {
        totalMissing, totalFailed, pagesProcessed,
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      pagesProcessed,
      totalMoved,
      totalMissing,
      totalFailed,
      pages: pageResults.filter(p => p.moved + p.missing + p.failed > 0),
    });
  } catch (err: any) {
    console.error('[cron/self-heal-images]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
