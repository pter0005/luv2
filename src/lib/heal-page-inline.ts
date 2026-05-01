import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

/**
 * Heal SÍNCRONO chamado do server component da página antes de servir o HTML.
 *
 * Diferente do /api/page-heal (que roda em background depois do user ver
 * placeholder cinza), esse roda ANTES do HTML chegar — usuário nunca vê
 * "imagem indisponível" se o heal conseguir resolver em tempo.
 *
 * Timeout total: 3s. Se exceder, retorna data original e o auto-heal client
 * faz fallback (recarrega página depois de tentar). Tradeoff certo: TTFB
 * adicional de até 3s só pra páginas com refs temp/ — que são raras pós-fix.
 */

async function moveFile(bucket: any, oldPath: string, newPath: string, timeoutSig: { stop: boolean }): Promise<{ ok: boolean; url?: string }> {
  if (timeoutSig.stop) return { ok: false };
  // Apenas 1 attempt — não temos tempo pra retry no caminho síncrono
  try {
    const src = bucket.file(oldPath);
    const dst = bucket.file(newPath);
    const [dstExists] = await dst.exists();
    if (!dstExists) {
      const [srcExists] = await src.exists();
      if (!srcExists) return { ok: false };
      if (timeoutSig.stop) return { ok: false };
      await src.copy(dst);
    }
    if (timeoutSig.stop) return { ok: false };
    const [md] = await dst.getMetadata();
    let token = md?.metadata?.firebaseStorageDownloadTokens;
    if (!token) {
      token = randomUUID();
      try { await dst.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } }); } catch { /* usa local */ }
    }
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newPath)}?alt=media&token=${token}`;
    return { ok: true, url };
  } catch {
    return { ok: false };
  }
}

/**
 * Tenta curar refs temp/ e retorna data atualizado.
 * Se não tem temp refs OU timeout estourou, retorna data original.
 */
export async function healPageInline(pageId: string, data: any, timeoutMs = 3000): Promise<any> {
  // Quick check: tem alguma ref temp/?
  const docStr = JSON.stringify(data);
  if (!docStr.includes('"path":"temp/')) return data;

  const timeoutSig = { stop: false };
  const timer = setTimeout(() => { timeoutSig.stop = true; }, timeoutMs);

  try {
    const db = getAdminFirestore();
    const bucket = getAdminStorage();
    const updates: any = {};
    const updated = { ...data };

    const tryHeal = async (obj: any, folder: string) => {
      if (!obj?.path?.startsWith('temp/')) return obj;
      if (timeoutSig.stop) return obj;
      const fileName = obj.path.split('/').pop();
      if (!fileName) return obj;
      const newPath = `lovepages/${pageId}/${folder}/${fileName}`;
      const r = await moveFile(bucket, obj.path, newPath, timeoutSig);
      if (r.ok && r.url) return { url: r.url, path: newPath };
      return obj;
    };

    if (Array.isArray(data.galleryImages)) {
      const arr = await Promise.all(data.galleryImages.map((i: any) => tryHeal(i, 'gallery')));
      if (arr.some((_, i) => arr[i] !== data.galleryImages[i])) {
        updates.galleryImages = arr;
        updated.galleryImages = arr;
      }
    }
    if (timeoutSig.stop) { clearTimeout(timer); return updated; }

    if (Array.isArray(data.timelineEvents)) {
      let changed = false;
      const arr = await Promise.all(data.timelineEvents.map(async (ev: any) => {
        if (ev?.image && !timeoutSig.stop) {
          const h = await tryHeal(ev.image, 'timeline');
          if (h !== ev.image) { changed = true; return { ...ev, image: h }; }
        }
        return ev;
      }));
      if (changed) { updates.timelineEvents = arr; updated.timelineEvents = arr; }
    }
    if (timeoutSig.stop) { clearTimeout(timer); return updated; }

    if (Array.isArray(data.memoryGameImages)) {
      const arr = await Promise.all(data.memoryGameImages.map((i: any) => tryHeal(i, 'memory-game')));
      if (arr.some((_, i) => arr[i] !== data.memoryGameImages[i])) {
        updates.memoryGameImages = arr;
        updated.memoryGameImages = arr;
      }
    }
    if (timeoutSig.stop) { clearTimeout(timer); return updated; }

    if (data.puzzleImage) {
      const h = await tryHeal(data.puzzleImage, 'puzzle');
      if (h !== data.puzzleImage) { updates.puzzleImage = h; updated.puzzleImage = h; }
    }
    if (data.audioRecording) {
      const h = await tryHeal(data.audioRecording, 'audio');
      if (h !== data.audioRecording) { updates.audioRecording = h; updated.audioRecording = h; }
    }
    if (data.backgroundVideo) {
      const h = await tryHeal(data.backgroundVideo, 'video');
      if (h !== data.backgroundVideo) { updates.backgroundVideo = h; updated.backgroundVideo = h; }
    }

    // Persiste no Firestore (best-effort, fora do caminho de retorno)
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = Timestamp.now();
      // Não bloqueia retorno — write em background
      db.collection('lovepages').doc(pageId).update(updates).catch(() => {});
    }

    clearTimeout(timer);
    return updated;
  } catch (err) {
    clearTimeout(timer);
    return data;
  }
}
