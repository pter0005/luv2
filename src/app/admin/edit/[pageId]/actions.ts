
'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-action-guard';

// Basic validation for the data
interface UpdatablePageData {
    title?: string;
    message?: string;
    puzzleBackgroundAnimation?: string;
}

export async function updateLovePage(pageId: string, data: UpdatablePageData) {
    await requireAdmin();
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
        
        // Allow setting the animation to 'none'
        if (typeof data.puzzleBackgroundAnimation !== 'undefined') {
            dataToUpdate.puzzleBackgroundAnimation = data.puzzleBackgroundAnimation;
        }
        
        await pageRef.update(dataToUpdate);

        // Invalidate cache for the admin page to show new data
        revalidatePath('/admin');
        revalidatePath(`/p/${pageId}`);

    } catch (error: any) {
        console.error('[ADMIN_UPDATE_ERROR]', error);
        return { error: `Failed to update page: ${error.message}` };
    }

    // Redirect back to the admin dashboard after successful update
    redirect('/admin');
}

export async function makePagePermanent(pageId: string) {
    await requireAdmin();
    if (!pageId) {
        return { error: 'Page ID is missing.' };
    }

    try {
        const db = getAdminFirestore();
        const pageRef = db.collection('lovepages').doc(pageId);

        await pageRef.update({
            expireAt: FieldValue.delete(),
            plan: 'avancado'
        });

        revalidatePath(`/admin/edit/${pageId}`);
        revalidatePath(`/admin`);
        revalidatePath(`/p/${pageId}`);

        return { success: true };

    } catch (error: any) {
        console.error('[ADMIN_PERMANENT_ERROR]', error);
        return { error: `Failed to make page permanent: ${error.message}` };
    }
}
