'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-action-guard';
import { revalidatePath } from 'next/cache';

/**
 * Persistência de presets/templates do WhatsApp no Firestore.
 *
 * Antes ficava só em localStorage → PC e celular NUNCA sincronizavam, admin
 * criava preset no desktop e não aparecia no mobile. Agora fica em
 * `admin_whatsapp_presets/global` como source of truth. LocalStorage vira
 * só cache otimista.
 *
 * Doc fixo "global" porque existe 1 conjunto de presets por conta admin
 * (não é multi-tenant). Se no futuro virar multi-admin, muda pra UID-based.
 */

export type MessagePreset = {
  id: string;
  name: string;
  content: string;
  builtin?: boolean;
};

export type PresetsState = {
  customPresets: MessagePreset[];
  defaultPresetId: string;
  updatedAt?: string;
};

const DOC_PATH = 'admin_whatsapp_presets/global';

export async function getPresets(): Promise<PresetsState> {
  await requireAdmin();
  const db = getAdminFirestore();
  const snap = await db.doc(DOC_PATH).get();
  if (!snap.exists) return { customPresets: [], defaultPresetId: '' };
  const d = snap.data()!;
  return {
    customPresets: Array.isArray(d.customPresets) ? d.customPresets : [],
    defaultPresetId: typeof d.defaultPresetId === 'string' ? d.defaultPresetId : '',
    updatedAt: d.updatedAt?.toDate?.()?.toISOString(),
  };
}

export async function saveCustomPresets(presets: MessagePreset[]): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  if (!Array.isArray(presets)) return { success: false, error: 'invalid_input' };
  // Sanitize pra evitar doc enorme (max 50 presets, 2000 chars cada)
  const clean = presets.slice(0, 50).map(p => ({
    id: String(p.id || '').slice(0, 100),
    name: String(p.name || '').slice(0, 100),
    content: String(p.content || '').slice(0, 2000),
    builtin: !!p.builtin,
  })).filter(p => p.id && p.name && p.content);

  try {
    const db = getAdminFirestore();
    await db.doc(DOC_PATH).set({ customPresets: clean, updatedAt: Timestamp.now() }, { merge: true });
    revalidatePath('/admin/recuperar-pix');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'unknown' };
  }
}

export async function saveDefaultPreset(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const cleanId = String(id || '').slice(0, 100);
  try {
    const db = getAdminFirestore();
    await db.doc(DOC_PATH).set({ defaultPresetId: cleanId, updatedAt: Timestamp.now() }, { merge: true });
    revalidatePath('/admin/recuperar-pix');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'unknown' };
  }
}
