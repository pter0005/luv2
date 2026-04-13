"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  User,
  CreditCard,
  Scale,
  Shield,
  Bot,
  RefreshCcw,
  Lock,
  Copyright,
  XCircle,
  Edit3,
  Gavel,
  Mail,
  Info,
} from 'lucide-react';


const PolicySection = ({ title, icon: Icon, children }: { title: string, icon: React.FC<any>, children: React.ReactNode }) => (
    <section className="space-y-4 scroll-mt-24">
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
  return (
    <div className="relative min-h-screen">
      <div className="container py-16 md:py-24 max-w-4xl mx-auto">
        <Button asChild variant="outline" className="fixed top-6 left-6 md:absolute md:top-8 md:left-8 bg-background/80 md:bg-transparent backdrop-blur-sm z-50">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o início
          </Link>
        </Button>

        <div className="text-center mb-16 pt-16 md:pt-0">
            <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Termos de Uso</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Regras que organizam o uso da plataforma MyCupid. Ao utilizar nossos serviços, você declara que leu, entendeu e concorda com todo o conteúdo deste documento.
            </p>
            <p className="text-xs text-muted-foreground mt-3">Versão 2.0 · Última atualização: 13 de abril de 2026</p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-12 flex gap-3 items-start">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Leitura rápida:</strong> você pode criar páginas digitais personalizadas, paga apenas uma vez por página (sem assinatura), tem <strong className="text-foreground">7 dias para pedir reembolso</strong> conforme o Código de Defesa do Consumidor, e é responsável pelo conteúdo que envia. Este resumo não substitui a leitura integral abaixo.
            </div>
        </div>

        <div className="space-y-12">

            <PolicySection title="1. Aceitação dos Termos" icon={FileText}>
                <p>Estes Termos de Uso (&quot;Termos&quot;) constituem um contrato vinculante entre você (&quot;Usuário&quot;) e o MyCupid (&quot;nós&quot;, &quot;nosso&quot;, &quot;plataforma&quot;), regendo o acesso e a utilização do site <strong>mycupid.com.br</strong> e de todos os serviços oferecidos.</p>
                <p>Ao acessar, navegar, cadastrar-se ou efetuar qualquer compra na plataforma, você confirma que leu, entendeu e aceita integralmente estes Termos, bem como nossa <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>. Caso não concorde com qualquer disposição, você não deve utilizar o serviço.</p>
                <p>Estes Termos podem ser aceitos de forma expressa (marcando uma caixa) ou tácita (pelo simples uso contínuo da plataforma após sua publicação).</p>
            </PolicySection>

            <PolicySection title="2. Sobre o Serviço" icon={Info}>
                <p>O MyCupid é uma plataforma digital que permite a criação de páginas personalizadas com textos, fotos, áudios, músicas, jogos interativos e animações, destinadas a homenagear pessoas queridas (namorados(as), familiares, amigos, entre outros).</p>
                <p>O serviço é prestado exclusivamente em ambiente digital, mediante pagamento único por página criada. Não há assinatura recorrente, cobrança mensal ou renovação automática.</p>
                <p>Nos reservamos o direito de, a qualquer tempo, modificar, suspender, descontinuar ou incluir novas funcionalidades, mantendo, sempre que aplicável, os direitos já adquiridos por páginas previamente criadas e pagas.</p>
            </PolicySection>

            <PolicySection title="3. Cadastro e Uso da Conta" icon={User}>
                <ul className="list-disc pl-5 space-y-2">
                    <li>É necessário ter no mínimo <strong>18 anos</strong> ou estar representado/assistido por responsável legal para criar e utilizar uma página.</li>
                    <li>Você se compromete a fornecer informações verdadeiras, precisas e atualizadas (nome, e-mail, WhatsApp) no momento do cadastro e durante a compra.</li>
                    <li>É sua responsabilidade manter a confidencialidade dos dados de acesso. Você responde por todas as ações realizadas com sua conta.</li>
                    <li>Em caso de suspeita de acesso indevido à sua conta, você deve nos notificar imediatamente por meio dos canais oficiais de suporte.</li>
                    <li>É vedada a criação de múltiplas contas para burlar limites, obter vantagens indevidas ou contornar bloqueios anteriores.</li>
                </ul>
            </PolicySection>

            <PolicySection title="4. Conteúdo do Usuário" icon={Shield}>
                <p>Todo o conteúdo inserido por você na plataforma — incluindo textos, imagens, fotografias, áudios, músicas e demais materiais (&quot;Conteúdo do Usuário&quot;) — é de sua exclusiva responsabilidade. Você declara e garante:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>ser o titular dos direitos autorais, de imagem e de uso sobre todo o Conteúdo enviado, ou possuir as devidas autorizações dos titulares;</li>
                    <li>que o Conteúdo não viola quaisquer direitos de terceiros, incluindo direitos de personalidade, imagem, honra, privacidade e propriedade intelectual;</li>
                    <li>que, ao utilizar fotografias ou dados pessoais de outra pessoa, obteve o consentimento desta, quando aplicável.</li>
                </ul>
                <p>Ao enviar Conteúdo à plataforma, você nos concede uma licença não exclusiva, mundial, gratuita e limitada, exclusivamente para hospedar, armazenar, processar, exibir e transmitir o Conteúdo com a finalidade de operar o serviço. Essa licença cessa caso o Conteúdo seja removido pelo Usuário ou pela plataforma.</p>
                <p className="font-semibold text-destructive">É expressamente proibido o envio de conteúdo que seja ilegal, fraudulento, violento, discriminatório, pornográfico, que envolva menores de idade em contexto inadequado, difamatório, ofensivo, de ódio ou que infrinja direitos de terceiros. Violações resultarão em remoção imediata, suspensão da conta e, quando cabível, comunicação às autoridades competentes.</p>
            </PolicySection>

            <PolicySection title="5. Uso da Inteligência Artificial" icon={Bot}>
                <p>A plataforma pode oferecer funcionalidades assistidas por Inteligência Artificial (&quot;IA&quot;), incluindo, mas não se limitando a, sugestões de textos, ideias criativas e adequações de conteúdo.</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>As sugestões geradas por IA são fornecidas &quot;como estão&quot; e têm caráter meramente auxiliar. Cabe ao Usuário revisar, editar e validar o conteúdo final antes de publicá-lo.</li>
                    <li>Não garantimos precisão, originalidade absoluta, adequação ou veracidade do conteúdo gerado pela IA.</li>
                    <li>É proibido utilizar a IA para gerar conteúdo que viole estes Termos, leis vigentes ou direitos de terceiros. O uso indevido resultará em suspensão imediata da conta.</li>
                </ul>
            </PolicySection>

            <PolicySection title="6. Preços, Pagamentos e Planos" icon={CreditCard}>
                <p>O serviço é oferecido mediante pagamento único por página criada, nos valores exibidos no momento da compra. Os preços podem variar dinamicamente de acordo com promoções, cupons ou campanhas, e eventuais ajustes nunca serão retroativos para páginas já pagas.</p>
                <p><strong className="text-foreground">Planos atualmente oferecidos:</strong></p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Plano Básico:</strong> página disponível por 25 horas a partir da confirmação do pagamento, após o qual é automaticamente arquivada.</li>
                    <li><strong>Plano Avançado:</strong> página disponível de forma permanente, enquanto a plataforma MyCupid estiver em operação, sujeita à manutenção e eventuais interrupções técnicas.</li>
                </ul>
                <p><strong className="text-foreground">Adicionais (add-ons) opcionais:</strong> mensagem de voz, intros animadas, jogos personalizados, QR Code customizado, entre outros. Cada adicional é cobrado separadamente, no momento da criação da página, e seus valores ficam visíveis no checkout antes da confirmação do pagamento.</p>
                <p><strong className="text-foreground">Formas de pagamento:</strong> atualmente, o meio de pagamento principal é o PIX, processado por intermediários de pagamento parceiros (como Mercado Pago). Podemos, a qualquer momento, incluir ou remover formas de pagamento. As transações são processadas em reais brasileiros (BRL), salvo indicação em contrário.</p>
                <p>A confirmação do pagamento é feita de forma automatizada. Em caso de qualquer divergência, o Usuário deve entrar em contato pelos canais oficiais de suporte com o comprovante em mãos.</p>
            </PolicySection>

            <PolicySection title="7. Direito de Arrependimento e Reembolso" icon={RefreshCcw}>
                <p>Em conformidade com o <strong>artigo 49 do Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong>, o Usuário tem o direito de desistir da compra no prazo de <strong>7 (sete) dias corridos</strong>, contados a partir da data de confirmação do pagamento, sem necessidade de justificativa.</p>
                <p>Para exercer o direito de arrependimento, o Usuário deve enviar solicitação formal pelos canais oficiais de suporte (ver seção 14), informando:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Nome completo e e-mail utilizados na compra;</li>
                    <li>ID ou link da página criada;</li>
                    <li>Comprovante de pagamento ou código da transação;</li>
                    <li>Dados bancários para restituição (chave PIX).</li>
                </ul>
                <p>O reembolso será processado em até <strong>7 (sete) dias úteis</strong> após a aprovação da solicitação e restituído integralmente, pelo mesmo meio de pagamento utilizado na compra, sempre que possível.</p>
                <p><strong className="text-foreground">Casos excepcionais de reembolso após o prazo de 7 dias:</strong> indisponibilidade técnica prolongada e comprovada causada pela plataforma, cobrança indevida ou duplicada, erro grave que impeça o uso do produto. Nesses casos, o pedido será analisado individualmente.</p>
                <p>Solicitações de reembolso fora do prazo legal e sem fundamentação técnica poderão ser negadas, visto que se trata de produto digital personalizado de entrega imediata.</p>
            </PolicySection>

            <PolicySection title="8. Privacidade e Proteção de Dados" icon={Lock}>
                <p>O tratamento de dados pessoais é regido pela Lei Geral de Proteção de Dados (<strong>LGPD — Lei nº 13.709/2018</strong>) e descrito em detalhes em nossa <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.</p>
                <p>Em resumo:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Coletamos apenas os dados necessários para operar o serviço (nome, e-mail, WhatsApp, dados de pagamento e conteúdo das páginas);</li>
                    <li>Os dados não são vendidos, alugados ou compartilhados com terceiros para fins de marketing;</li>
                    <li>Você pode solicitar, a qualquer momento, acesso, correção, portabilidade, anonimização ou exclusão dos seus dados pelos canais de suporte;</li>
                    <li>Utilizamos cookies e tecnologias similares para autenticação, métricas e melhoria da experiência.</li>
                </ul>
            </PolicySection>

            <PolicySection title="9. Propriedade Intelectual" icon={Copyright}>
                <p>A marca MyCupid, o logotipo, o domínio, o layout, os códigos-fonte, os designs, as animações, os jogos interativos, as ilustrações, as fontes, o conteúdo editorial e todos os demais elementos do site são de titularidade exclusiva do MyCupid ou de seus licenciadores, sendo protegidos pelas leis de propriedade intelectual aplicáveis.</p>
                <p>É vedada a reprodução, cópia, modificação, engenharia reversa, distribuição, exibição pública ou criação de obras derivadas sem autorização prévia e expressa. O acesso ao serviço não transfere nenhum direito de propriedade intelectual ao Usuário, apenas concede uma licença limitada de uso conforme estes Termos.</p>
            </PolicySection>

            <PolicySection title="10. Suspensão e Encerramento" icon={XCircle}>
                <p>Poderemos suspender, bloquear temporariamente ou excluir definitivamente contas e páginas, a nosso exclusivo critério e mediante aviso quando possível, nos seguintes casos:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Violação destes Termos ou da Política de Privacidade;</li>
                    <li>Envio de conteúdo ilícito, ofensivo ou que viole direitos de terceiros;</li>
                    <li>Tentativas de fraude, manipulação de pagamentos, chargebacks indevidos ou uso de cartões/pix de terceiros sem autorização;</li>
                    <li>Uso da plataforma para atividades que prejudiquem a integridade do serviço ou de outros Usuários;</li>
                    <li>Por determinação judicial ou de autoridade competente.</li>
                </ul>
                <p>O Usuário pode, a qualquer momento, solicitar o encerramento da sua conta e a exclusão dos seus dados pessoais, respeitadas as obrigações legais de retenção (por exemplo, comprovantes fiscais).</p>
            </PolicySection>

            <PolicySection title="11. Limitação de Responsabilidade" icon={Scale}>
                <p>A plataforma é fornecida no estado em que se encontra (&quot;as is&quot;), com a máxima diligência e empenho, porém sem garantia de operação ininterrupta, livre de falhas ou de adequação a finalidades específicas.</p>
                <p>Na máxima extensão permitida pela legislação aplicável, o MyCupid não será responsável por:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>danos indiretos, lucros cessantes, perda de oportunidade ou danos morais decorrentes do uso ou da impossibilidade de uso do serviço;</li>
                    <li>falhas, atrasos ou indisponibilidades causados por terceiros, incluindo provedores de hospedagem, gateways de pagamento, servidores de música (ex.: YouTube) e operadoras de internet;</li>
                    <li>ações de terceiros sobre o conteúdo compartilhado pelo Usuário (ex.: prints, redistribuição não autorizada do link da página);</li>
                    <li>consequências emocionais ou relacionais do uso do serviço — a plataforma é uma ferramenta criativa, sem garantia de resultados afetivos.</li>
                </ul>
                <p>Nada neste item limita ou afasta responsabilidades que não podem ser excluídas por lei, incluindo aquelas decorrentes do Código de Defesa do Consumidor.</p>
            </PolicySection>

            <PolicySection title="12. Alterações dos Termos" icon={Edit3}>
                <p>Podemos atualizar estes Termos periodicamente para refletir mudanças no serviço, em nossas práticas, na legislação aplicável ou em decisões de negócio. A versão mais recente estará sempre disponível nesta página, com a respectiva data de atualização no topo do documento.</p>
                <p>Alterações substanciais serão comunicadas com antecedência razoável pelos canais disponíveis (e-mail cadastrado, aviso no site ou banner). O uso continuado da plataforma após a publicação das alterações representa aceitação tácita das novas condições.</p>
            </PolicySection>

            <PolicySection title="13. Lei Aplicável e Foro" icon={Gavel}>
                <p>Estes Termos são regidos pelas leis da República Federativa do Brasil, com destaque para o Código Civil, o Código de Defesa do Consumidor, o Marco Civil da Internet (Lei nº 12.965/2014) e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
                <p>Fica eleito o foro do domicílio do consumidor para dirimir quaisquer controvérsias oriundas destes Termos, quando aplicável, nos termos do artigo 101 do CDC. Antes de qualquer medida judicial, as partes se comprometem a buscar solução amigável por meio dos canais de suporte.</p>
            </PolicySection>

            <PolicySection title="14. Contato" icon={Mail}>
                <p>Para dúvidas, solicitações de reembolso, exercício de direitos previstos na LGPD, denúncias de conteúdo inadequado ou qualquer outro assunto relacionado a estes Termos, entre em contato pelos canais oficiais:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>E-mail:</strong> contato@mycupid.com.br</li>
                    <li><strong>Suporte via WhatsApp:</strong> disponível na <Link href="/" className="text-primary hover:underline">página inicial</Link>, no rodapé do site.</li>
                </ul>
                <p>Faremos o melhor para responder em até 48 horas úteis.</p>
            </PolicySection>

        </div>

        <div className="text-center mt-16 pt-8 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
                Ao continuar utilizando a MyCupid, você confirma que leu e concorda com estes Termos de Uso.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                © {new Date().getFullYear()} MyCupid. Todos os direitos reservados.
            </p>
        </div>
      </div>
    </div>
  );
}
