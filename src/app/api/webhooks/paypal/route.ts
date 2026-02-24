import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // This webhook is intentionally left empty as PayPal is not a payment provider.
  return NextResponse.json({ status: 'success' }, { status: 200 });
}
