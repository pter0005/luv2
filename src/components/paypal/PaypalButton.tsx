"use client";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { createPaypalOrder } from "@/app/criar/fazer-eu-mesmo/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function PaypalButton({ intentId, plan }: { intentId: string, plan: 'basico' | 'avancado' }) {
  const router = useRouter();
  const { toast } = useToast();

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    console.error("PayPal Client ID is not set.");
    return <p className="text-destructive text-xs">PayPal está indisponível.</p>;
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
            try {
              const { orderId } = await createPaypalOrder(intentId, plan);
              return orderId;
            } catch (error) {
              console.error("Error creating PayPal order:", error);
              toast({
                variant: 'destructive',
                title: 'Erro no PayPal',
                description: 'Não foi possível iniciar o pagamento. Tente novamente.',
              });
              throw error;
            }
          }}
          onApprove={async (data, actions) => {
            // O pagamento foi aprovado pelo usuário. 
            // Agora redirecionamos para uma tela de espera enquanto o Webhook processa.
            router.push(`/criando-pagina?intentId=${intentId}`);
          }}
          onError={(err) => {
            console.error("Erro no PayPal Button:", err);
            toast({
              variant: 'destructive',
              title: 'Erro no PayPal',
              description: 'Ocorreu um erro ao processar o pagamento com PayPal.',
            });
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
