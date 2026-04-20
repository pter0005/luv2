'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentField() {
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold">Finalizar no checkout</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Seu rascunho está salvo. Vamos continuar no fluxo de pagamento completo com Pix, cartão e checkout seguro.
        </p>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
        onClick={() => router.push('/criar/fazer-eu-mesmo?resume=1&from=chat')}
      >
        Ir para o pagamento
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Você pode revisar tudo na próxima tela antes de pagar
      </p>
    </div>
  );
}
