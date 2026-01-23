"use client";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h1 className="text-4xl font-bold">Página de Teste</h1>
      <p className="text-lg text-muted-foreground mt-4">
        Este é um teste de isolamento para diagnosticar a causa do erro 404.
      </p>
      <p className="text-muted-foreground mt-2">
        Se esta página aparecer, o problema está no componente complexo da página inicial.
      </p>
      <Button className="mt-8">Botão de Teste</Button>
    </div>
  );
}
