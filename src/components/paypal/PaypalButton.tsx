
"use client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { capturePaypalOrder } from "@/app/criar/fazer-eu-mesmo/actions"; // Ajuste o caminho se necessário
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
    <div className="w-full relative min-h-[150px]">
      {isVerifying && (
        <div className="absolute inset-0 z-10 bg-white/50 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-primary" />
          <span className="text-xs font-medium">Verifying payment...</span>
        </div>
      )}
      
      <PayPalScriptProvider options={{ 
          "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
          currency: "USD",
          intent: "capture"
      }}>
        <PayPalButtons
          style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
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
                toast({ title: "Success!", description: "Page created successfully." });
                router.push(`/p/${result.pageId}`);
            } else {
                toast({ variant: "destructive", title: "Error", description: result.error });
                setIsVerifying(false);
            }
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
