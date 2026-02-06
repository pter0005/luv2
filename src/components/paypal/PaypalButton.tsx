
"use client";
import { PayPalScriptProvider, PayPalButtons, OnApproveData } from "@paypal/react-paypal-js";
import { capturePaypalOrder } from "@/app/criar/fazer-eu-mesmo/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
          style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
          createOrder={async (data, actions) => {
            return actions.order.create({
                purchase_units: [
                    {
                        amount: {
                            value: amount,
                            currency_code: 'USD',
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
                    toast({ variant: "destructive", title: "Payment verification failed.", description: result.error });
                    setIsVerifying(false);
                }
            } catch (e: any) {
                toast({ variant: "destructive", title: "An error occurred", description: e.message });
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
