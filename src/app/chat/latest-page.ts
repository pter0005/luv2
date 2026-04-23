'use server';

import { getAdminFirestore } from '@/lib/firebase/admin/config';

export interface LatestPageResult {
  exists: boolean;
  pageId?: string;
  title?: string;
  plan?: string;
  createdAt?: string;
  count?: number;
}

/**
 * Busca a página mais recente do user logado. Usado pra mostrar "Você já tem
 * uma página" no topo do /chat e da landing — evita que o cliente preencha
 * todo o wizard de novo achando que perdeu a primeira (caso mais comum: fechar
 * aba, trocar de device, limpar storage).
 *
 * Retorna só a última paga/ativa; `count` é o total pro caso de múltiplas
 * páginas (podemos linkar pra /minhas-paginas se > 1).
 */
export async function getLatestPageForUser(userId: string): Promise<LatestPageResult> {
  if (!userId) return { exists: false };
  try {
    const db = getAdminFirestore();
    // Firestore: where + orderBy em campos diferentes precisam de índice composto.
    // Pra evitar o índice, buscamos todas as páginas do user e ordenamos em
    // memória. Limite 20 pra proteção — raramente user tem mais que isso.
    const snap = await db.collection('lovepages')
      .where('userId', '==', userId)
      .limit(20)
      .get();
    if (snap.empty) return { exists: false };

    const pages = snap.docs
      .map(d => ({ id: d.id, data: d.data() }))
      .filter(p => !!p.data.paymentId) // só páginas finalizadas (pagas/gift)
      .sort((a, b) => {
        const ta = a.data.createdAt?.toMillis?.() ?? 0;
        const tb = b.data.createdAt?.toMillis?.() ?? 0;
        return tb - ta; // mais recente primeiro
      });

    if (pages.length === 0) return { exists: false };
    const latest = pages[0];
    return {
      exists: true,
      pageId: latest.id,
      title: latest.data.title || undefined,
      plan: latest.data.plan || undefined,
      createdAt: latest.data.createdAt?.toDate?.()?.toISOString(),
      count: pages.length,
    };
  } catch (err) {
    console.warn('[getLatestPageForUser] failed:', err);
    return { exists: false };
  }
}
