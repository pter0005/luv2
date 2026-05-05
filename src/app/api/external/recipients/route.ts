import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';
import {
  resolveMarket,
  currencyOfMarket,
  resolveAmount,
  toBRL,
  categorizeRecipient,
  FX,
  type RecipientCategory,
} from '@/lib/external-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na',
  'pra', 'para', 'que', 'com', 'por', 'meu', 'minha', 'seu', 'sua', 'meus', 'minhas',
  'the', 'and', 'for', 'to', 'my', 'your', 'of', 'is', 'are',
]);

/**
 * GET /api/external/recipients
 *
 * Categoriza vendas por tipo de destinatário (mãe, namorada, etc) usando
 * NLP simples no `title` da página. Útil pra entender QUEM realmente
 * compra teu produto e direcionar criativos.
 *
 * Query: from, to (ISO ou YYYY-MM-DD)
 */
export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  const url = new URL(req.url);
  const fromStr = url.searchParams.get('from');
  const toStr = url.searchParams.get('to');

  try {
    const db = getAdminFirestore();
    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, { email: string }>();
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) userMap.set(doc.id, { email: data.email });
    });

    let q: FirebaseFirestore.Query = db.collection('lovepages').orderBy('createdAt', 'desc');
    if (fromStr) {
      const f = new Date(fromStr);
      if (!isNaN(f.getTime())) q = q.where('createdAt', '>=', f);
    }
    if (toStr) {
      const t = new Date(toStr);
      if (!isNaN(t.getTime())) q = q.where('createdAt', '<=', t);
    }
    const snap = await q.limit(5000).get();

    type CatStats = { count: number; totalBRL: number; titles: string[] };
    const stats: Record<RecipientCategory, CatStats> = {
      mae: { count: 0, totalBRL: 0, titles: [] },
      pai: { count: 0, totalBRL: 0, titles: [] },
      namorada: { count: 0, totalBRL: 0, titles: [] },
      namorado: { count: 0, totalBRL: 0, titles: [] },
      esposa: { count: 0, totalBRL: 0, titles: [] },
      esposo: { count: 0, totalBRL: 0, titles: [] },
      amigo_amiga: { count: 0, totalBRL: 0, titles: [] },
      filho_filha: { count: 0, totalBRL: 0, titles: [] },
      irmao_irma: { count: 0, totalBRL: 0, titles: [] },
      avo: { count: 0, totalBRL: 0, titles: [] },
      outro: { count: 0, totalBRL: 0, titles: [] },
    };

    const wordFreq = new Map<string, number>();
    let totalSales = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      const owner = userMap.get(d.userId);
      if (owner && ADMIN_EMAILS.includes(owner.email)) continue;
      if (!d.paymentId || d.isGift) continue;

      const m = resolveMarket(d);
      const currency = currencyOfMarket(m);
      const amountBRL = toBRL(resolveAmount(d, m), currency);

      const title = (d.title as string) || '';
      const cat = categorizeRecipient(title);

      stats[cat].count++;
      stats[cat].totalBRL += amountBRL;
      // Sample 3 títulos pra dar contexto sem expor PII em massa
      if (stats[cat].titles.length < 3 && title) {
        stats[cat].titles.push(title.slice(0, 80));
      }
      totalSales++;

      // Word frequency pra topKeywords
      title
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !STOPWORDS.has(w))
        .forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));
    }

    const categorized = Object.fromEntries(
      Object.entries(stats).map(([cat, s]) => [
        cat,
        {
          count: s.count,
          totalBRL: Number(s.totalBRL.toFixed(2)),
          avgTicketBRL: s.count > 0 ? Number((s.totalBRL / s.count).toFixed(2)) : 0,
          pctOfSales: totalSales > 0 ? Number(((s.count / totalSales) * 100).toFixed(2)) : 0,
          sampleTitles: s.titles,
        },
      ]),
    );

    const topKeywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, count]) => ({ word, count }));

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        filters: { from: fromStr, to: toStr },
        totalSales,
        categorized,
        topKeywords,
        meta: {
          fxToBRL: FX,
          algorithm: 'keyword-match-nlp-simples',
          note: 'Match feito via regex de palavras-chave no título da página (PT/EN). Empate desempatado por mais matches.',
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/recipients] error:', err?.message);
    return NextResponse.json({ error: 'internal_error', message: err?.message }, { status: 500 });
  }
}
