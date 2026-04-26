import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin-guard';
import DoItYourselfView from './DoItYourselfView';

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export const dynamic = 'force-dynamic';

export default async function DoItYourselfPage({ searchParams }: PageProps) {
  // Admins são roteados pro wizard conversacional, EXCETO quando vêm de
  // link de desconto — esses links são compartilhados com clientes e o
  // admin precisa ver exatamente o que o cliente vê.
  const isAdmin = await isAdminRequest();
  const hasDiscount = typeof searchParams?.discount === 'string' && searchParams.discount.length > 0;
  if (isAdmin && !hasDiscount) {
    const segment = typeof searchParams?.segment === 'string' ? searchParams!.segment : undefined;
    const target = segment ? `/chat?segment=${encodeURIComponent(segment)}` : '/chat';
    redirect(target);
  }

  return <DoItYourselfView />;
}
