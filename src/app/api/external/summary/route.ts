import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { ADMIN_EMAILS } from '@/lib/admin-emails';
import { authenticateExternalRequest, unauthorized, corsHeaders } from '@/lib/external-api-auth';
import {
  resolveMarket,
  currencyOfMarket,
  resolveAmount,
  parseAddOns,
  parseUA,
  toBRL,
  dateKeyBR,
  categorizeRecipient,
  FX,
  type Currency,
  type Market,
  type RecipientCategory,
} from '@/lib/external-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
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
  // P0 expansion
  countWithAddOns: number;
  countWithDiscount: number;
  totalDiscountBRL: number;
};

function emptyBucket(): Bucket {
  return {
    count: 0, countBR: 0, countPT: 0, countUS: 0,
    totalBRL: 0, totalEUR: 0, totalUSD: 0, totalBRLNative: 0,
    countWithAddOns: 0, countWithDiscount: 0, totalDiscountBRL: 0,
  };
}

function addTo(b: Bucket, market: Market, amount: number, currency: Currency, amountBRL: number, hasAddOns: boolean, discountBRL: number) {
  b.count++;
  if (market === 'BR') b.countBR++;
  else if (market === 'PT') b.countPT++;
  else if (market === 'US') b.countUS++;
  b.totalBRL += amountBRL;
  if (currency === 'EUR') b.totalEUR += amount;
  else if (currency === 'USD') b.totalUSD += amount;
  else b.totalBRLNative += amount;
  if (hasAddOns) b.countWithAddOns++;
  if (discountBRL > 0) {
    b.countWithDiscount++;
    b.totalDiscountBRL += discountBRL;
  }
}

function roundBucket(b: Bucket): Bucket {
  b.totalBRL = Number(b.totalBRL.toFixed(2));
  b.totalEUR = Number(b.totalEUR.toFixed(2));
  b.totalUSD = Number(b.totalUSD.toFixed(2));
  b.totalBRLNative = Number(b.totalBRLNative.toFixed(2));
  b.totalDiscountBRL = Number(b.totalDiscountBRL.toFixed(2));
  return b;
}

type PlanBreakdown = {
  count: number;
  totalBRL: number;
  avgTicketBRL: number;
};

type DeviceBreakdown = {
  count: number;
  totalBRL: number;
};

type AddOnBreakdown = {
  count: number;        // quantas vendas tinham esse add-on
  pctOfSales: number;   // % de attach rate
};

