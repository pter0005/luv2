import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DevLoginPage() {
  return (
    <div className="container flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-lg border-amber-500/50">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <AlertTriangle className="w-12 h-12 text-amber-400" />
            </div>
          <CardTitle className="text-2xl text-amber-300">Página de Dev Login Desativada</CardTitle>
          <CardDescription className="text-muted-foreground">
            O sistema de "login rápido" foi desativado para garantir a integração correta com o Firebase. Usar um login falso quebra funcionalidades que dependem de um usuário real (como uploads de imagem).
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className='text-sm text-center mb-4'>
                Por favor, use a página de login real. Adicionei um assistente nela para te ajudar a configurar o domínio de desenvolvimento no Firebase.
            </p>
          <Button asChild className="w-full" size="lg">
            <Link href="/login">
              Ir para a Página de Login Real
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
