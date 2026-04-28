export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-guard';
import { finalizeLovePage } from '@/app/criar/fazer-eu-mesmo/actions';

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { intentId } = await req.json();
  if (!intentId || typeof intentId !== 'string') {
    return NextResponse.json({ error: 'intentId required' }, { status: 400 });
  }

  const result = await finalizeLovePage(intentId, `admin_retry_${Date.now()}`);
  return NextResponse.json(result);
}
