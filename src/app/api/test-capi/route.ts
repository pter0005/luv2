import { NextResponse } from 'next/server';

export async function GET() {
    const PIXEL_ID = process.env.META_PIXEL_ID;
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    
    if (!PIXEL_ID || !ACCESS_TOKEN) {
        return NextResponse.json({ error: 'Env vars não configuradas', PIXEL_ID: !!PIXEL_ID, ACCESS_TOKEN: !!ACCESS_TOKEN });
    }

    const payload = {
        data: [{
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: 'https://mycupid.com.br',
            custom_data: { value: 24.90, currency: 'BRL' },
        }],
        test_event_code: 'TEST32529',
    };

    const response = await fetch(
        `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );

    const data = await response.json();
    return NextResponse.json(data);
}
