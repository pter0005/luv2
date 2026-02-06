"use client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { capturePaypalOrder } from "@/app/criar/fazer-eu-mesmo/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function PaypalButton({ intentId, plan }: { intentId: string, plan: 'basico' | 'avancado' }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);

  const amount = plan === 'avancado' ? "19.90" : "14.90";

  return (
    <div className="w-full relative z-0"> 
      {isVerifying && (
        <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      )}
      
      <PayPalScriptProvider options={{ 
          "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
          currency: "USD",
          intent: "capture",
          // Isso ajuda a evitar o erro de carregar múltiplos scripts
          "data-sdk-integration-source": "react-paypal-js"
      }}>
        <PayPalButtons
          style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
          forceReRender={[amount]} 
          createOrder={(data, actions) => {
            return actions.order.create({
                purchase_units: [{
                    amount: { currency_code: 'USD', value: amount },
                    custom_id: intentId,
                }],
            });
          }}
          onApprove={async (data, actions) => {
            setIsVerifying(true);
            const result = await capturePaypalOrder(data.orderID, intentId);
            if (result.success && result.pageId) {
                router.push(`/p/${result.pageId}`);
            } else {
                toast({ variant: "destructive", title: "Erro", description: result.error });
                setIsVerifying(false);
            }
          }}
          onError={(err) => {
            console.error("ERRO CRÍTICO PAYPAL:", err);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
