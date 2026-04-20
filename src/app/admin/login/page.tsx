'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createAdminSession } from '../admin-auth-actions';
import { ShieldCheck } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {pending ? 'Entrando...' : 'Entrar'}
    </button>
  );
}

function LoginForm() {
  const [state, action] = useFormState(createAdminSession, { error: '' });
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '';
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-primary/20 p-3 rounded-full">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Admin</h1>
          {next === '/chat' && (
            <p className="text-[11px] text-muted-foreground text-center">
              login pra testar o <span className="font-semibold text-primary">/chat</span>
            </p>
          )}
        </div>
        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <input
            name="username"
            type="text"
            placeholder="Usuário"
            className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Senha"
            className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          {state.error && <p className="text-red-400 text-sm">{state.error}</p>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
