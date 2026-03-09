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
