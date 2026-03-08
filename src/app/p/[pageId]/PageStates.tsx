'use client';

import { Loader2, AlertTriangle } from 'lucide-react';

export function LoadingState() {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-background text-foreground">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <p className="mt-4">Carregando sua surpresa...</p>
        </div>
    );
}

function UnauthenticatedErrorState() {
    return (
        <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground p-4">
            <div className="text-left p-6 rounded-lg bg-destructive/10 border border-destructive/50 max-w-2xl w-full font-mono shadow-2xl shadow-destructive/10">
                <div className="flex items-center gap-4 mb-4 font-sans">
                    <AlertTriangle className="h-8 w-8 text-destructive shrink-0" />
                    <div>
                        <h1 className="text-xl font-bold text-red-300">Erro de Autenticação no Servidor</h1>
                        <p className="text-sm text-red-300/70">O servidor não conseguiu se conectar ao Firebase.</p>
                    </div>
                </div>
                <div className="space-y-3 text-sm text-red-200/80 bg-black/30 p-4 rounded-md border border-white/10">
                    <p className="font-sans font-bold text-red-300/90">&gt; ANÁLISE DO PROBLEMA:</p>
                    <p>Este erro `UNAUTHENTICATED` quase sempre significa que as chaves de ambiente (Environment Variables) no seu provedor de hospedagem (Netlify, Vercel) estão incorretas ou ausentes.</p>
                    
                    <p className="font-sans font-bold text-red-300/90 pt-2">&gt; CMD_LOG: COMO RESOLVER</p>
                    <p>1. Vá ao painel do seu provedor de hospedagem.</p>
                    <p>2. Encontre a seção "Environment Variables" nas configurações do seu site.</p>
                    <p>3. Verifique se as seguintes variáveis existem e se seus valores estão corretos:</p>
                    <div className="pl-4 space-y-1">
                        <p className="font-bold">- FIREBASE_PROJECT_ID</p>
                        <p className="font-bold">- FIREBASE_CLIENT_EMAIL</p>
                        <p className="font-bold">- FIREBASE_PRIVATE_KEY</p>
                    </div>
                    <p className="font-sans font-bold text-yellow-400 pt-2">&gt; DICA IMPORTANTE:</p>
                    <p className="text-yellow-300/90">O valor da `FIREBASE_PRIVATE_KEY` deve ser copiado exatamente como está, incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`.</p>
                </div>
            </div>
        </div>
    );
}

const errorMessages: Record<string, string> = {
    'publicpage.error.generic': 'Esta página de amor não existe ou não pôde ser encontrada.',
    'publicpage.error.notfound': 'Esta página de amor não existe ou pode ter sido removida.',
    'publicpage.error.dbConfig': 'O sistema de banco de dados não está configurado corretamente. Por favor, contate o suporte.',
    'publicpage.error.fetch': 'Ocorreu um erro ao buscar os dados da página. Por favor, tente novamente mais tarde.',
    'publicpage.error.unknown': 'Ocorreu um erro desconhecido ao buscar os dados da página.',
    'publicpage.error.processing': 'Ocorreu um erro ao processar os dados da página.',
};

export function ErrorState({ messageKey, messageVars }: { messageKey: string, messageVars?: any }) {
    if (messageKey === 'publicpage.error.unauthenticated') {
        return <UnauthenticatedErrorState />;
    }

    const message = errorMessages[messageKey] || 'Ocorreu um erro desconhecido.';

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-background text-foreground">
            <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive max-w-lg">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl md:text-3xl font-bold">Erro</h1>
                <p className="text-destructive-foreground/80 mt-2">
                    {message}
                </p>
                 <p className="text-xs text-muted-foreground mt-4">
                    O link que você acessou pode estar quebrado ou a página foi removida.
                </p>
            </div>
        </div>
    )
}
