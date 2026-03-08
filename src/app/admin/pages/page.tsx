
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LogOut, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import AdminPagesClient from './AdminPagesClient';
import { getAdminPagesData } from './actions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function removeAdminSession() {
  'use server';
  cookies().delete('session_admin');
  redirect('/admin/login');
}

export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
    const { pagesWithIssues, stats } = await getAdminPagesData();

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* HEADER */}
            <header className="bg-card border-b border-border mb-8 sticky top-0 z-10">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                            <Link href="/admin">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Dashboard
                            </Link>
                        </Button>
                        <div className="w-px h-5 bg-border" />
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/20 p-2 rounded-full">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-xl font-bold">Monitoramento de Arquivos</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <form action={removeAdminSession}>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                                <LogOut className="h-4 w-4 mr-2" />
                                Sair
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4">
                <div className="mb-6">
                    <p className="text-muted-foreground text-sm">
                        Páginas cujas imagens falharam ao ser movidas de <code className="bg-muted px-1 py-0.5 rounded text-xs">temp/</code> para <code className="bg-muted px-1 py-0.5 rounded text-xs">lovepages/</code> durante a finalização do pagamento.
                        Use o botão <strong>Reprocessar</strong> para tentar mover os arquivos novamente sem precisar acessar o Firebase Console.
                    </p>
                </div>

                <AdminPagesClient
                    pagesWithIssues={pagesWithIssues}
                    stats={stats}
                />
            </main>
        </div>
    );
}
