import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';

export async function logCriticalError(
  category: 'payment' | 'page_creation' | 'api',
  message: string,
  details?: Record<string, any>,
) {
  try {
    const db = getAdminFirestore();
    const extraLimit = category === 'page_creation' ? 5000 : 2000;
    await db.collection('error_logs').add({
      message: String(message).slice(0, 500),
      category,
      url: details?.intentId ? `intent:${details.intentId}` : 'server',
      stack: details?.stack ? String(details.stack).slice(0, 2000) : null,
      extra: details ? JSON.stringify(details).slice(0, extraLimit) : null,
      userAgent: 'server',
      createdAt: Timestamp.now(),
      resolved: false,
    });
  } catch (e) {
    console.error('[logCriticalError] failed to log:', e);
  }
}