export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  try {
    const db = getAdminFirestore();
    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, { email: string }>();
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) userMap.set(doc.id, { email: data.email });
    });

    const snap = await db.collection('lovepages').get();

    const today = dateKeyBR(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = dateKeyBR(yesterdayDate);
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

    const dailyMap = new Map<string, Bucket>();
    const sourceMap = new Map<string, Bucket>();

    // P0 NEW: byPlan, byDevice, byAddOn, byRecipient
    const planMap: Record<string, PlanBreakdown> = {
      basico: { count: 0, totalBRL: 0, avgTicketBRL: 0 },
      avancado: { count: 0, totalBRL: 0, avgTicketBRL: 0 },
      vip: { count: 0, totalBRL: 0, avgTicketBRL: 0 },
    };
    const deviceMap: Record<string, DeviceBreakdown> = {
      mobile: { count: 0, totalBRL: 0 },
      tablet: { count: 0, totalBRL: 0 },
      desktop: { count: 0, totalBRL: 0 },
      bot: { count: 0, totalBRL: 0 },
      unknown: { count: 0, totalBRL: 0 },
    };
    const addOnsMap: Record<string, number> = {
      introLove: 0, introPoema: 0, voice: 0, wordGame: 0, customQR: 0,
    };
    const recipientCounts: Record<RecipientCategory, number> = {
      mae: 0, pai: 0, namorada: 0, namorado: 0, esposa: 0, esposo: 0,
      amigo_amiga: 0, filho_filha: 0, irmao_irma: 0, avo: 0, outro: 0,
    };

    let totalSales = 0;
    let totalGifts = 0;

    for (const doc of snap.docs) {
      const d = doc.data();
      const owner = userMap.get(d.userId);
      if (owner && ADMIN_EMAILS.includes(owner.email)) continue;
      if (!d.createdAt?.toDate) continue;
      const isPaid = !!d.paymentId;
      const isGift = !!d.isGift;
      if (!isPaid && !isGift) continue;
      if (isGift) { totalGifts++; continue; }

      const createdAt: Date = d.createdAt.toDate();
      const day = dateKeyBR(createdAt);

      const m = resolveMarket(d);
      const currency = currencyOfMarket(m);
      const amount = resolveAmount(d, m);
      const amountBRL = toBRL(amount, currency);

      const addOns = parseAddOns(d);
      const hasAddOns = addOns.count > 0;

      const discountValue = Number(d.appliedDiscount) || 0;
      const discountBRL = discountValue > 0 ? toBRL(discountValue, currency) : 0;

      // byPlan
      const planSlug = (d.plan as string) || 'basico';
      if (planMap[planSlug]) {
        planMap[planSlug].count++;
        planMap[planSlug].totalBRL += amountBRL;
      }

      // byDevice
      const ua = (d.userAgent as string) || (d.user_agent as string) || null;
      const { deviceType } = parseUA(ua);
      deviceMap[deviceType].count++;
      deviceMap[deviceType].totalBRL += amountBRL;

      // byAddOn
      if (addOns.intro === 'love') addOnsMap.introLove++;
      if (addOns.intro === 'poema') addOnsMap.introPoema++;
      if (addOns.voice) addOnsMap.voice++;
      if (addOns.wordGame) addOnsMap.wordGame++;
      if (addOns.customQR) addOnsMap.customQR++;

      // byRecipient
      const recipientCat = categorizeRecipient(d.title);
      recipientCounts[recipientCat]++;

      totalSales++;

      // Buckets temporais
      addTo(buckets.allTime, m, amount, currency, amountBRL, hasAddOns, discountBRL);
      if (createdAt >= thirtyDaysAgo) addTo(buckets.last30, m, amount, currency, amountBRL, hasAddOns, discountBRL);
      if (createdAt >= sevenDaysAgo) addTo(buckets.last7, m, amount, currency, amountBRL, hasAddOns, discountBRL);
      if (day === today) addTo(buckets.today, m, amount, currency, amountBRL, hasAddOns, discountBRL);
      if (day === yesterday) addTo(buckets.yesterday, m, amount, currency, amountBRL, hasAddOns, discountBRL);

      // Daily breakdown últimos 30
      if (createdAt >= thirtyDaysAgo) {
        const b = dailyMap.get(day) || emptyBucket();
        addTo(b, m, amount, currency, amountBRL, hasAddOns, discountBRL);
        dailyMap.set(day, b);
      }

      // Source breakdown all-time
      const utmSource = ((d.utmSource || d.utm_source || 'direct') as string).toLowerCase().trim();
      const sb = sourceMap.get(utmSource) || emptyBucket();
      addTo(sb, m, amount, currency, amountBRL, hasAddOns, discountBRL);
      sourceMap.set(utmSource, sb);
    }

    // Round + finalize plan ticket médio
    Object.values(buckets).forEach(roundBucket);
    Object.values(planMap).forEach(p => {
      p.avgTicketBRL = p.count > 0 ? Number((p.totalBRL / p.count).toFixed(2)) : 0;
      p.totalBRL = Number(p.totalBRL.toFixed(2));
    });
    Object.values(deviceMap).forEach(dv => {
      dv.totalBRL = Number(dv.totalBRL.toFixed(2));
    });

    const daily = Array.from(dailyMap.entries())
      .map(([day, b]) => ({ day, ...roundBucket(b) }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));
    const sources = Array.from(sourceMap.entries())
      .map(([source, b]) => ({ source, ...roundBucket(b) }))
      .sort((a, b) => b.totalBRL - a.totalBRL);

    // Add-on attach rate
    const addOnAttach: Record<string, AddOnBreakdown> = {};
    for (const [k, count] of Object.entries(addOnsMap)) {
      addOnAttach[k] = {
        count,
        pctOfSales: totalSales > 0 ? Number(((count / totalSales) * 100).toFixed(2)) : 0,
      };
    }

    // Recipients top 5 (todos vão, mas marcamos top)
    const recipientList = Object.entries(recipientCounts)
      .map(([cat, count]) => ({
        category: cat as RecipientCategory,
        count,
        pctOfSales: totalSales > 0 ? Number(((count / totalSales) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        buckets,
        daily,
        sources,
        // ── P0 EXPANSIONS ─────────────────────────────────────────────
        byPlan: planMap,
        byDevice: deviceMap,
        addOnsAttach: addOnAttach,
        byRecipient: recipientList,
        totals: {
          paidSales: totalSales,
          gifts: totalGifts,
        },
        meta: {
          fxToBRL: FX,
          fxNote: 'Cotação fixa — revisar quando flutuar > 5%',
          timezone: 'America/Sao_Paulo',
          addOnsLegend: 'introLove/introPoema = animação inicial; voice = mensagem de voz; wordGame = jogo adivinhe a palavra; customQR = QR não-classic',
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
