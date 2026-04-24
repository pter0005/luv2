import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { isAdminRequest } from '@/lib/admin-guard';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

    const db = getAdminFirestore();
    await db.collection('error_logs').doc(id).update({ resolved: true });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[error-log/resolve] Failed:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
