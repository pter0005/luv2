"use client";

import { useState, memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';

const faqs_pt = [
  {
    q: 'Quanto tempo demora para criar a página?',
    a: 'Menos de 5 minutos! Você preenche os dados, escolhe fotos, música e mensagem — e pronto. Assim que o pagamento for confirmado, o link é gerado na hora.',
  },
  {
    q: 'Meu amor precisa baixar algum app?',
    a: 'Não! A página abre direto no navegador do celular ou computador. É só enviar o link pelo WhatsApp, Instagram ou qualquer rede social.',
  },
  {
    q: 'Por quanto tempo a página fica no ar?',
    a: 'No Plano Básico, a página fica disponível por 25 horas — ideal para uma surpresa pontual. No Plano Avançado, a página fica online para sempre, como uma lembrança eterna.',
  },
  {
    q: 'Posso editar a página depois de criar?',
    a: 'Após a criação, a página é publicada automaticamente. Se precisar de algum ajuste, entre em contato pelo nosso suporte via WhatsApp e resolvemos rapidamente.',
  },
  {
    q: 'Quais formas de pagamento vocês aceitam?',
    a: 'Aceitamos PIX (aprovação instantânea pelo Mercado Pago) e PayPal/cartão de crédito para pagamentos internacionais. O PIX é a forma mais rápida — a página é liberada em segundos.',
  },
  {
    q: 'E se eu não gostar do resultado?',
    a: 'Oferecemos garantia de 7 dias. Se não ficar satisfeito, devolvemos 100% do valor. Sem burocracia, sem perguntas.',
  },
  {
    q: 'Posso colocar fotos e vídeos?',
    a: 'Sim! Você pode adicionar até 15 fotos na galeria, vídeos de fundo, linha do tempo com momentos especiais, e até gravar uma mensagem de voz.',
  },
  {
    q: 'A pessoa que recebe sabe quanto eu paguei?',
    a: 'Não. A página não mostra nenhuma informação sobre pagamento ou plano. A pessoa que recebe vê apenas a surpresa que você criou.',
  },
];

const faqs_en = [
  {
    q: 'How long does it take to create the page?',
    a: 'Under 5 minutes! You fill in the details, pick photos, music and your message — that\'s it. The link is generated instantly after payment.',
  },
  {
    q: 'Does my love need to download an app?',
    a: 'No! The page opens right in any phone or computer browser. Just send the link over text, WhatsApp, Instagram or any social network.',
  },
  {
    q: 'How long does the page stay online?',
    a: 'On the Basic plan, the page stays live for 25 hours — perfect for a one-shot surprise. On the Advanced plan, the page stays online forever as a lasting keepsake.',
  },
  {
    q: 'Can I edit the page after creating it?',
    a: 'The page is published automatically once created. If you need a tweak, reach out to our support and we\'ll sort it out quickly.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards via Stripe — secure, PCI-compliant and with Apple Pay / Google Pay support. Your page is released instantly after payment.',
  },
  {
    q: 'What if I don\'t love the result?',
    a: 'We offer a 7-day money-back guarantee. If you\'re not happy, we refund 100%. No hoops, no questions.',
  },
  {
    q: 'Can I add photos and videos?',
    a: 'Yes! You can add up to 15 photos to the gallery, background videos, a timeline of special moments, and even record a voice note.',
  },
  {
    q: 'Will the recipient see how much I paid?',
    a: 'No. The page never shows any payment or plan info. The recipient sees only the surprise you created.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-white/10 rounded-2xl overflow-hidden transition-colors hover:border-white/20"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-[15px] font-semibold text-white leading-snug">{q}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-purple-400 shrink-0 transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-white/60 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FAQSection = () => {
  const locale = useLocale();
  const isEN = locale === 'en';
  const faqs = isEN ? faqs_en : faqs_pt;

  return (
    <div className="container max-w-3xl relative z-10">
      <div className="text-center mb-12">
        <h2 className="font-headline font-bold tracking-tighter text-4xl md:text-5xl">
          {isEN ? <>Frequently <span className="text-primary">asked</span></> : <>Perguntas <span className="text-primary">Frequentes</span></>}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm max-w-lg mx-auto">
          {isEN ? 'Everything you need to know before creating your surprise.' : 'Tudo que você precisa saber antes de criar sua surpresa.'}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => (
          <FAQItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>

      {/* FAQPage schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          }),
        }}
      />
    </div>
  );
};

export default memo(FAQSection);
