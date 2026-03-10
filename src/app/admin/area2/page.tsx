'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Globe, TrendingUp, DollarSign, Activity, BarChart2, Zap, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── FAKE DATA (apenas para demonstração) ───────────────────────
const FAKE_BRL = 8432.32;
const FAKE_USD = 150.00;
const FAKE_TOTAL_USERS = 3000;

const FAKE_RECENT = [
  { id: 'a1b2c3', email: 'ana.lima@gmail.com',    plan: 'avancado', price: 24.90, currency: 'BRL', segment: 'namorade' },
  { id: 'd4e5f6', email: 'carlos.m@hotmail.com',  plan: 'basico',   price: 14.90, currency: 'BRL', segment: 'mae'      },
  { id: 'g7h8i9', email: 'julia.p@gmail.com',     plan: 'avancado', price: 24.90, currency: 'BRL', segment: 'espouse'  },
  { id: 'j0k1l2', email: 'rafa.souza@gmail.com',  plan: 'avancado', price: 14.90, currency: 'USD', segment: 'namorade' },
  { id: 'm3n4o5', email: 'tiago.r@gmail.com',     plan: 'basico',   price: 14.90, currency: 'BRL', segment: 'amige'    },
  { id: 'p6q7r8', email: 'marina.k@outlook.com',  plan: 'avancado', price: 24.90, currency: 'BRL', segment: 'pai'      },
];

// Gráfico sparkline fake
const SPARKLINE = [12, 18, 14, 22, 19, 28, 31, 25, 34, 29, 38, 42, 36, 45, 41, 52, 48, 55, 49, 61];

function Sparkline({ data, color = '#a855f7' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 120, h = 36, pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / (max - min)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminArea2Page() {
  // Presença oscilando entre 30–89 lentamente
  const [presence, setPresence] = useState(54);
  const [presenceDelta, setPresenceDelta] = useState(1);

  useEffect(() => {
    const tick = () => {
      setPresence(p => {
        const next = p + presenceDelta * (Math.random() > 0.3 ? 1 : -1) * Math.ceil(Math.random() * 2);
        if (next >= 89) { setPresenceDelta(-1); return 88; }
        if (next <= 30) { setPresenceDelta(1);  return 31; }
        return next;
      });
    };
    const id = setInterval(tick, 4000 + Math.random() * 3000);
    return () => clearInterval(id);
  }, [presenceDelta]);

  const segmentColors: Record<string, string> = {
    namorade: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
    mae:      'bg-pink-500/15 text-pink-300 border-pink-500/20',
    espouse:  'bg-blue-500/15 text-blue-300 border-blue-500/20',
    amige:    'bg-teal-500/15 text-teal-300 border-teal-500/20',
    pai:      'bg-sky-500/15 text-sky-300 border-sky-500/20',
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">

      {/* Header */}
      <header className="bg-card border-b border-border mb-8 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin"><ArrowLeft className="w-4 h-4 mr-1" />Admin</Link>
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="bg-yellow-500/20 p-1.5 rounded-full">
                <BarChart2 className="w-4 h-4 text-yellow-400" />
              </div>
              <h1 className="text-base font-bold">Admin Area 2</h1>
              <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Demo
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-8">

        {/* Aviso fake */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 text-sm">
          <Zap className="w-4 h-4 shrink-0" />
          <span>Dados simulados para fins de teste — nenhuma informação real.</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Presença em tempo real */}
          <div className="col-span-2 lg:col-span-1 rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ao Vivo</span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-[10px] text-green-400 font-semibold">online</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-white tabular-nums">{presence}</span>
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">pessoas na plataforma agora</span>
          </div>

          {/* Vendas BRL */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vendas BR</span>
              <span className="text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">+14%</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-muted-foreground">R$</span>
                <span className="text-2xl font-black text-white tabular-nums ml-1">8.432,32</span>
              </div>
              <Sparkline data={SPARKLINE} color="#a855f7" />
            </div>
            <span className="text-xs text-muted-foreground">total acumulado</span>
          </div>

          {/* Vendas USD */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vendas Intl</span>
              <Globe className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-muted-foreground">US$</span>
                <span className="text-2xl font-black text-white tabular-nums ml-1">150,00</span>
              </div>
              <Sparkline data={[2,3,2,4,3,5,4,6,5,7,6,8,7,9,8,10,9,11,10,12]} color="#60a5fa" />
            </div>
            <span className="text-xs text-muted-foreground">total acumulado</span>
          </div>

          {/* Usuários totais */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usuários</span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-white tabular-nums">3.000</span>
              <Activity className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">cadastros totais</span>
          </div>
        </div>

        {/* Tabela de vendas recentes fake */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-bold text-sm">Vendas Recentes</h2>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-1">simuladas</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Plano</th>
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">Segmento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FAKE_RECENT.map(sale => (
                  <tr key={sale.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{sale.email}</span>
                        <span className="text-xs text-muted-foreground font-mono">#{sale.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sale.plan === 'avancado' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {sale.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-400 font-bold font-mono">
                        {sale.currency === 'BRL' ? `R$ ${sale.price.toFixed(2).replace('.', ',')}` : `US$ ${sale.price.toFixed(2)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${segmentColors[sale.segment] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {sale.segment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
