import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-guard';

export async function GET() {
  const ok = await isAdminRequest();
  return NextResponse.json({ admin: ok }, { headers: { 'cache-control': 'no-store' } });
}
