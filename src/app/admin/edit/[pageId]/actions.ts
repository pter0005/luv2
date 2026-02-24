
'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Basic validation for the data
interface UpdatablePageData {
    title?: string;
    message?: string;
}

export async function updateLovePage(pageId: string, data: UpdatablePageData) {
    if (!pageId) {
        return { error: 'Page ID is missing.' };
    }

    try {
        const db = getAdminFirestore();
        const pageRef = db.collection('lovepages').doc(pageId);
        
        // Ensure you only update allowed fields
        const dataToUpdate: { [key: string]: any } = {};
        if (data.title) dataToUpdate.title = data.title;
        if (data.message) dataToUpdate.message = data.message;
        
        await pageRef.update(dataToUpdate);

        // Invalidate cache for the admin page to show new data
        revalidatePath('/admin');

    } catch (error: any) {
        console.error('[ADMIN_UPDATE_ERROR]', error);
        return { error: `Failed to update page: ${error.message}` };
    }

    // Redirect back to the admin dashboard after successful update
    redirect('/admin');
}
