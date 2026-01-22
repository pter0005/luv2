
'use client';

import { useUser, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Heart, PlusCircle, View, Calendar, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import Image from 'next/image';
import { Card, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const LovePageCard = ({ page }: { page: any }) => {
  const pageUrl = `/p/${page.id}`;
  const previewImage = page.galleryImages?.[0]?.url || `https://picsum.photos/seed/${page.id}/400/300`;

  return (
    <Link href={pageUrl} target="_blank" className="group">
      <Card className="relative h-64 overflow-hidden rounded-2xl border-none transition-all duration-500 hover:scale-105">
        <Image
          src={previewImage}
          alt={page.title}
          fill
          className="object-cover transition-all duration-700 group-hover:scale-110"
          style={{ filter: 'blur(8px) brightness(0.5)' }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <CardTitle className="font-handwriting text-3xl text-white drop-shadow-2xl">
            {page.title || "Sem Título"}
          </CardTitle>
          <p className="text-white/70 text-xs mt-2 bg-black/20 px-3 py-1 rounded-full md:backdrop-blur-md">
             Criado em {page.createdAt ? new Date(page.createdAt.seconds * 1000).toLocaleDateString() : 'Recente'}
          </p>
        </div>
      </Card>
    </Link>
  );
};


const PageSkeleton = () => (
    <Card className="h-72">
        <Skeleton className="w-full h-full rounded-lg" />
    </Card>
)


export default function MinhasPaginasPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const pagesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'lovepages'), where('userId', '==', user.uid));
  }, [user, firestore]);

  const { data: lovePages, isLoading: arePagesLoading, error } = useCollection(pagesQuery);
  const [showIndexWarning, setShowIndexWarning] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/minhas-paginas');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
      if (error?.message.includes("indexes?create_composite")) {
        console.warn(
            "ALERTA IMPORTANTE PARA O DESENVOLVEDOR:\n" +
            "A busca por páginas do usuário precisa de um índice composto no Firestore que não existe.\n" +
            "Para corrigir isso, abra o console de desenvolvedor do seu navegador (F12), encontre a mensagem de erro do Firestore (em vermelho) e clique no link que o Google fornece para criar o índice automaticamente. A criação do índice pode levar alguns minutos."
        );
        setShowIndexWarning(true);
      }
  }, [error]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verificando sua sessão...</p>
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

          {showIndexWarning && (
            <Alert variant="destructive" className="mb-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ação Necessária: Criar Índice no Firestore</AlertTitle>
                <AlertDescription>
                    A busca por suas páginas requer um índice que não existe no banco de dados. Para corrigir, abra o console do navegador (F12), encontre o erro do Firestore e clique no link fornecido para criar o índice.
                </AlertDescription>
            </Alert>
          )}
          
          <AnimatePresence>
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                {arePagesLoading && !showIndexWarning && (
                    [...Array(3)].map((_, i) => <PageSkeleton key={i} />)
                )}

                {!arePagesLoading && lovePages && lovePages.length > 0 && (
                    lovePages.map((page) => (
                       <motion.div 
                            key={page.id}
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                       >
                            <LovePageCard page={page} />
                       </motion.div>
                    ))
                )}
            </motion.div>
          </AnimatePresence>
          
          {!arePagesLoading && (!lovePages || lovePages.length === 0) && (
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
