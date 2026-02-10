"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock, Eye, Server, UserCheck, AlertTriangle, FileText, User, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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


export default function PrivacidadePage() {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen">
        <div className="container py-16 md:py-24 max-w-4xl mx-auto">
        <Button asChild variant="outline" className="fixed top-6 left-6 md:absolute md:top-8 md:left-8 bg-background/80 md:bg-transparent backdrop-blur-sm z-50">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('privacy.back')}
          </Link>
        </Button>
        <div className="text-center mb-16 pt-16 md:pt-0">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Política de Privacidade</h1>
            <p className="text-lg text-muted-foreground">
                Sua confiança é nossa prioridade. Entenda como protegemos seus dados.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Última atualização: 24 de Julho de 2024</p>
        </div>

        {/* TL;DR Section */}
        <div className="mb-16">
             <h2 className="text-2xl font-bold text-center mb-8">Em resumo, nós...</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="card-glow text-center p-4">
                    <Eye className="w-8 h-8 text-primary mx-auto mb-2"/>
                    <p className="text-sm font-semibold">Coletamos apenas o essencial</p>
                    <p className="text-xs text-muted-foreground mt-1">Seu e-mail para login e o conteúdo que você cria.</p>
                </Card>
                 <Card className="card-glow text-center p-4">
                    <Lock className="w-8 h-8 text-primary mx-auto mb-2"/>
                    <p className="text-sm font-semibold">Não vendemos seus dados</p>
                    <p className="text-xs text-muted-foreground mt-1">Jamais compartilharemos suas informações para fins de marketing.</p>
                </Card>
                 <Card className="card-glow text-center p-4">
                    <UserCheck className="w-8 h-8 text-primary mx-auto mb-2"/>
                    <p className="text-sm font-semibold">Você está no controle</p>
                    <p className="text-xs text-muted-foreground mt-1">Você pode ver, editar ou apagar suas informações a qualquer momento.</p>
                </Card>
             </div>
        </div>

        <div className="space-y-12">
            <PolicySection title="Introdução" icon={Info}>
                <p>
                    O <strong>MyCupid</strong> (doravante "Plataforma"), operado por G.B. SERVIÇOS DE TECNOLOGIA DA INFORMAÇÃO LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 64.966.299/0001-16, está comprometido com a proteção da sua privacidade. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                </p>
            </PolicySection>

            <PolicySection title="1. Dados que Coletamos" icon={Eye}>
                <p>Para fornecer nossos serviços, precisamos coletar certas informações:</p>
                <ul className="list-disc pl-5 space-y-2">
                <li><strong>Dados de Cadastro:</strong> Nome, e-mail e foto de perfil (via Login Google ou cadastro direto) para criar e proteger sua conta.</li>
                <li><strong>Conteúdo das Páginas:</strong> Fotos, textos, áudios, datas e nomes que você voluntariamente insere ao criar suas páginas de declaração. Este conteúdo é tratado como sua propriedade.</li>
                <li><strong>Dados de Pagamento:</strong> Processados de forma segura por nossos parceiros (Stripe, Mercado Pago, PayPal). <strong>Não armazenamos</strong> dados de cartão de crédito.</li>
                <li><strong>Dados de Navegação:</strong> Endereço IP, tipo de navegador e cookies técnicos para garantir o funcionamento, segurança e melhoria contínua do site.</li>
                </ul>
            </PolicySection>

            <PolicySection title="2. Como Usamos seus Dados" icon={UserCheck}>
                <ul className="list-disc pl-5 space-y-3">
                    <li><strong>Prestação do Serviço:</strong> Para gerar, hospedar e exibir as páginas personalizadas que você cria com tanto carinho.</li>
                    <li><strong>Segurança da Conta:</strong> Para autenticar seu acesso, proteger suas criações e prevenir fraudes ou usos indevidos.</li>
                    <li><strong>Comunicação Essencial:</strong> Para enviar confirmações de pagamento, links das páginas criadas ou avisos importantes sobre o serviço.</li>
                    <li><strong>Melhoria Contínua:</strong> Análise de dados de uso de forma anônima e agregada para entendermos como melhorar a experiência e corrigir eventuais problemas.</li>
                </ul>
            </PolicySection>
            
            <PolicySection title="3. Compartilhamento com Terceiros" icon={Server}>
                 <p className="mb-4">
                    Seus dados não são um produto. Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. O compartilhamento ocorre apenas com parceiros essenciais e seguros para a operação do serviço:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-card/80 border border-border">
                        <h3 className="font-bold text-foreground mb-1">Google Firebase</h3>
                        <p className="text-xs text-muted-foreground">Provedor de infraestrutura de nuvem, banco de dados (Firestore), autenticação segura e armazenamento de arquivos (Storage).</p>
                    </div>
                    <div className="p-4 rounded-lg bg-card/80 border border-border">
                        <h3 className="font-bold text-foreground mb-1">Gateways de Pagamento</h3>
                        <p className="text-xs text-muted-foreground">Stripe, Mercado Pago e PayPal processam as transações de forma segura e criptografada.</p>
                    </div>
                </div>
            </PolicySection>
            
            <PolicySection title="4. Segurança e Retenção de Dados" icon={Lock}>
                 <p>
                    Levamos a segurança a sério. Seus dados são armazenados em servidores de ponta do Google Firebase, com criptografia em trânsito e em repouso.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong>Rascunhos:</strong> Dados inseridos durante a criação de uma página são salvos temporariamente para que você possa continuar depois. Rascunhos inativos por mais de 30 dias podem ser excluídos.
                    </li>
                    <li>
                        <strong>Páginas Publicadas:</strong> Páginas do <strong>Plano Avançado</strong> são mantidas permanentemente. Páginas do <strong>Plano Básico</strong> ficam disponíveis por 12 horas após a criação.
                    </li>
                </ul>
            </PolicySection>

            <PolicySection title="5. Seus Direitos (LGPD)" icon={Shield}>
                <p>Você tem total controle sobre seus dados. A qualquer momento, você pode nos contatar para solicitar:</p>
                 <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Acesso e confirmação dos seus dados.</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Correção de dados incompletos ou errados.</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Exclusão da sua conta e de todas as suas páginas.</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Revogação do consentimento de uso.</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4 italic">
                    Para exercer esses direitos, entre em contato através do e-mail: <a href="mailto:contatomycupid@gmail.com" className="text-primary hover:underline">contatomycupid@gmail.com</a>.
                </p>
            </PolicySection>

            <div className="p-6 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-lg flex gap-4 items-start">
                <AlertTriangle className="w-10 h-10 text-yellow-500 shrink-0 mt-1" />
                <div>
                    <h3 className="font-bold text-yellow-400 text-lg mb-1">Atenção sobre o Compartilhamento</h3>
                    <p className="text-sm text-yellow-200/80 leading-relaxed">
                        Ao criar uma página, você gera um link público. Qualquer pessoa com este link poderá ver seu conteúdo. O MyCupid não se responsabiliza pelo compartilhamento do link feito por você. Recomendamos que compartilhe o link apenas com pessoas de sua confiança.
                    </p>
                </div>
            </div>
        </div>
        </div>
    </div>
  );
}
