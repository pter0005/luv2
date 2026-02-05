import { Suspense } from 'react';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Loader2, AlertTriangle } from 'lucide-react';
import PageClientComponent from './PageClientComponent';
import { LanguageProvider } from '@/lib/i18n';

// =================================================================
// SERVER-SIDE LOGIC
// =================================================================

/**
 * Fetches the page data from Firestore on the server.
 */
async function getPageData(pageId: string) {
    try {
        const firestore = getAdminFirestore();
        const docRef = firestore.collection('lovepages').doc(pageId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }
        
        return docSnap.data();

    } catch (error) {
        console.error("Error fetching page data:", error);
        if (error instanceof Error) {
            // Check for specific initialization error to give a better message
            if (error.message.includes("initializeApp")) {
                return { error: 'O sistema de banco de dados não está configurado corretamente. Por favor, contate o suporte.' };
            }
            return { error: `Erro ao buscar dados: ${error.message}` };
        }
        return { error: 'Ocorreu um erro desconhecido ao buscar os dados da página.' };
    }
}

/**
 * Sanitize data by converting it to a plain JSON object.
 * This removes any complex classes like Firestore's Timestamp.
 */
const toPlainObject = (obj: any): any => {
  try {
    // The magical fix: Serialize and then deserialize the object.
    // This process strips away any class instances (like Timestamps)
    // and leaves a pure, "plain" JavaScript object.
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error("Failed to serialize object:", error);
    // Return an object with an error property if serialization fails,
    // which can be handled downstream.
    return { error: 'Ocorreu um erro ao processar os dados da página.' };
  }
};


// Fallback component for loading state
function LoadingState() {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-background text-foreground">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <p className="mt-4">Carregando sua surpresa...</p>
        </div>
    );
}

// Fallback component for error state
function ErrorState({ message }: { message: string }) {
    return (
        <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground">
            <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive max-w-lg">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl md:text-3xl font-bold">Página não encontrada ou erro</h1>
                <p className="text-destructive-foreground/80 mt-2">
                    {message}
                </p>
                 <p className="text-xs text-muted-foreground mt-4">
                    O link que você acessou pode estar quebrado ou a página foi removida.
                </p>
            </div>
        </div>
    )
}


// =================================================================
// MAIN SERVER COMPONENT
// =================================================================
export default async function ViewPage({ params }: { params: { pageId: string } }) {
  const pageId = params.pageId;
  const rawPageData = await getPageData(pageId);

  if (!rawPageData) {
      return <ErrorState message="Esta página de amor não existe ou não pôde ser encontrada." />;
  }

  // Handle cases where getPageData itself returns an error object
  if (rawPageData.error) {
      return <ErrorState message={rawPageData.error} />;
  }
  
  // THE MAGIC FIX: Sanitize the data on the server BEFORE passing it to the client.
  const sanitizedData = toPlainObject(rawPageData);
  
  // Handle cases where the sanitization fails
  if (!sanitizedData || sanitizedData.error) {
    return <ErrorState message={sanitizedData?.error || "Ocorreu um erro ao processar os dados da página."} />;
  }

  return (
      <Suspense fallback={<LoadingState />}>
        <LanguageProvider>
          <PageClientComponent pageData={sanitizedData} />
        </LanguageProvider>
      </Suspense>
  );
}
