import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // This webhook is intentionally left empty as Stripe is not a payment provider.
  return new NextResponse(null, { status: 200 });
}
