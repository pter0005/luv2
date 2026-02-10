'use client'
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { createPayPalOrder, capturePayPalOrder } from "@/app/criar/fazer-eu-mesmo/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// Lê a credencial do environment.
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

export default function PayPalButton({ planType, firebaseIntentId }: { planType: 'basico' | 'avancado', firebaseIntentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
        A chave do cliente PayPal não está configurada. Verifique a variável NEXT_PUBLIC_PAYPAL_CLIENT_ID.
      </div>
    )
  }

  const handleApprove = async (data: any) => {
    setIsProcessing(true);
    setError(null);
    try {
      console.log("PayPal onApprove data:", data);
      
      const result = await capturePayPalOrder(data.orderID, firebaseIntentId);
      console.log("Resultado da captura no servidor:", result);

      if (result.success && result.pageId) {
        // Redireciona para uma página de status intermediária
        router.push(`/criando-pagina?intentId=${data.orderID}`);
      } else {
        setError(result.error || "Ocorreu um erro ao processar seu pagamento.");
        console.error("Erro na captura do PayPal:", result.error);
      }
    } catch (err: any) {
      setError("Erro de conexão. Por favor, tente novamente.");
      console.error("Erro no onApprove do PayPal:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full relative min-h-[100px]">
      <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD", intent: "capture" }}>
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
          createOrder={async () => {
            setError(null);
            console.log("Criando pedido no PayPal para o plano:", planType);
            try {
              const orderId = await createPayPalOrder(planType, firebaseIntentId);
              console.log("ID do Pedido PayPal criado:", orderId);
              return orderId;
            } catch (err: any) {
              console.error("Erro ao criar pedido no PayPal:", err);
              setError(err.message || "Não foi possível iniciar a transação com o PayPal. Tente novamente.");
              throw err;
            }
          }}
          onApprove={handleApprove}
          onError={(err) => {
            console.error("Erro no botão do PayPal:", err);
            setError("Ocorreu um erro inesperado com o PayPal. Por favor, recarregue a página.");
          }}
        />
      </PayPalScriptProvider>
      {isProcessing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-lg z-10">
          <Loader2 className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Processando pagamento...</p>
        </div>
      )}
      {error && <p className="text-destructive text-xs text-center mt-2">{error}</p>}
    </div>
  );
}
