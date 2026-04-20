import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin-guard';
import DoItYourselfView from './DoItYourselfView';

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export const dynamic = 'force-dynamic';

export default async function DoItYourselfPage({ searchParams }: PageProps) {
  // Admins são transparentemente roteados pro wizard conversacional.
  // Preservamos `segment` pra manter contexto (namorade/mae/etc.).
  const isAdmin = await isAdminRequest();
  if (isAdmin) {
    const segment = typeof searchParams?.segment === 'string' ? searchParams!.segment : undefined;
    const target = segment ? `/chat?segment=${encodeURIComponent(segment)}` : '/chat';
    redirect(target);
  }

  return <DoItYourselfView />;
}
