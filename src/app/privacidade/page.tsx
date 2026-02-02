import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock, Eye, Server, UserCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacidadePage() {
  return (
    <div className="relative min-h-screen">
        <div className="container py-16 md:py-20 max-w-4xl mx-auto">
        <Button asChild variant="outline" className="absolute top-8 left-8 bg-transparent">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o início
          </Link>
        </Button>
        <div className="text-center mb-12 pt-16 md:pt-0">
            <h1 className="text-4xl font-bold font-headline mb-4">Política de Privacidade</h1>
            <p className="text-muted-foreground">
            Sua confiança é fundamental para nós. Entenda como o MyCupid protege e utiliza seus dados.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Última atualização: {new Date().getFullYear()}</p>
        </div>

        <div className="space-y-8">
            
            {/* Introdução */}
            <section className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
                O <strong>MyCupid</strong> (doravante "Plataforma"), desenvolvido e operado com foco na criação de páginas digitais personalizadas, está comprometido com a proteção da sua privacidade. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
            </section>

            {/* 1. Coleta de Dados */}
            <Card className="border-l-4 border-l-purple-500 bg-card/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <Eye className="w-5 h-5 text-purple-400" /> 1. Dados que Coletamos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-400">
                <p>Para fornecer nossos serviços, precisamos coletar certas informações:</p>
                <ul className="list-disc pl-5 space-y-2">
                <li><strong>Dados de Cadastro:</strong> Nome, e-mail e foto de perfil (via Login Google ou cadastro direto) para criar sua conta.</li>
                <li><strong>Conteúdo das Páginas:</strong> Fotos, textos, áudios, datas e nomes que você voluntariamente insere ao criar suas páginas de declaração.</li>
                <li><strong>Dados de Pagamento:</strong> Nome completo, CPF e e-mail para processamento do PIX. <strong>Importante:</strong> Não armazenamos dados sensíveis de cartão de crédito. O processamento é feito inteiramente pelo Mercado Pago.</li>
                <li><strong>Dados de Navegação:</strong> Endereço IP, tipo de navegador e cookies técnicos para garantir o funcionamento e a segurança do site.</li>
                </ul>
            </CardContent>
            </Card>

            {/* 2. Uso dos Dados */}
            <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><UserCheck className="w-6 h-6 text-primary" /> 2. Como Usamos seus Dados</h2>
            <ul className="space-y-3 text-gray-400 list-disc pl-5">
                <li><strong>Prestação do Serviço:</strong> Para gerar, hospedar e exibir as páginas personalizadas que você cria.</li>
                <li><strong>Segurança:</strong> Para autenticar seu acesso e prevenir fraudes ou usos indevidos da plataforma.</li>
                <li><strong>Comunicação:</strong> Para enviar confirmações de pagamento, links das páginas criadas ou avisos importantes sobre o serviço.</li>
                <li><strong>Melhoria Contínua:</strong> Análise anônima de uso para melhorar a experiência do usuário e corrigir bugs.</li>
            </ul>
            </section>

            {/* 3. Compartilhamento */}
            <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Server className="w-6 h-6 text-primary" /> 3. Compartilhamento com Terceiros</h2>
            <p className="text-gray-400 mb-4">
                Não vendemos seus dados pessoais. Compartilhamos informações apenas com parceiros essenciais para o funcionamento do serviço:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="font-bold text-white mb-1">Google Firebase</h3>
                <p className="text-xs text-gray-400">Provedor de infraestrutura de nuvem, banco de dados e autenticação segura.</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="font-bold text-white mb-1">Mercado Pago</h3>
                <p className="text-xs text-gray-400">Gateway de pagamento responsável pelo processamento seguro das transações via PIX.</p>
                </div>
            </div>
            </section>

            {/* 4. Armazenamento e Segurança */}
            <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                <Lock className="w-5 h-5 text-green-400" /> 4. Segurança e Retenção
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-400">
                <p>
                Seus dados são armazenados em servidores seguros do Google (Firebase), que utilizam criptografia de ponta a ponta em trânsito e em repouso.
                </p>
                <p>
                <strong>Arquivos Temporários:</strong> Imagens e áudios enviados durante a criação (rascunho) que não forem finalizados em pagamento podem ser excluídos automaticamente após 30 dias para liberar espaço.
                </p>
                <p>
                <strong>Páginas Publicadas:</strong> Serão mantidas online de acordo com o plano contratado (ex: permanentes para o Plano Avançado ou por tempo limitado para o Plano Básico).
                </p>
            </CardContent>
            </Card>

            {/* 5. Seus Direitos */}
            <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> 5. Seus Direitos (LGPD)</h2>
            <p className="text-gray-400 mb-4">Você tem total controle sobre seus dados. A qualquer momento, você pode solicitar:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Acesso aos seus dados.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Correção de dados incompletos ou errados.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Exclusão da sua conta e páginas.</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Revogação do consentimento.</li>
            </ul>
            <p className="text-sm text-gray-500 mt-4 italic">
                Para exercer esses direitos, entre em contato através do e-mail: <a href="mailto:contatomycupid@gmail.com" className="text-primary hover:underline">contatomycupid@gmail.com</a>.
            </p>
            </section>

            {/* 6. Conteúdo Público */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-4 items-start">
                <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
                <div>
                    <h3 className="font-bold text-yellow-500 text-sm mb-1">Atenção sobre o Compartilhamento</h3>
                    <p className="text-xs text-yellow-200/70">
                        Ao criar uma página e gerar um link (ex: mycupid.com.br/p/xyz), esse link é <strong>público</strong> para quem o possuir. O MyCupid não se responsabiliza pelo compartilhamento do link feito pelo próprio usuário em redes sociais ou aplicativos de mensagem. Recomendamos que compartilhe o link apenas com a pessoa amada ou pessoas de confiança.
                    </p>
                </div>
            </div>
        </div>
        </div>
    </div>
  );
}