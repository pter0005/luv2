import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const { source, pathname } = await req.json();
        if (!source) return NextResponse.json({ ok: false });
        const db = getAdminFirestore();
        await db.collection('utm_visits').add({
            source: source.toLowerCase().trim(),
            pathname: pathname || '/',
            createdAt: Timestamp.now(),
            date: new Date().toISOString().split('T')[0],
            expireAt: Timestamp.fromMillis(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('utm error', err);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}