
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { isAdminRequest } from '@/lib/admin-guard';

export async function GET() {
    // Endpoint de teste — só admin pode disparar evento Meta CAPI fake.
    // Antes era público: qualquer um podia POST 1000x e contaminar pixel
    // com Purchases falsas, distorcendo ROAS e audiências lookalike.
    if (!(await isAdminRequest())) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const PIXEL_ID = process.env.META_PIXEL_ID;
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    
    if (!PIXEL_ID || !ACCESS_TOKEN) {
        return NextResponse.json({ 
            error: 'Env vars não configuradas', 
            PIXEL_ID: !!PIXEL_ID, 
            ACCESS_TOKEN: !!ACCESS_TOKEN 
        });
    }

    const testEmail = createHash('sha256').update('test@mycupid.com.br').digest('hex');

    const payload = {
        data: [{
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: 'https://mycupid.com.br/criar/fazer-eu-mesmo',
            user_data: {
                em: [testEmail],
                client_ip_address: '177.160.0.1',
                client_user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            },
            custom_data: { 
                value: 24.90, 
                currency: 'BRL',
                content_ids: ['avancado'],
                content_type: 'product',
            },
        }],
    };

    const response = await fetch(
        `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );

    const data = await response.json();
    return NextResponse.json(data);
}
