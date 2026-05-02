
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import PageClientComponentV1 from './PageClientComponentV1'; // Import V1
import PageClientComponent from './PageClientComponent'; // This is now V2
import { LoadingState, ErrorState } from './PageStates';
import { healPageInline } from '@/lib/heal-page-inline';

// Dynamic metadata por página — antes era static "robots noindex" só.
// Sem isso, WhatsApp/Instagram/Facebook mostravam preview genérico (sem
// foto da galeria, título da página, mensagem), matando o viral effect.
// Agora cada compartilhamento mostra preview personalizado.
export async function generateMetadata({ params }: { params: { pageId: string } }): Promise<Metadata> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('lovepages').doc(params.pageId).get();
    if (!snap.exists) return { robots: { index: false, follow: false } };
    const d = snap.data() || {};
    const title = (d.title as string) || 'MyCupid';
    const message = ((d.message as string) || '').slice(0, 160).trim();
    const description = message || (d.locale === 'en'
      ? 'A special love page made just for you 💌'
      : 'Uma página especial feita com carinho 💌');
    const galleryImage = Array.isArray(d.galleryImages) && d.galleryImages.length > 0
      ? d.galleryImages[0]?.url
      : null;
    const heroImage = galleryImage || d.puzzleImage?.url || null;

    return {
      title,
      description,
      robots: { index: false, follow: false }, // Páginas privadas — não indexar
      openGraph: {
        title,
        description,
        type: 'website',
        images: heroImage ? [{ url: heroImage, width: 1200, height: 630, alt: title }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: heroImage ? [heroImage] : undefined,
      },
    };
  } catch {
    return { robots: { index: false, follow: false } };
  }
}

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

    const now = Date.now();
    const expireAt = rawPageData.expireAt;
    const isExpired = expireAt && (
        typeof expireAt === 'object' && (expireAt.seconds || expireAt._seconds)
            ? (expireAt.seconds || expireAt._seconds) * 1000 < now
            : new Date(expireAt).getTime() < now
    );

    if (isExpired && rawPageData.plan === 'basico') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
                <div className="max-w-md space-y-6">
                    <div className="text-6xl">⏰</div>
                    <h1 className="text-3xl font-bold text-white">Esta página expirou</h1>
                    <p className="text-white/70 text-lg">
                        O plano Básico dura 25 horas. Para manter sua página para sempre, faça upgrade.
                    </p>
                    
                    <a
                        href="https://mycupid.com.br"
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-xl transition-all text-lg"
                    >
                        💜 Criar nova página
                    </a>
                </div>
            </div>
        );
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

  // INLINE HEAL: se o doc tem refs temp/ (arquivo ainda não movido pra
  // lovepages/), tenta curar SÍNCRONO antes de mandar HTML pro cliente.
  // Timeout 3s — se passar, segue com data original e o auto-heal client
  // recupera depois. Resultado: usuário JAMAIS vê "imagem indisponível"
  // se o storage tem o arquivo (caminho rápido), e ainda funciona como
  // fallback se o move falhou (caminho lento via /api/page-heal).
  const healedData = await healPageInline(pageId, rawPageData, 3000);
  const pageDataWithId = { ...healedData, id: pageId };

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
