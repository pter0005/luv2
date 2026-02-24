
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { notFound } from 'next/navigation';
import EditPageForm from './EditPageForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getPageData(pageId: string) {
    try {
        const db = getAdminFirestore();
        const docRef = db.collection('lovepages').doc(pageId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }
        
        const data = docSnap.data();
        // The data from firestore is not serializable directly
        // We need to convert Timestamps to something else
        const plainData = JSON.parse(JSON.stringify(data));
        return { id: docSnap.id, ...plainData };

    } catch (error) {
        console.error("Error fetching page data for admin edit:", error);
        return null;
    }
}


export default async function AdminEditPage({ params }: { params: { pageId: string } }) {
    const pageData = await getPageData(params.pageId);

    if (!pageData) {
        notFound();
    }

    return (
        <div className="container py-12 md:py-20">
            <Button asChild variant="outline" className="absolute top-8 left-8">
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Page Content</CardTitle>
                        <CardDescription>
                            Editing page with ID: <span className="font-mono text-xs">{params.pageId}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EditPageForm pageData={pageData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
