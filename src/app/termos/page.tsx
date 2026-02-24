"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, User, CreditCard, Scale, Shield, Bot } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';


const PolicySection = ({ title, icon: Icon, children }: { title: string, icon: React.FC<any>, children: React.ReactNode }) => (
    <section className="space-y-4">
        <h2 className="flex items-center gap-3 text-2xl font-bold font-headline text-primary border-b border-primary/20 pb-2">
            <Icon className="w-6 h-6" />
            <span>{title}</span>
        </h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
            {children}
        </div>
    </section>
);


export default function TermosPage() {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen">
      <div className="container py-16 md:py-24 max-w-4xl mx-auto">
      <Button asChild variant="outline" className="fixed top-6 left-6 md:absolute md:top-8 md:left-8 bg-background/80 md:bg-transparent backdrop-blur-sm z-50">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('terms.back')}
          </Link>
        </Button>
        <div className="text-center mb-16 pt-16 md:pt-0">
            <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">{t('terms.title')}</h1>
            <p className="text-lg text-muted-foreground">
                {t('terms.description')}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Última atualização: 24 de Julho de 2024</p>
        </div>

        <div className="space-y-12">
            <PolicySection title="1. Aceitação dos Termos" icon={FileText}>
                <p>Ao acessar e usar a plataforma MyCupid, você concorda em cumprir estes Termos de Uso e nossa <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>. Se você não concorda com qualquer parte dos termos, não deve utilizar nossos serviços.</p>
            </PolicySection>

            <PolicySection title="2. Uso do Serviço" icon={User}>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Você deve ter no mínimo 18 anos de idade para criar uma conta e utilizar os serviços.</li>
                    <li>Você é responsável por manter a confidencialidade de sua conta e senha.</li>
                    <li>O uso da plataforma para qualquer finalidade ilegal ou não autorizada é estritamente proibido.</li>
                </ul>
            </PolicySection>
            
            <PolicySection title="3. Conteúdo do Usuário" icon={Shield}>
                <p>Todo o conteúdo que você adiciona às suas páginas (textos, fotos, áudios) é de sua inteira responsabilidade. Você declara que possui os direitos necessários sobre todo o conteúdo enviado.</p>
                <p>Você nos concede uma licença não exclusiva, mundial e isenta de royalties para hospedar, exibir e operar o conteúdo exclusivamente com o propósito de fornecer os serviços da plataforma a você.</p>
                 <p className="font-bold text-destructive">É estritamente proibido o upload de conteúdo que seja ilegal, odioso, pornográfico, difamatório ou que infrinja os direitos de terceiros.</p>
            </PolicySection>

            <PolicySection title="4. Uso da Inteligência Artificial" icon={Bot}>
                <p>A funcionalidade de sugestão de conteúdo por IA é uma ferramenta para auxiliar sua criatividade. As sugestões são geradas por um modelo de linguagem e devem ser revisadas por você.</p>
                <p>O uso indevido da ferramenta de IA para gerar conteúdo inapropriado ou que viole estes termos resultará na suspensão da sua conta.</p>
            </PolicySection>
            
            <PolicySection title="5. Pagamentos e Planos" icon={CreditCard}>
                 <p>Os serviços são oferecidos mediante pagamento único, conforme descrito na página de planos. Os preços estão sujeitos a alterações.</p>
                <p>O <strong>Plano Básico</strong> oferece disponibilidade da página por 12 horas. O <strong>Plano Avançado</strong> oferece disponibilidade permanente, sujeita à continuidade da plataforma MyCupid.</p>
                <p>Não oferecemos reembolsos após a confirmação do pagamento e a geração da página, uma vez que se trata de um produto digital personalizado e de entrega imediata.</p>
            </PolicySection>

            <PolicySection title="6. Limitação de Responsabilidade" icon={Scale}>
                <p>O MyCupid é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. Em nenhuma circunstância seremos responsáveis por quaisquer danos diretos ou indiretos resultantes do uso ou da incapacidade de usar o serviço.</p>
            </PolicySection>
        </div>
      </div>
    </div>
  );
}
