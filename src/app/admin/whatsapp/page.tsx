import { getAbandonedCarts, getRecentBuyers } from './actions';
import WhatsAppClient from './WhatsAppClient';

export const dynamic = 'force-dynamic';

export default async function WhatsAppPage() {
  const [abandoned, buyers] = await Promise.all([
    getAbandonedCarts(),
    getRecentBuyers(),
  ]);

  return <WhatsAppClient abandoned={abandoned} buyers={buyers} />;
}
