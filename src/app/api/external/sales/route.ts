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
  maskEmail,
  maskPhone,
  FX,
} from '@/lib/external-api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function GET(req: NextRequest) {
  const auth = authenticateExternalRequest(req);
  if (!auth.ok) return unauthorized(auth.reason, auth.retryAfter);

  const url = new URL(req.url);
  const params = url.searchParams;

  const fromStr = params.get('from');
  const toStr = params.get('to');
  const market = params.get('market');
  const limitRaw = parseInt(params.get('limit') || '100', 10);
  const limit = Math.min(Math.max(isNaN(limitRaw) ? 100 : limitRaw, 1), 500);
  const cursor = params.get('cursor');

  try {
    const db = getAdminFirestore();

    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, { email: string }>();
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.email) userMap.set(doc.id, { email: data.email });
    });

    let query: FirebaseFirestore.Query = db.collection('lovepages').orderBy('createdAt', 'desc');

    if (fromStr) {
      const fromDate = new Date(fromStr);
      if (!isNaN(fromDate.getTime())) query = query.where('createdAt', '>=', fromDate);
    }
    if (toStr) {
      const toDate = new Date(toStr);
      if (!isNaN(toDate.getTime())) query = query.where('createdAt', '<=', toDate);
    }

    if (cursor) {
      const cursorDoc = await db.collection('lovepages').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.limit(limit + 1).get();
    const hasMore = snap.docs.length > limit;
    const docs = hasMore ? snap.docs.slice(0, limit) : snap.docs;

    const sales = docs
      .filter(doc => {
        const d = doc.data();
        const owner = userMap.get(d.userId);
        if (owner && ADMIN_EMAILS.includes(owner.email)) return false;
        if (!d.paymentId && !d.isGift) return false;
        return true;
      })
      .map(doc => {
        const d = doc.data();
        const owner = userMap.get(d.userId);

        const m = resolveMarket(d);
        const currency = currencyOfMarket(m);
        const amount = resolveAmount(d, m);
        const amountBRL = Number((toBRL(amount, currency)).toFixed(2));

        const createdAt: Date | null = d.createdAt?.toDate ? d.createdAt.toDate() : null;

        if (market && m !== market.toUpperCase()) return null;

        // Discount info — gravado no intent durante PIX/Stripe checkout
        const promoCodeUsed = (d.discountCode as string) || null;
        const discountValueRaw = Number(d.appliedDiscount);
        const discountValue = isFinite(discountValueRaw) && discountValueRaw > 0 ? discountValueRaw : 0;

        // Add-ons aceitos (upsells durante o wizard)
        const addOns = parseAddOns(d);

        // Device fingerprint do userAgent (se capturado em error_logs/intent)
        const ua = (d.userAgent as string) || (d.user_agent as string) || null;
        const parsedUA = parseUA(ua);

        return {
          id: doc.id,
          createdAt: createdAt ? createdAt.toISOString() : null,
          market: m,
          currency,
          amount: Number(amount.toFixed(2)),
          amountBRL,
          plan: d.plan || 'basico',
          isGift: !!d.isGift,

          // ── Atribution (Meta/TikTok pixel + UTMs) ─────────────────────
          utmSource: (d.utmSource || d.utm_source || 'direct') as string,
          utmCampaign: (d.utmCampaign || d.utm_campaign || null) as string | null,
          utmMedium: (d.utmMedium || d.utm_medium || null) as string | null,
          utmContent: (d.utmContent || d.utm_content || null) as string | null,
          utmTerm: (d.utmTerm || d.utm_term || null) as string | null,
          fbclid: (d.fbclid || d.fbc || null) as string | null, // fbc é o cookie derivado de fbclid
          ttclid: (d.ttclid || null) as string | null,
          referrer: (d.referrer || null) as string | null,
          landingPage: (d.landingPage || d.landing_page || null) as string | null,

          // ── Device ────────────────────────────────────────────────────
          deviceType: parsedUA.deviceType,
          os: parsedUA.os,
          browser: parsedUA.browser,
          userAgent: ua ? ua.slice(0, 200) : null,

          // ── Discount + add-ons ────────────────────────────────────────
          promoCodeUsed,
          discountValue,
          discountValueBRL: discountValue * FX[currency],
          addOnsAccepted: {
            intro: addOns.intro,
            voice: addOns.voice,
            wordGame: addOns.wordGame,
            customQR: addOns.customQR,
            count: addOns.count,
          },

          // ── Contact (mascarados) ──────────────────────────────────────
          email: maskEmail(owner?.email || d.guestEmail || d.ownerEmail || ''),
          phone: maskPhone(d.whatsappNumber || ''),
          title: (d.title as string) || null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const summary = sales.reduce(
      (acc, s) => {
        acc.totalBRL += s.amountBRL;
        if (s.currency === 'EUR') acc.totalEUR += s.amount;
        else if (s.currency === 'USD') acc.totalUSD += s.amount;
        else acc.totalBRLNative += s.amount;
        acc.byMarket[s.market] = (acc.byMarket[s.market] || 0) + 1;
        if (s.addOnsAccepted.count > 0) acc.salesWithAddOns++;
        if (s.promoCodeUsed) acc.salesWithDiscount++;
        return acc;
      },
      {
        count: sales.length,
        totalBRL: 0,
        totalBRLNative: 0,
        totalEUR: 0,
        totalUSD: 0,
        salesWithAddOns: 0,
        salesWithDiscount: 0,
        byMarket: {} as Record<string, number>,
      },
    );

    summary.totalBRL = Number(summary.totalBRL.toFixed(2));
    summary.totalBRLNative = Number(summary.totalBRLNative.toFixed(2));
    summary.totalEUR = Number(summary.totalEUR.toFixed(2));
    summary.totalUSD = Number(summary.totalUSD.toFixed(2));

    const nextCursor = hasMore && docs.length > 0 ? docs[docs.length - 1].id : null;

    return NextResponse.json(
      {
        data: sales,
        pagination: { limit, count: sales.length, hasMore, nextCursor },
        summary,
        filters: { from: fromStr, to: toStr, market: market || null },
        meta: {
          fxToBRL: FX,
          fxNote: 'Cotação fixa — revisar quando flutuar > 5%',
          addOnsLegend: {
            intro: 'love | poema | null — intro animada',
            voice: 'mensagem de voz gravada',
            wordGame: 'jogo adivinhe a palavra',
            customQR: 'QR code com tema customizado (não classic)',
          },
        },
      },
      { headers: corsHeaders(req.headers.get('origin')) },
    );
  } catch (err: any) {
    console.error('[external-api/sales] error:', err?.message);
    return NextResponse.json(
      { error: 'internal_error', message: err?.message || 'unknown' },
      { status: 500 },
    );
  }
}
