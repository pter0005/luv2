'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createAdminSession } from '../admin-auth-actions';
import { useFormState } from 'react-dom';
import { KeyRound } from 'lucide-react';

const initialState = {
  error: '',
};

export default function AdminLoginPage() {
  const [state, formAction] = useFormState(createAdminSession, initialState);

  return (
    <div className="container flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <KeyRound className="w-10 h-10 text-primary" />
          </div>
          <CardTitle>Área Administrativa</CardTitle>
          <CardDescription>Acesso restrito.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" name="username" required defaultValue="admin123" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required defaultValue="12345678a" />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
