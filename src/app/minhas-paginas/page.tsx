
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Heart, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MinhasPaginasPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when loading is finished and there's no user
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/minhas-paginas');
    }
  }, [user, isUserLoading, router]);

  // While checking user auth, show a loading state
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-4 text-muted-foreground">Verificando sua sessão...</p>
      </div>
    );
  }
  
  // If loading is done and there is a user, render the page content
  if (user) {
    return (
        <div className="container py-12 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Minhas Páginas de Amor</h1>
                <p className="text-muted-foreground">Gerencie aqui todas as suas criações.</p>
            </div>
            <Button asChild>
                <Link href="/criar">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Criar Nova Página
                </Link>
            </Button>
          </div>

          {/* Placeholder for when there are no pages */}
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-24 text-center">
            <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold">Nenhuma página criada ainda</h2>
            <p className="text-muted-foreground mt-2">Que tal começar a sua primeira obra de arte?</p>
            <Button asChild variant="outline" className="mt-6">
                <Link href="/criar">
                    Criar minha primeira página
                </Link>
            </Button>
          </div>
        </div>
      );
  }

  // Fallback loading state while redirecting
  return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Redirecionando para o login...</p>
      </div>
  );
}
