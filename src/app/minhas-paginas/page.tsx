
'use client';

import { useUser, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Loader2, Heart, PlusCircle, View, Copy, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Card para exibir uma única página de amor
const LovePageCard = ({ page }: { page: any }) => {
  const { toast } = useToast();
  const pageUrl = `${window.location.origin}/p/${page.id}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(pageUrl).then(() => {
      toast({ title: 'Link copiado!', description: 'O link da sua página foi copiado para a área de transferência.' });
    }).catch(err => {
      console.error('Falha ao copiar:', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível copiar o link.' });
    });
  };
  
  // A imagem de preview será a primeira da galeria, ou um placeholder se não houver.
  const previewImage = page.galleryImages?.[0]?.url || `https://picsum.photos/seed/${page.id}/400/300`;

  return (
    <Card className="card-glow flex flex-col">
      <CardHeader>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          <Image src={previewImage} alt={`Preview de ${page.title}`} fill className="object-cover" unoptimized/>
        </div>
        <CardTitle className="pt-4 text-xl font-bold font-headline line-clamp-2">{page.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Criado em {page.createdAt ? format(new Date(page.createdAt.seconds * 1000), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Data desconhecida"}</span>
          </div>
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2">
        <Button asChild className="w-full">
            <Link href={pageUrl} target="_blank"><View className="mr-2 h-4 w-4"/>Ver Página</Link>
        </Button>
        <Button onClick={handleCopy} variant="outline" className="w-full">
            <Copy className="mr-2 h-4 w-4"/>Copiar Link
        </Button>
      </CardFooter>
    </Card>
  );
};


export default function MinhasPaginasPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // 1. Criar a consulta (query) para buscar as páginas do usuário
  const pagesQuery = useMemo(() => {
    if (!user) return null;
    // Buscamos na coleção 'lovepages' onde o campo 'userId' é igual ao ID do usuário logado.
    return query(collection(firestore, 'lovepages'), where('userId', '==', user.uid));
  }, [user, firestore]);

  // 2. Usar o hook useCollection com a nossa query
  const { data: lovePages, isLoading: arePagesLoading, error } = useCollection(pagesQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/minhas-paginas');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || (user && arePagesLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verificando sua sessão e buscando suas páginas...</p>
      </div>
    );
  }
  
  if (user) {
    return (
        <div className="container py-12 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
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

          {error && <p className="text-destructive text-center">Ocorreu um erro ao buscar suas páginas: {error.message}</p>}
          
          {!arePagesLoading && lovePages && lovePages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {lovePages.map((page) => (
                <LovePageCard key={page.id} page={page} />
              ))}
            </div>
          ) : (
            // Se não estiver carregando e não houver páginas, mostra o placeholder.
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
          )}
        </div>
      );
  }

  // Fallback para o redirecionamento
  return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Redirecionando para o login...</p>
      </div>
  );
}
