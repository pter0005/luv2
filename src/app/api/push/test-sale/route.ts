import { NextResponse } from 'next/server';
import { notifyAdmins } from '@/lib/notify-admin';
import { isAdminRequest } from '@/lib/admin-guard';

export async function POST() {
  // Endpoint só pra admin testar push notification. Antes era público e
  // qualquer um podia spammar push pros admins (ruído + DoS de notificação).
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const value = (Math.random() * 40 + 10).toFixed(2).replace('.', ',');
    await notifyAdmins(
      `💰 Nova venda! R$${value}`,
      'Página de teste — Plano Avançado',
      'https://mycupid.com.br/admin',
    );
    return NextResponse.json({ success: true, value });
  } catch (error: any) {
    console.error('[Test Sale Push] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
