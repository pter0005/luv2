'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { Timestamp } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-action-guard';
import { revalidatePath } from 'next/cache';

/**
 * Overrides dos templates de WhatsApp — permite admin editar o texto de
 * qualquer template e ver a mesma edição em outro device.
 *
 * Antes: state local `customText` perdia tudo ao trocar de aba/device.
 * Agora: doc único `admin_whatsapp_overrides/global` com `{ [templateId]: text }`.
 *
 * Source of truth no Firestore. UI faz cache otimista em localStorage pra
 * evitar flash de "vazio" no load.
 */

const DOC_PATH = 'admin_whatsapp_overrides/global';

export type TemplateOverrides = Record<string, string>;

export async function getTemplateOverrides(): Promise<TemplateOverrides> {
  await requireAdmin();
  try {
    const db = getAdminFirestore();
    const snap = await db.doc(DOC_PATH).get();
    if (!snap.exists) return {};
    const d = snap.data()!;
    const overrides = d.overrides && typeof d.overrides === 'object' ? d.overrides : {};
    // Sanitize: só strings
    const out: TemplateOverrides = {};
    for (const k in overrides) {
      if (typeof overrides[k] === 'string') out[String(k).slice(0, 100)] = String(overrides[k]).slice(0, 2000);
    }
    return out;
  } catch {
    return {};
  }
}

export async function saveTemplateOverride(
  templateId: string,
  text: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const id = String(templateId || '').slice(0, 100);
  const content = String(text || '').slice(0, 2000);
  if (!id) return { success: false, error: 'invalid_id' };

  try {
    const db = getAdminFirestore();
    // Merge dot-notation pra atualizar só o key específico (não sobrescreve outros)
    await db.doc(DOC_PATH).set(
      { overrides: { [id]: content }, updatedAt: Timestamp.now() },
      { merge: true },
    );
    revalidatePath('/admin/whatsapp');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'unknown' };
  }
}

export async function clearTemplateOverride(templateId: string): Promise<{ success: boolean }> {
  await requireAdmin();
  const id = String(templateId || '').slice(0, 100);
  if (!id) return { success: false };

  try {
    const db = getAdminFirestore();
    const ref = db.doc(DOC_PATH);
    const snap = await ref.get();
    if (!snap.exists) return { success: true };
    const overrides = { ...(snap.data()?.overrides || {}) };
    delete overrides[id];
    await ref.set({ overrides, updatedAt: Timestamp.now() }, { merge: false });
    revalidatePath('/admin/whatsapp');
    return { success: true };
  } catch {
    return { success: false };
  }
}
