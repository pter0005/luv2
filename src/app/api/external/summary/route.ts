import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FX_TO_BRL = { BRL: 1, EUR: 5.8, USD: 5.1 } as const;
type Currency = keyof typeof FX_TO_BRL;

function dateKey(d: Date): string {
  // YYYY-MM-DD em America/Sao_Paulo (BRT, sem DST desde 2019)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).replace(/\//g, '-');
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason);

  try {
    const db = getAdminFirestore();
    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, { email: string }>();
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) userMap.set(doc.id, { email: data.email });
    });

    const snap = await db.collection('lovepages').get();

    const today = dateKey(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = dateKey(yesterdayDate);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const buckets = {
      today: emptyBucket(),
      yesterday: emptyBucket(),
      last7: emptyBucket(),
      last30: emptyBucket(),
      allTime: emptyBucket(),
    };

    const dailyMap = new Map<string, ReturnType<typeof emptyBucket>>();
    const sourceMap = new Map<string, ReturnType<typeof emptyBucket>>();

    for (const doc of snap.docs) {
      const d = doc.data();
      const owner = userMap.get(d.userId);
      if (owner && ADMIN_EMAILS.includes(owner.email)) continue;
      if (!d.createdAt?.toDate) continue;
      const isPaid = !!d.paymentId;
      const isGift = !!d.isGift;
      if (!isPaid && !isGift) continue;
      if (isGift) continue; // gifts não contam pra receita

      const createdAt: Date = d.createdAt.toDate();
      const day = dateKey(createdAt);

      const docMarket = d.market || (d.currency === 'EUR' ? 'PT' : d.currency === 'USD' ? 'US' : null);
      const isStripeId = d.paymentId && isNaN(Number(d.paymentId));
      const m: 'BR' | 'PT' | 'US' = (docMarket as any) || (isStripeId ? 'US' : 'BR');
      const currency: Currency = m === 'PT' ? 'EUR' : m === 'US' ? 'USD' : 'BRL';

      const baseByMarket: Record<'BR' | 'PT' | 'US', Record<string, number>> = {
        BR: { vip: 34.99, avancado: 24.90, basico: 19.90 },
        PT: { vip: 17.99, avancado: 12.99, basico: 8.99 },
        US: { vip: 19.99, avancado: 14.99, basico: 9.99 },
      };
      const baseFallback = baseByMarket[m][d.plan] ?? baseByMarket[m]['basico'];
      const amount = typeof d.paidAmount === 'number' && d.paidAmount > 0 ? d.paidAmount : baseFallback;
      const amountBRL = amount * FX_TO_BRL[currency];

      const utmSource = ((d.utmSource || d.utm_source || 'direct') as string).toLowerCase().trim();

      // Acumula em buckets temporais
      addTo(buckets.allTime, m, amount, currency, amountBRL);
      if (createdAt >= thirtyDaysAgo) addTo(buckets.last30, m, amount, currency, amountBRL);
      if (createdAt >= sevenDaysAgo) addTo(buckets.last7, m, amount, currency, amountBRL);
      if (day === today) addTo(buckets.today, m, amount, currency, amountBRL);
      if (day === yesterday) addTo(buckets.yesterday, m, amount, currency, amountBRL);

      // Daily breakdown últimos 30
      if (createdAt >= thirtyDaysAgo) {
        const b = dailyMap.get(day) || emptyBucket();
        addTo(b, m, amount, currency, amountBRL);
        dailyMap.set(day, b);
      }

      // Source breakdown all-time
      const sb = sourceMap.get(utmSource) || emptyBucket();
      addTo(sb, m, amount, currency, amountBRL);
      sourceMap.set(utmSource, sb);
    }

    // Round everything
    Object.values(buckets).forEach(roundBucket);
    const daily = Array.from(dailyMap.entries())
      .map(([day, b]) => ({ day, ...roundBucket(b) }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));
    const sources = Array.from(sourceMap.entries())
      .map(([source, b]) => ({ source, ...roundBucket(b) }))
      .sort((a, b) => b.totalBRL - a.totalBRL);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        buckets,
        daily,
        sources,
        meta: {
          fxToBRL: FX_TO_BRL,
          fxNote: 'Cotação fixa — revisar quando flutuar > 5%',
          timezone: 'America/Sao_Paulo',
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/summary] error:', err?.message);
    return NextResponse.json(
      { error: 'internal_error', message: err?.message || 'unknown' },
      { status: 500 },
    );
  }
}

type Bucket = {
  count: number;
  countBR: number;
  countPT: number;
  countUS: number;
  totalBRL: number;
  totalEUR: number;
  totalUSD: number;
  totalBRLNative: number;
};

function emptyBucket(): Bucket {
  return {
    count: 0, countBR: 0, countPT: 0, countUS: 0,
    totalBRL: 0, totalEUR: 0, totalUSD: 0, totalBRLNative: 0,
  };
}

function addTo(b: Bucket, market: 'BR' | 'PT' | 'US', amount: number, currency: Currency, amountBRL: number) {
  b.count++;
  if (market === 'BR') b.countBR++;
  else if (market === 'PT') b.countPT++;
  else if (market === 'US') b.countUS++;
  b.totalBRL += amountBRL;
  if (currency === 'EUR') b.totalEUR += amount;
  else if (currency === 'USD') b.totalUSD += amount;
  else b.totalBRLNative += amount;
}

function roundBucket(b: Bucket): Bucket {
  b.totalBRL = Number(b.totalBRL.toFixed(2));
  b.totalEUR = Number(b.totalEUR.toFixed(2));
  b.totalUSD = Number(b.totalUSD.toFixed(2));
  b.totalBRLNative = Number(b.totalBRLNative.toFixed(2));
  return b;
}
