
import { Suspense } from 'react';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import PageClientComponentV1 from './PageClientComponentV1'; // Import V1
import PageClientComponent from './PageClientComponent'; // This is now V2
import { LoadingState, ErrorState } from './PageStates';

// =================================================================
// SERVER-SIDE LOGIC
// =================================================================

async function getPageData(pageId: string) {
    try {
        const firestore = getAdminFirestore();
        const docRef = firestore.collection('lovepages').doc(pageId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { error: 'publicpage.error.notfound' };
        }
        
        return toPlainObject(docSnap.data());

    } catch (error) {
        console.error("Error fetching page data:", error);
        // Do not leak raw error messages to the client.
        // Return a generic key and log the specific error on the server.
        if (error instanceof Error) {
            if ((error as any).code === 16 || error.message.includes("UNAUTHENTICATED")) {
                return { error: 'publicpage.error.unauthenticated' };
            }
        }
        return { error: 'publicpage.error.fetch' };
    }
}

const toPlainObject = (obj: any): any => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error("Failed to serialize object:", error);
    return { error: 'publicpage.error.processing' };
  }
};


// =================================================================
// MAIN EXPORTED SERVER COMPONENT
// =================================================================
export default async function ViewPage({ params }: { params: { pageId: string } }) {
  const pageId = params.pageId;
  const rawPageData = await getPageData(pageId);

  // Error occurred during fetch
  if (rawPageData && rawPageData.error) {
      return (
          <ErrorState 
            messageKey={rawPageData.error} 
            messageVars={{ message: '' }} // Message is no longer passed
          />
      );
  }
  
  // No data and no specific error
  if (!rawPageData) {
      return (
        <ErrorState messageKey="publicpage.error.generic" />
      )
  }

  // Detecta página com imagens perdidas (todas em temp/ e sem arquivos)
    const allImagesLost = rawPageData.galleryImages?.length > 0 && 
    rawPageData.galleryImages?.every((img: any) => 
        img?.path?.startsWith('temp/') || !img?.url
    );

    if (allImagesLost) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="max-w-md space-y-6">
                    <div className="text-6xl">💜</div>
                    <h1 className="text-3xl font-bold text-white">Pedimos desculpas</h1>
                    <p className="text-white/70 text-lg leading-relaxed">
                        Tivemos um problema técnico e as imagens desta página foram afetadas.
                        Sua página e seu acesso continuam salvos.
                    </p>
                    <p className="text-white/70">
                        Fale com a gente e vamos <strong className="text-purple-400">recriar sua página gratuitamente.</strong>
                    </p>
                    
                    <a 
                        href={`https://wa.me/5511943157277?text=Oi!%20Minha%20p%C3%A1gina%20do%20MyCupid%20teve%20um%20problema%20com%20as%20imagens.%20ID%3A%20${pageId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-all text-lg"
                    >
                        💬 Falar no WhatsApp
                    </a>
                    <p className="text-white/40 text-xs">ID: {pageId}</p>
                </div>
            </div>
        );
    }

  // Version-based rendering logic
  const version = rawPageData.componentVersion || 'v1';
  const pageDataWithId = { ...rawPageData, id: pageId };

  // Success case
  return (
      <Suspense fallback={<LoadingState />}>
        {version === 'v2' ? (
          <PageClientComponent pageData={pageDataWithId} />
        ) : (
          <PageClientComponentV1 pageData={pageDataWithId} />
        )}
      </Suspense>
  );
}
