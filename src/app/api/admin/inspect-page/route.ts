export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-guard';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin/config';

/**
 * Inspetor de página: dump completo do doc lovepage + intent ligado
 * + verifica se cada arquivo referenciado existe no Storage. Sem isso
 * a gente fica adivinhando se uma página tá com bug ou se user não
 * preencheu mesmo.
 */

function tsToISO(v: any): string | null {
  if (!v) return null;
  if (typeof v.toDate === 'function') try { return v.toDate().toISOString(); } catch { return null; }
  if (v._seconds) return new Date(v._seconds * 1000).toISOString();
  if (v.seconds) return new Date(v.seconds * 1000).toISOString();
  return null;
}

function deepSerialize(v: any): any {
  if (v === null || v === undefined) return v;
  if (typeof v === 'object') {
    const iso = tsToISO(v);
    if (iso) return iso;
    if (Array.isArray(v)) return v.map(deepSerialize);
    const out: any = {};
    for (const k in v) out[k] = deepSerialize(v[k]);
    return out;
  }
  return v;
}

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const pageId = req.nextUrl.searchParams.get('pageId');
  if (!pageId) return NextResponse.json({ error: 'missing_pageId' }, { status: 400 });

  try {
    const db = getAdminFirestore();
    const bucket = getAdminStorage();

    const [pageSnap, intentsSnap] = await Promise.all([
      db.collection('lovepages').doc(pageId).get(),
      db.collection('payment_intents').where('lovePageId', '==', pageId).limit(1).get(),
    ]);

    if (!pageSnap.exists) return NextResponse.json({ error: 'page_not_found', pageId });

    const pageData = pageSnap.data() || {};
    const intentData = intentsSnap.empty ? null : intentsSnap.docs[0].data();
    const intentId = intentsSnap.empty ? null : intentsSnap.docs[0].id;

    // Coleta TODAS as refs de arquivo (com path)
    type FileRef = { field: string; index?: number; path: string; url: string };
    const refs: FileRef[] = [];
    const collect = (val: any, field: string, idx?: number) => {
      if (!val) return;
      if (Array.isArray(val)) { val.forEach((v, i) => collect(v, field, i)); return; }
      if (typeof val === 'object') {
        if (val.path && val.url) refs.push({ field, index: idx, path: val.path, url: val.url });
        // Timeline events tem `image` aninhado
        if (val.image) collect(val.image, `${field}[${idx}].image`);
      }
    };
    collect(pageData.galleryImages, 'galleryImages');
    collect(pageData.timelineEvents, 'timelineEvents');
    collect(pageData.memoryGameImages, 'memoryGameImages');
    collect(pageData.puzzleImage, 'puzzleImage');
    collect(pageData.audioRecording, 'audioRecording');
    collect(pageData.backgroundVideo, 'backgroundVideo');

    // Verifica se cada arquivo existe no Storage
    const fileChecks = await Promise.all(
      refs.map(async (r) => {
        try {
          const [exists] = await bucket.file(r.path).exists();
          let size = 0;
          if (exists) {
            try { const [meta] = await bucket.file(r.path).getMetadata(); size = Number(meta.size || 0); } catch { /* ignore */ }
          }
          return { ...r, exists, size };
        } catch (e: any) {
          return { ...r, exists: false, size: 0, error: e?.message };
        }
      }),
    );

    // Comparison: o que o intent tinha vs o que sobreviveu na lovepage
    const intentCounts = intentData ? {
      gallery: intentData.galleryImages?.length || 0,
      timeline: intentData.timelineEvents?.length || 0,
      memory: intentData.memoryGameImages?.length || 0,
      hasPuzzle: !!intentData.puzzleImage,
      hasAudio: !!intentData.audioRecording,
      hasVideo: !!intentData.backgroundVideo,
      enableQuiz: !!intentData.enableQuiz,
      quizCount: intentData.quizQuestions?.length || 0,
      enableWordGame: !!intentData.enableWordGame,
      wordGameCount: intentData.wordGameQuestions?.length || 0,
      enableMemoryGame: !!intentData.enableMemoryGame,
      enablePuzzle: !!intentData.enablePuzzle,
    } : null;

    const pageCounts = {
      gallery: pageData.galleryImages?.length || 0,
      timeline: pageData.timelineEvents?.length || 0,
      memory: pageData.memoryGameImages?.length || 0,
      hasPuzzle: !!pageData.puzzleImage,
      hasAudio: !!pageData.audioRecording,
      hasVideo: !!pageData.backgroundVideo,
      enableQuiz: !!pageData.enableQuiz,
      quizCount: pageData.quizQuestions?.length || 0,
      enableWordGame: !!pageData.enableWordGame,
      wordGameCount: pageData.wordGameQuestions?.length || 0,
      enableMemoryGame: !!pageData.enableMemoryGame,
      enablePuzzle: !!pageData.enablePuzzle,
    };

    // Diagnóstico: o que o user PROVAVELMENTE configurou mas sumiu
    const diagnostics: string[] = [];
    if (intentCounts) {
      if (intentCounts.gallery > pageCounts.gallery) diagnostics.push(`Gallery: intent tinha ${intentCounts.gallery} fotos, página tem ${pageCounts.gallery}`);
      if (intentCounts.timeline > pageCounts.timeline) diagnostics.push(`Timeline: intent tinha ${intentCounts.timeline} eventos, página tem ${pageCounts.timeline}`);
      if (intentCounts.memory > pageCounts.memory) diagnostics.push(`Memory: intent tinha ${intentCounts.memory} fotos, página tem ${pageCounts.memory}`);
      if (intentCounts.enableQuiz && !pageCounts.enableQuiz) diagnostics.push(`Quiz: intent tinha enableQuiz=true, página NÃO tem`);
      if (intentCounts.quizCount > pageCounts.quizCount) diagnostics.push(`Quiz: intent tinha ${intentCounts.quizCount} perguntas, página tem ${pageCounts.quizCount}`);
      if (intentCounts.enableWordGame && !pageCounts.enableWordGame) diagnostics.push(`WordGame: intent tinha enableWordGame=true, página NÃO tem`);
      if (intentCounts.enableMemoryGame && !pageCounts.enableMemoryGame) diagnostics.push(`MemoryGame: intent tinha enableMemoryGame=true, página NÃO tem`);
      if (intentCounts.enablePuzzle && !pageCounts.enablePuzzle) diagnostics.push(`Puzzle: intent tinha enablePuzzle=true, página NÃO tem`);
      if (intentCounts.hasAudio && !pageCounts.hasAudio) diagnostics.push(`Audio: intent tinha audioRecording, página NÃO tem`);
    }
    const fileMissing = fileChecks.filter(f => !f.exists);
    if (fileMissing.length > 0) {
      diagnostics.push(`${fileMissing.length} arquivos referenciados não existem no Storage`);
    }

    return NextResponse.json({
      pageId,
      intentId,
      pageData: deepSerialize(pageData),
      intentData: intentData ? deepSerialize(intentData) : null,
      intentCounts,
      pageCounts,
      fileChecks,
      diagnostics,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'inspect_failed', message: err?.message }, { status: 500 });
  }
}
