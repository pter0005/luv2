import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin-guard';
import ChatWizardClient from './ChatWizardClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const allowed = await isAdminRequest();
  if (!allowed) redirect('/admin/login?next=/chat');

  return <ChatWizardClient />;
}
