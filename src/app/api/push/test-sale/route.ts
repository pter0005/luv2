import { NextResponse } from 'next/server';
import { notifyAdmins } from '@/lib/notify-admin';

export async function POST() {
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
