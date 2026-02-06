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
          createOrder={async () => await createPayPalOrder(planType)}
          onApprove={async (data) => {
            try {
              const result = await capturePayPalOrder(data.orderID, firebaseIntentId);
              if (result.success) {
                // Redireciona para sucesso
                router.push(`/pagamento/sucesso?id=${firebaseIntentId}`); 
              } else {
                setErrorMsg("Pagamento não processado.");
              }
            } catch (err) {
              setErrorMsg("Erro de conexão.");
            }
          }}
        />
      </PayPalScriptProvider>
      {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
    </div>
  );
}
