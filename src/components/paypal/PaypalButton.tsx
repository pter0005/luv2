
"use client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { capturePaypalOrder } from "@/app/criar/fazer-eu-mesmo/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PayPalButtonProps {
  intentId: string;
  plan: "basico" | "avancado";
  amount: string;
}

export default function PaypalButton({ intentId, plan, amount }: PayPalButtonProps) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);

  return (
    <div className="w-full relative">
      {/* Se estiver verificando, mostra o loader e esconde o botão */}
      {isVerifying ? (
        <div className="flex flex-col items-center justify-center p-4">
          <Loader2 className="animate-spin text-primary mb-2" />
          <p className="text-sm">Finalizing payment...</p>
        </div>
      ) : (
        <PayPalScriptProvider options={{ 
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
            currency: "USD",
            intent: "capture"
        }}>
          <PayPalButtons
            style={{ layout: "vertical", color: "blue", shape: "rect" }}
            createOrder={(data, actions) => {
              return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [{
                      amount: { currency_code: 'USD', value: amount },
                      custom_id: intentId,
                  }],
              });
            }}
            onApprove={async (data, actions) => {
              setIsVerifying(true); // Começa o loading SÓ DEPOIS que o PayPal aprova
              const result = await capturePaypalOrder(data.orderID, intentId);
              if (result.success) {
                  router.push(`/criando-pagina?intentId=${intentId}`);
              } else {
                  alert("Error: " + result.error);
                  setIsVerifying(false);
              }
            }}
            onError={(err) => {
              console.error("PayPal Script Error:", err);
              setIsVerifying(false);
            }}
          />
        </PayPalScriptProvider>
      )}
    </div>
  );
}
