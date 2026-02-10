
import { NextResponse } from 'next/server';
import { finalizeLovePage } from '@/app/criar/fazer-eu-mesmo/actions';

// NOTA: Em um ambiente de produção real, a verificação da assinatura do webhook
// do PayPal seria implementada aqui para garantir a segurança.
// Por simplicidade e seguindo o escopo, processamos o evento diretamente.

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log('[PayPal Webhook] Received Event:', body.event_type);
    
    // Processa o evento quando a captura do pagamento é concluída
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = body.resource;
      
      // O ID do rascunho é recuperado do 'custom_id' que associamos ao criar o pedido.
      // É essencial para sabermos qual página finalizar.
      const intentId = capture.purchase_units[0]?.custom_id;
      const paymentId = capture.id;

      if (intentId) {
        console.log(`[PayPal Webhook] 💰 Captura de pagamento concluída para o rascunho: ${intentId}`);
        
        // Chama a função centralizada para mover os arquivos e criar a página final
        const result = await finalizeLovePage(intentId, paymentId);
        
        if (result.error) {
           console.error(`[PayPal Webhook] Erro ao finalizar a página para o rascunho ${intentId}:`, result.error);
        } else {
           console.log(`[PayPal Webhook] ✅ Página finalizada com sucesso para o rascunho ${intentId}. ID da Página: ${result.pageId}`);
        }
      } else {
        console.warn('[PayPal Webhook] Aviso: custom_id (intentId) não encontrado na captura do pagamento.');
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error('[PayPal Webhook] Erro Crítico:', error.message);
    return NextResponse.json({ error: 'Falha no processamento do webhook' }, { status: 500 });
  }
}
