'use client';
import { useFormState, useFormStatus } from 'react-dom';
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

export default function AdminLoginPage() {
  const [state, action] = useFormState(createAdminSession, { error: '' });
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-primary/20 p-3 rounded-full">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Admin</h1>
        </div>
        <form action={action} className="space-y-4">
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
