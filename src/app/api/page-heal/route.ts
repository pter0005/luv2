export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { randomUUID } from 'crypto';

/**
 * ENDPOINT: /api/page-heal?pageId=xxx
 *
 * Chamado do cliente quando uma página abre e detecta que tem URLs `temp/`.
 * Tenta recuperar os arquivos no ato — se ainda existirem no storage, move
 * pra lovepages/ e devolve `{ healed: true }`. Cliente recarrega depois de X ms.
 *
 * Rate limited: 3 chamadas por 5min por IP+pageId — evita spam em mobile
 * que monta/desmonta o componente várias vezes.
 *
 * NÃO requer auth — é reparação do próprio doc público. Só altera URLs
 * internas, nunca deleta nem muda conteúdo do cliente.
 */

async function moveFile(bucket: any, oldPath: string, newPath: string): Promise<{ ok: boolean; url?: string }> {
  let source404Count = 0;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const src = bucket.file(oldPath);
      const dst = bucket.file(newPath);
      const [dstExists] = await dst.exists();
      if (!dstExists) {
        const [srcExists] = await src.exists();
        if (!srcExists) {
          source404Count++;
          if (source404Count >= 2) return { ok: false };
          throw new Error('source_not_found_retry');
        }
        await src.copy(dst);
      }
      const [md] = await dst.getMetadata();
      let token = md?.metadata?.firebaseStorageDownloadTokens;
      if (!token) {
        token = randomUUID();
        try { await dst.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } }); } catch { /* usa o local */ }
      }
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newPath)}?alt=media&token=${token}`;
      return { ok: true, url };
    } catch (err: any) {
      if (attempt < 4) {
        const isRateLimit = err?.code === 429 || err?.code === 503;
        const wait = isRateLimit ? 2000 * attempt : 500 * attempt;
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  return { ok: false };
}

export async function GET(req: NextRequest) {
  const pageId = req.nextUrl.searchParams.get('pageId');
  if (!pageId || pageId.length > 50) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const ip = getClientIp(req);
  const { ok } = rateLimit(`page-heal:${ip}:${pageId}`, 3, 5 * 60_000);
  if (!ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  try {
    const db = getAdminFirestore();
    const bucket = getAdminStorage();
    const ref = db.collection('lovepages').doc(pageId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: true, healed: 0 });

    const data = snap.data()!;
    const updates: any = {};
    let healed = 0;

    const tryHeal = async (obj: any, folder: string) => {
      if (!obj?.path?.startsWith('temp/')) return obj;
      const fileName = obj.path.split('/').pop();
      if (!fileName) return obj;
      const newPath = `lovepages/${pageId}/${folder}/${fileName}`;
      const r = await moveFile(bucket, obj.path, newPath);
      if (r.ok && r.url) { healed++; return { url: r.url, path: newPath }; }
      return obj;
    };

    if (Array.isArray(data.galleryImages)) {
      const updated = await Promise.all(data.galleryImages.map((i: any) => tryHeal(i, 'gallery')));
      if (updated.some((_, i) => updated[i] !== data.galleryImages[i])) updates.galleryImages = updated;
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
      if (updated.some((_, i) => updated[i] !== data.memoryGameImages[i])) updates.memoryGameImages = updated;
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
      await ref.update(updates);
    }

    return NextResponse.json({ ok: true, healed });
  } catch (err: any) {
    return NextResponse.json({ error: 'failed', message: err?.message }, { status: 500 });
  }
}
