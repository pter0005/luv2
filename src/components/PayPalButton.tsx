'use client'

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { createPayPalOrder, capturePayPalOrder } from "@/app/actions/paypal";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  planType: 'basic' | 'advanced';
  firebaseIntentId: string;
}

export default function PayPalButton({ planType, firebaseIntentId }: Props) {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    intent: "capture",
  };

  return (
    <div className="w-full mt-4 z-0 relative">
      <PayPalScriptProvider options={paypalOptions}>
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
          createOrder={async () => {
              try {
                  console.log("Attempting to create PayPal order for plan:", planType);
                  const orderId = await createPayPalOrder(planType);
                  console.log("PayPal Order ID created successfully:", orderId);
                  return orderId;
              } catch (error) {
                  console.error("Client-side error creating PayPal order:", error);
                  setErrorMsg("Could not initiate PayPal payment. Check console for details.");
                  throw error;
              }
          }}
          onApprove={async (data) => {
            console.log("PayPal order approved by user. Data:", data);
            try {
              const result = await capturePayPalOrder(data.orderID, firebaseIntentId);
              if (result.success && result.pageId) {
                console.log("Capture successful, redirecting to page:", result.pageId);
                router.push(`/p/${result.pageId}`); 
              } else {
                console.error("Server failed to capture PayPal order. Result:", result);
                setErrorMsg(result.error || "Pagamento não processado pelo servidor.");
              }
            } catch (err: any) {
              console.error("Client-side error capturing PayPal order:", err);
              setErrorMsg(err.message || "Erro de conexão ao finalizar pagamento.");
            }
          }}
          onError={(err: any) => {
              console.error("PayPal Button onError callback:", err);
              setErrorMsg("Ocorreu um erro com o PayPal. Tente novamente ou use outro método.");
          }}
        />
      </PayPalScriptProvider>
      {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
    </div>
  );
}
