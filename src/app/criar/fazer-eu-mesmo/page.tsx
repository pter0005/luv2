
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const CreatePageWizard = dynamic(() => import('./CreatePageWizard'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col md:grid md:grid-cols-2 w-full min-h-screen">
       <div className="w-full md:sticky md:top-0 md:h-screen p-4 order-1 md:flex items-center justify-center hidden">
            <Skeleton className="w-full h-full rounded-2xl" />
       </div>
       <div className="w-full flex flex-col items-center p-4 md:p-8 order-2">
            <div className="w-full max-w-md space-y-8">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-full" />
                 <div className="flex items-center gap-4 my-8">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
       </div>
    </div>
  ),
});


export default function DoItYourselfPage() {
  return (
    <div className="flex-grow flex flex-col">
      <div className="container pt-8 md:pt-12 text-center">
          <h1 className="text-4xl font-semibold text-foreground">
            Crie uma página de amor <br />
            <span className="text-4xl md:text-6xl font-bold mt-1 leading-none gradient-text">
              Totalmente Personalizada
            </span>
          </h1>
          <p className="text-muted-foreground text-lg mt-4">
            Use o assistente passo a passo para montar cada detalhe.
          </p>
      </div>
      <div className="flex-grow">
        <CreatePageWizard />
      </div>
    </div>
  );
}

