"use client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { capturePaypalOrder } from "@/app/criar/fazer-eu-mesmo/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PaypalButton({ intentId, plan }: { intentId: string, plan: 'basico' | 'avancado' }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);

  const prices = {
      basico: "14.90",
      avancado: "19.90"
  };
  const amount = prices[plan];

  // LOG DE DEBUG - Veja se isso aparece no console do seu navegador (F12)
  useEffect(() => {
    console.log("PayPal Client ID carregado:", process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? "SIM" : "NÃO");
  }, []);

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return <p className="text-destructive text-xs">PayPal Config Error: Missing Client ID</p>;
  }
  
  if (isVerifying) {
      return (
          <div className="flex flex-col items-center justify-center w-full py-4 gap-2">
              <Loader2 className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Confirming payment...</p>
          </div>
      )
  }

  return (
    <div className="w-full min-h-[150px]"> {/* Altura mínima ajuda a evitar saltos na tela */}
      <PayPalScriptProvider options={{ 
          "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, // CORRIGIDO: use "client-id" com hífen
          currency: "USD",
          intent: "capture"
      }}>
        <PayPalButtons
          style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
          forceReRender={[amount, intentId]} // Garante que o botão atualize se o plano mudar
          createOrder={(data, actions) => {
            return actions.order.create({
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: amount,
                        },
                        custom_id: intentId,
                    },
                ],
            });
          }}
          onApprove={async (data, actions) => {
            setIsVerifying(true);
            try {
                const result = await capturePaypalOrder(data.orderID, intentId);
                
                if (result.success && result.pageId) {
                    toast({ title: "Payment confirmed!", description: "Your page is being created..." });
                    router.push(`/p/${result.pageId}`);
                } else {
                    toast({ variant: "destructive", title: "Verification failed", description: result.error });
                    setIsVerifying(false);
                }
            } catch (e: any) {
                toast({ variant: "destructive", title: "An error occurred", description: e.message });
                setIsVerifying(false);
            }
          }}
          onError={(err) => {
            console.error("ERRO NO BOTÃO DO PAYPAL:", err);
            toast({ variant: 'destructive', title: "PayPal Button Error", description: "Check console for details."})
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
