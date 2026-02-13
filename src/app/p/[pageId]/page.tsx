import { Suspense } from 'react';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import PageClientComponent from './PageClientComponent';
import { LanguageProvider } from '@/lib/i18n';
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
        if (error instanceof Error) {
            // Specific check for the UNAUTHENTICATED error
            if ((error as any).code === 16 || error.message.includes("UNAUTHENTICATED")) {
                return { error: 'publicpage.error.unauthenticated' };
            }
            if (error.message.includes("initializeApp")) {
                return { error: 'publicpage.error.dbConfig' };
            }
            return { error: 'publicpage.error.fetch', errorMessage: error.message };
        }
        return { error: 'publicpage.error.unknown' };
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
          <LanguageProvider>
              <ErrorState 
                messageKey={rawPageData.error} 
                messageVars={{ message: rawPageData.errorMessage || '' }} 
              />
          </LanguageProvider>
      );
  }
  
  // No data and no specific error
  if (!rawPageData) {
      return (
        <LanguageProvider>
            <ErrorState messageKey="publicpage.error.generic" />
        </LanguageProvider>
      )
  }

  // Success case
  return (
      <Suspense fallback={
        <LanguageProvider>
            <LoadingState />
        </LanguageProvider>
      }>
        <LanguageProvider>
          <PageClientComponent pageData={rawPageData} />
        </LanguageProvider>
      </Suspense>
  );
}
