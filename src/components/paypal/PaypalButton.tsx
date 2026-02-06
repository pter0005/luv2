
"use client";
import { PayPalButtons, PayPalScriptProvider, OnApproveData } from "@paypal/react-paypal-js";
import { createPaypalOrder, verifyPaypalPayment } from "@/app/criar/fazer-eu-mesmo/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function PaypalButton({ intentId, plan }: { intentId: string, plan: 'basico' | 'avancado' }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    console.error("PayPal Client ID is not set.");
    return <p className="text-destructive text-xs">PayPal is unavailable.</p>;
  }
  
  if (isVerifying) {
      return (
          <div className="flex items-center justify-center w-full h-12">
              <Loader2 className="animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="w-full">
      <PayPalScriptProvider options={{ 
          "clientId": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
          currency: "USD",
          intent: "capture"
      }}>
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
          createOrder={async () => {
            const prices = {
                basico: "14.90",
                avancado: "19.90"
            };
            const price = prices[plan];
            return actions.order.create({
                purchase_units: [
                    {
                        amount: {
                            value: price,
                            currency_code: 'USD',
                        },
                        custom_id: intentId,
                    },
                ],
            });
          }}
          onApprove={async (data: OnApproveData) => {
            setIsVerifying(true);
            try {
                const result = await verifyPaypalPayment(data.orderID, intentId);
                
                if (result.success && result.pageId) {
                    toast({ title: "Payment confirmed!" });
                    router.push(`/p/${result.pageId}`);
                } else {
                    toast({ variant: "destructive", title: "Payment verification failed.", description: result.error });
                }
            } catch (e: any) {
                toast({ variant: "destructive", title: "An error occurred", description: e.message });
            } finally {
                setIsVerifying(false);
            }
          }}
          onError={(err) => {
            console.error("PayPal Button Error:", err);
            toast({
              variant: 'destructive',
              title: 'PayPal Error',
              description: 'An error occurred while processing the payment with PayPal.',
            });
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
