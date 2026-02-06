
'use client'
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { createPayPalOrder, capturePayPalOrder } from "@/app/criar/fazer-eu-mesmo/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function PayPalButton({ planType, firebaseIntentId }: { planType: string, firebaseIntentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (data: any) => {
    setIsProcessing(true);
    setError(null);
    try {
      console.log("PayPal onApprove data:", data);
      const result = await capturePayPalOrder(data.orderID, firebaseIntentId);
      console.log("Capture result from server:", result);
      if (result.success && result.pageId) {
        // Redirect to the newly created page
        router.push(`/p/${result.pageId}`);
      } else {
        setError(result.error || "An error occurred while processing your payment.");
        console.error("PayPal Capture Error:", result.error);
      }
    } catch (err: any) {
      setError("Connection error. Please try again.");
      console.error("PayPal OnApprove Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full relative min-h-[100px]">
      <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!, currency: "USD" }}>
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
          createOrder={async () => {
            setError(null);
            console.log("Creating PayPal order for plan:", planType);
            try {
              const orderId = await createPayPalOrder(planType);
              console.log("PayPal Order ID created:", orderId);
              return orderId;
            } catch (err) {
              console.error("PayPal Create Order Error:", err);
              setError("Could not initiate PayPal transaction. Please try again.");
              throw err;
            }
          }}
          onApprove={handleApprove}
          onError={(err) => {
            console.error("PayPal Button Error:", err);
            setError("An unexpected error occurred with PayPal. Please reload the page.");
          }}
        />
      </PayPalScriptProvider>
      {isProcessing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 rounded-lg z-10">
          <Loader2 className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Processing payment...</p>
        </div>
      )}
      {error && <p className="text-destructive text-xs text-center mt-2">{error}</p>}
    </div>
  );
}
