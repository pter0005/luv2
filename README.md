# MyCupid - Plataforma de Páginas de Amor Digitais

## 1. Visão Geral do Projeto

O MyCupid é uma aplicação web construída com Next.js que permite aos usuários criar páginas de declaração de amor personalizadas e interativas. O objetivo é oferecer uma alternativa moderna e digital a presentes tradicionais, permitindo que os usuários expressem seus sentimentos através de uma experiência multimídia única, que pode ser compartilhada via um link ou QR Code.

O projeto é monetizado através de um modelo de pagamento único por página, com dois níveis de plano: **Econômico** e **Avançado**, cada um oferecendo diferentes conjuntos de recursos.

---

## 2. Funcionalidades Principais

- **Wizard de Criação de Páginas:** Um assistente passo a passo (`/criar/fazer-eu-mesmo`) guia o usuário na montagem da sua página de amor.
- **Personalização de Conteúdo:**
  - Título e mensagem de amor com formatação.
  - Contador de tempo de relacionamento a partir de uma data especial.
  - Galeria de fotos com diferentes estilos de visualização (Cubo, Flip, etc.).
  - Linha do tempo 3D interativa para exibir momentos especiais.
  - Trilha sonora com música do YouTube (busca via IA) ou gravação de voz.
  - Animações de fundo (corações, estrelas, etc.).
- **Elementos Interativos:**
  - **Quebra-Cabeça:** O destinatário deve resolver um quebra-cabeça com uma foto especial para revelar o conteúdo da página.
  - **Jogo da Memória:** Um jogo da memória personalizável com as fotos do casal.
- **Autenticação de Usuários:** Sistema de login e cadastro com e-mail/senha ou Google, permitindo que os usuários salvem e gerenciem suas páginas criadas (`/minhas-paginas`).
- **Sistema de Pagamento:** Integração com **Mercado Pago** para pagamentos em BRL (via PIX) e **PayPal/Stripe** para pagamentos internacionais (USD).
- **Painel de Administração:** Uma área segura (`/admin`) para os proprietários do site visualizarem estatísticas de vendas, contagem de usuários e gerenciarem as páginas criadas.
- **Internacionalização (i18n):** Suporte para Português (pt), Inglês (en) e Espanhol (es), com detecção baseada no domínio e cabeçalhos do navegador.

---

## 3. Estrutura do Projeto

A arquitetura do projeto segue o padrão do **Next.js App Router**. Abaixo estão os diretórios e arquivos mais importantes:

-   `src/app/`: Contém todas as rotas da aplicação.
    -   `criar/fazer-eu-mesmo/`: O coração da aplicação, onde reside o **Wizard de Criação de Páginas** (`CreatePageWizard.tsx`) e suas actions (`actions.ts`).
    -   `p/[pageId]/`: O template da página de amor pública que o destinatário visualiza.
    -   `admin/`: As rotas e lógica do painel de administração.
    -   `login/`, `minhas-paginas/`: Rotas de autenticação e gerenciamento de usuário.
    -   `api/webhooks/`: Endpoints para receber notificações de pagamento dos gateways.
-   `src/components/`: Componentes React reutilizáveis (UI, layout, efeitos, etc.).
-   `src/firebase/`: Configuração do cliente Firebase, hooks (`useUser`, `useCollection`) e provedores de contexto.
-   `src/lib/`: Funções utilitárias, lógica de i18n, e configurações de Firebase Admin (`server-side`).
-   `src/ai/`: Fluxos do **Genkit** para funcionalidades de IA, como a busca de vídeos no YouTube.
-   `docs/backend.json`: **Blueprint crucial** que define a estrutura de dados (entidades) e a organização do Firestore. Serve como uma "fonte da verdade" para a modelagem de dados.
-   `firestore.rules` & `storage.rules`: Regras de segurança para o banco de dados e armazenamento de arquivos do Firebase.
-   `next.config.js`: Arquivo de configuração do Next.js, incluindo `remotePatterns` para imagens e **cabeçalhos de segurança**.
-   `middleware.ts`: Intercepta requisições para lidar com:
    -   Redirecionamentos de internacionalização (i18n) baseados no domínio.
    -   Proteção de rotas, verificando a existência de cookies de sessão de usuário e admin.
    -   Validação de tokens JWT para o painel de admin.
    -   Geração de `nonce` para a **Política de Segurança de Conteúdo (CSP)**.

---

## 4. Tech Stack

-   **Framework:** Next.js 14 (App Router)
-   **Linguagem:** TypeScript
-   **Estilização:** Tailwind CSS
-   **Componentes UI:** ShadCN/UI
-   **Animações:** Framer Motion
-   **3D:** React Three Fiber, Drei
-   **Banco de Dados:** Google Firestore
-   **Armazenamento de Arquivos:** Google Cloud Storage for Firebase
-   **Autenticação:** Firebase Authentication
-   **Pagamentos:** Mercado Pago, PayPal, Stripe
-   **Funcionalidades de IA:** Genkit (para busca de vídeos)
-   **Deployment:** Netlify

---

## 5. Backend e Modelo de Dados

O backend é "serverless", com a lógica de negócio dividida entre **Server Actions** do Next.js e as regras de segurança do Firebase.

-   **`docs/backend.json`**: Este arquivo é a planta baixa do nosso backend. Ele define as `entidades` (como `LovePage`, `User`) usando JSON Schema e mapeia como essas entidades são armazenadas no Firestore. Ele **NÃO** executa deploy, mas serve como um guia para a geração de código e regras.
-   **Entidades Principais:**
    -   `LovePage`: Armazena todos os dados de uma página de amor criada.
    -   `User`: Armazena informações do perfil do usuário.
    -   `payment_intents`: Coleção temporária para salvar o rascunho de uma página durante o processo de pagamento.

---

## 6. Segurança

A segurança é um pilar do projeto, com várias camadas de proteção:

-   **Sessões de Admin com JWT:** O acesso ao painel de admin é protegido por um token JWT assinado, que é validado a cada requisição pelo `middleware`.
-   **Comparação Segura:** A autenticação do admin utiliza `crypto.timingSafeEqual` para prevenir ataques de "timing attack".
-   **Rate Limiting:** O login do admin possui um limitador de tentativas para mitigar ataques de força bruta.
-   **Regras de Acesso Granulares:** `firestore.rules` e `storage.rules` definem permissões estritas, garantindo que um usuário só possa ler e escrever seus próprios dados, e impedindo a escalada de privilégios.
-   **Content Security Policy (CSP):** Implementado no `middleware` usando `nonces` para mitigar ataques de XSS.
-   **Cabeçalhos de Segurança:** O `next.config.js` adiciona headers como HSTS, X-Frame-Options, e Referrer-Policy para fortalecer a segurança do navegador.
