import { createSession } from '@/app/auth-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User } from 'lucide-react';

async function devLogin() {
    'use server';
    // Use a hardcoded, non-sensitive developer UID
    const devUid = 'DEV_USER_001';
    // Redirect to the page the user was trying to access, or default to /criar
    await createSession(devUid, '/criar');
}

export default function DevLoginPage() {
  return (
    <div className="container flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Acesso Rápido de Desenvolvedor</CardTitle>
          <CardDescription>
            Use este botão para simular um login e acessar as páginas protegidas rapidamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={devLogin}>
            <Button type="submit" className="w-full" size="lg">
              <User className="mr-2 h-4 w-4" />
              Logar como Desenvolvedor
            </Button>
          </form>
           <p className="mt-4 text-xs text-center text-muted-foreground">
            Isto é uma ferramenta de desenvolvimento e não deve ser usado em produção.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
