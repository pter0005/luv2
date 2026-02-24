import { Suspense } from 'react';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import PageClientComponent from './PageClientComponent';
import { LanguageProvider } from '@/lib/i18n';
import { LoadingState, ErrorState } from './PageStates';
import { headers } from 'next/headers';

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

  // --- LANGUAGE DETECTION LOGIC (RELIABLE) ---
  const host = headers().get('host');
  const acceptLanguage = headers().get('accept-language');
  
  let lang = 'en'; // Default to English
  if (host?.includes('mycupid.com.br')) {
    lang = 'pt';
  } else if (acceptLanguage?.startsWith('es')) {
    lang = 'es';
  }
  // --- END LANGUAGE DETECTION ---

  const rawPageData = await getPageData(pageId);

  // Error occurred during fetch
  if (rawPageData && rawPageData.error) {
      return (
          <LanguageProvider initialLocale={lang as any}>
              <ErrorState 
                messageKey={rawPageData.error} 
                messageVars={{ message: '' }} // Message is no longer passed
              />
          </LanguageProvider>
      );
  }
  
  // No data and no specific error
  if (!rawPageData) {
      return (
        <LanguageProvider initialLocale={lang as any}>
            <ErrorState messageKey="publicpage.error.generic" />
        </LanguageProvider>
      )
  }

  // Success case
  return (
      <Suspense fallback={
        <LanguageProvider initialLocale={lang as any}>
            <LoadingState />
        </LanguageProvider>
      }>
        <LanguageProvider initialLocale={lang as any}>
          <PageClientComponent pageData={rawPageData} />
        </LanguageProvider>
      </Suspense>
  );
}
