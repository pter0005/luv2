import { redirect } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import Link from 'next/link';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { status?: string; intent?: string };
}

/**
 * Página de retorno após checkout do Mercado Pago (cartão).
 * - approved: busca o pageId no intent e redireciona pra /p/[pageId]
 * - rejected/pending: mostra mensagem e botão pra voltar pro /chat
 */
export default async function PagamentoReturnPage({ searchParams }: PageProps) {
  const status = searchParams.status;
  const intentId = searchParams.intent;

  let pageIdResolved: string | null = null;
  if (status === 'approved' && intentId) {
    try {
      const db = getAdminFirestore();
      // Webhook pode ainda não ter finalizado — esperamos até ~6s com 3 checagens
      for (let i = 0; i < 3; i++) {
        const doc = await db.collection('payment_intents').doc(intentId).get();
        const pageId = doc.data()?.pageId;
        if (pageId) {
          pageIdResolved = pageId;
          break;
        }
        if (i < 2) await new Promise((r) => setTimeout(r, 2000));
      }
    } catch {
      // Fall through pra UI abaixo
    }
  }
  if (pageIdResolved) {
    redirect(`/p/${pageIdResolved}`);
  }

  const isPending = status === 'pending';
  const isRejected = status === 'rejected' || status === 'failure';

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl p-8 bg-white/[0.04] ring-1 ring-white/10 text-center">
        {isRejected ? (
          <>
            <XCircle className="w-14 h-14 mx-auto text-red-400 mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Pagamento não aprovado</h1>
            <p className="text-sm text-white/70 mb-6">
              O cartão foi recusado. Tente outro método ou outro cartão.
            </p>
          </>
        ) : isPending ? (
          <>
            <Clock className="w-14 h-14 mx-auto text-amber-400 mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Pagamento em análise</h1>
            <p className="text-sm text-white/70 mb-6">
              Assim que for aprovado, mandamos o link da sua página no WhatsApp.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-400 mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Pagamento recebido</h1>
            <p className="text-sm text-white/70 mb-6">
              Estamos processando sua página — você vai receber o link em instantes.
            </p>
          </>
        )}
        <Link
          href="/chat"
          className="inline-block w-full h-11 leading-[2.75rem] rounded-xl bg-white hover:bg-white/90 text-black font-semibold transition"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
