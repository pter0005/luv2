'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ComposedChart, Area, Bar, BarChart, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, AreaChart,
} from 'recharts';
import {
  Users, FileText, DollarSign, Globe, ShoppingCart,
  Percent, AlertTriangle, Copy, Check,
  ExternalLink, Edit, Calendar, Trash2, RefreshCw,
  Zap, ArrowUpRight, ArrowDownRight, ShoppingBag,
  TrendingUp, Receipt, Sparkles, Target, Flame, Crown,
  BarChart3, Activity, Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActiveUsersWidget } from '@/components/admin/ActiveUsersWidget';
import { SaleNotification } from '@/components/admin/SaleNotification';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type DayData = {
  date: string; label: string;
  visitors: number; sales: number; revenue: number;
};
export type SourceRow = {
  source: string; visits: number; sales: number; revenue: number; convRate: string;
};
export type RecentSale = {
  pageId: string; title: string; plan: string; price: number; createdAt: string; utmSource: string;
};
export type SaleRecord = {
  id: string; plan: string; price: number; currency: 'BRL' | 'USD';
  createdAt: string; ownerEmail: string; isGift?: boolean;
};
export type ErrorLog = {
  id: string; message: string; url: string; createdAt: string; resolved: boolean;
};
export type DashboardProps = {
  totalUsers: number;
  avancadoCount: number;
  basicoCount: number;
  totalSalesBRL: number;
  totalSalesUSD: number;
  salesHistory: SaleRecord[];
  todayVisitors: number;
  todaySales: number;
  todayRevenue: number;
  yesterdayVisitors: number;
  yesterdaySales: number;
  yesterdayRevenue: number;
  totalVisitors: number;
  totalSalesCount: number;
  totalSoldCount: number;
  totalRevenue: number;
  overallConv: string;
  avgTicketBRL: number;
  chartData: DayData[];
  sourceRows: SourceRow[];
  recentSales: RecentSale[];
  recentErrors: ErrorLog[];
  unresolvedErrorCount: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const SOURCE_META: Record<string, { emoji: string; label: string; color: string }> = {
  tiktok:    { emoji: '🎵', label: 'TikTok',    color: '#f472b6' },
  instagram: { emoji: '📸', label: 'Instagram', color: '#a78bfa' },
  facebook:  { emoji: '📘', label: 'Facebook',  color: '#60a5fa' },
  google:    { emoji: '🔍', label: 'Google',    color: '#fbbf24' },
  whatsapp:  { emoji: '💬', label: 'WhatsApp',  color: '#34d399' },
  direct:    { emoji: '🔗', label: 'Direto',    color: '#94a3b8' },
  organic:   { emoji: '🌱', label: 'Orgânico',  color: '#6ee7b7' },
};
const getMeta = (s: string) =>
  SOURCE_META[s?.toLowerCase()] ?? { emoji: '🌐', label: s || 'Desconhecido', color: '#94a3b8' };

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const usd = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  }).format(d);

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border px-4 py-3 text-xs shadow-2xl"
      style={{ background: '#18181b', borderColor: 'rgba(255,255,255,0.1)' }}>
      <p className="font-bold text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 mb-1" style={{ color: p.color }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}:{' '}
          <span className="font-black ml-1">
            {p.dataKey === 'revenue' ? brl(p.value) : p.value.toLocaleString('pt-BR')}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TREND BADGE (compare vs ontem)
// ─────────────────────────────────────────────────────────────────────────────
function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) {
    return <span className="text-[10px] font-bold text-zinc-600">—</span>;
  }
  if (previous === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-400">
        <ArrowUpRight className="w-2.5 h-2.5" />NOVO
      </span>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const color = up ? '#34d399' : '#f87171';
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-black" style={{ color }}>
      <Arrow className="w-2.5 h-2.5" />
      {up ? '+' : ''}{pct.toFixed(0)}%
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent, today, trend, sparkline }: {
  label: string; value: string | number; sub?: string;
  icon: any; accent: string; today?: string;
  trend?: { current: number; previous: number };
  sparkline?: { date: string; value: number }[];
}) {
  return (
    <div className="relative rounded-2xl p-4 sm:p-5 overflow-hidden group transition-all hover:border-white/15"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: `1px solid ${accent}28`,
      }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
        style={{ background: accent }} />
      <div className="relative flex items-start justify-between mb-3">
        <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accent}18` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <p className="relative text-2xl sm:text-3xl font-black text-white leading-none mb-1">{value}</p>
      <div className="relative flex items-center justify-between gap-2 mt-2 min-h-[14px]">
        <div className="flex items-center gap-1.5">
          {today !== undefined && (
            <span className="text-[11px] font-semibold" style={{ color: accent }}>
              +{today} hoje
            </span>
          )}
          {trend && <TrendBadge current={trend.current} previous={trend.previous} />}
        </div>
        {sparkline && sparkline.length > 0 && (
          <div className="w-14 h-6 opacity-60 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline}>
                <Line type="monotone" dataKey="value" stroke={accent} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {sub && today === undefined && !trend && <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-1 relative">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO REVENUE CARD — destaque do dia
// ─────────────────────────────────────────────────────────────────────────────
function HeroRevenueCard({
  todayRevenue, yesterdayRevenue, todaySales, yesterdaySales, chartData,
}: {
  todayRevenue: number; yesterdayRevenue: number;
  todaySales: number; yesterdaySales: number;
  chartData: DayData[];
}) {
  const diff = todayRevenue - yesterdayRevenue;
  const pct = yesterdayRevenue > 0 ? (diff / yesterdayRevenue) * 100 : 0;
  const up = diff >= 0;
  const last7 = chartData.slice(-7);

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(139,92,246,0.2)',
        boxShadow: '0 12px 40px -12px rgba(139,92,246,0.25)',
      }}>
      {/* ambient glow sutil */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-[0.08] pointer-events-none"
        style={{ background: '#a855f7' }} />

      <div className="relative p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Receita de hoje</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">vs ontem</p>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{
                background: up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                border: `1px solid ${up ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
              }}>
              {up ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
              <span className={`text-[10px] font-black ${up ? 'text-emerald-300' : 'text-red-300'}`}>
                {yesterdayRevenue > 0 ? `${up ? '+' : ''}${pct.toFixed(0)}%` : 'NOVO'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-4 mb-2">
          <p className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">
            {brl(todayRevenue)}
          </p>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-zinc-400 mb-4">
          <span className="flex items-center gap-1">
            <ShoppingCart className="w-3 h-3 text-purple-300" />
            <strong className="text-white">{todaySales}</strong> vendas hoje
          </span>
          <span className="text-zinc-700">·</span>
          <span>
            Ontem: <strong className="text-zinc-300">{brl(yesterdayRevenue)}</strong> ({yesterdaySales} vendas)
          </span>
        </div>

        {/* sparkline 7 dias */}
        <div className="h-14 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last7}>
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={{ stroke: 'rgba(236,72,153,0.3)', strokeWidth: 1 }}
                contentStyle={{
                  background: 'rgba(24,24,27,0.95)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  borderRadius: '12px',
                  padding: '6px 10px',
                }}
                labelStyle={{ color: '#c084fc', fontSize: 10, fontWeight: 'bold' }}
                itemStyle={{ color: '#ec4899', fontSize: 11, fontWeight: 'bold' }}
                formatter={(v: any) => [brl(Number(v) || 0), 'Receita']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={{ fill: '#ec4899', strokeWidth: 0, r: 2.5 }}
                activeDot={{ r: 5, fill: '#fff', stroke: '#ec4899', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[9px] text-zinc-600 mt-1 text-center">últimos 7 dias</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WRAPPER — clean, profissional
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, sub, children, action, icon: Icon, accent = '#a855f7' }: {
  title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode;
  icon?: any; accent?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
      <div className="px-5 sm:px-6 py-4 border-b flex items-center justify-between gap-3"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <Icon className="w-4 h-4 shrink-0" style={{ color: accent }} />
          )}
          <div className="min-w-0">
            <h2 className="text-[13px] sm:text-sm font-bold text-white tracking-tight truncate">{title}</h2>
            {sub && <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 truncate">{sub}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ABANDONED PIX (summary widget — full UI lives at /admin/recuperar-pix)
// ─────────────────────────────────────────────────────────────────────────────
type AbandonedPix = {
  id: string; email: string; whatsapp: string; plan: string;
  amount: number; title: string; createdAt: string | null; updatedAt: string | null;
  contacted: boolean; contactedAt: string | null;
};

function isPixStillValid(item: AbandonedPix): boolean {
  const ref = item.updatedAt || item.createdAt;
  if (!ref) return false;
  const ageMin = (Date.now() - new Date(ref).getTime()) / 60000;
  return ageMin < 30;
}

function buildRecoveryMessage(item: AbandonedPix): string {
  if (isPixStillValid(item)) {
    return `Oii! Vi que você gerou o PIX pra sua página no MyCupid mas ainda não finalizou 🥹\nTá tudo bem aí? Seu PIX ainda tá funcionando viu, é só abrir de novo e pagar rapidinho! Qualquer coisa me chama por aqui 💜\n\nhttps://mycupid.com.br/criar/fazer-eu-mesmo?plan=avancado`;
  }
  return `Oii! Vi que você começou a criar sua página no MyCupid mas não finalizou. Tá tudo bem? 🥹\nPra não deixar você na mão, separei um cupom especial pra você: *DESCONTO5* (R$5 de desconto). É só clicar no link aqui que já vai direto 💜🥰\n\nhttps://mycupid.com.br/criar/fazer-eu-mesmo?plan=avancado`;
}

function AbandonedPixSection() {
  const [items, setItems] = useState<AbandonedPix[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/abandoned-pix', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.abandoned || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markContacted = async (id: string) => {
    setItems(prev => prev.map(p =>
      p.id === id ? { ...p, contacted: true, contactedAt: new Date().toISOString() } : p
    ));
    try {
      await fetch('/api/admin/abandoned-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, contacted: true }),
      });
    } catch {}
  };

  const handleCopy = (item: AbandonedPix) => {
    navigator.clipboard.writeText(buildRecoveryMessage(item));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    if (!item.contacted) markContacted(item.id);
  };

  const whatsappLink = (item: AbandonedPix) => {
    const phone = item.whatsapp.replace(/\D/g, '');
    if (phone.length < 10) return null;
    const full = phone.startsWith('55') ? phone : `55${phone}`;
    return `https://wa.me/${full}?text=${encodeURIComponent(buildRecoveryMessage(item))}`;
  };

  const pending = items.filter(i => !i.contacted);
  const hasItems = items.length > 0;
  const hasPending = pending.length > 0;
  const preview = pending.slice(0, 3);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        border: hasPending ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(255,255,255,0.07)',
        background: hasPending ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.02)',
      }}>
      <div className="px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-3"
        style={{ borderColor: hasPending ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingBag className={`w-4 h-4 shrink-0 ${hasPending ? 'text-amber-400' : 'text-zinc-500'}`} />
          <h2 className={`text-xs sm:text-sm font-bold truncate ${hasPending ? 'text-amber-300' : 'text-zinc-400'}`}>
            {loading
              ? 'Carregando PIX...'
              : hasPending
                ? `${pending.length} PIX a contactar${items.length > pending.length ? ` · ${items.length - pending.length} contatados` : ''}`
                : hasItems ? `Tudo contatado (${items.length})` : 'Nenhum PIX abandonado'}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/recuperar-pix"
            className="text-[10px] sm:text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
            Ver todos <ArrowUpRight className="w-3 h-3" />
          </Link>
          <button onClick={() => { setLoading(true); load(); }}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:block">
            atualizar
          </button>
        </div>
      </div>
      {hasPending && (
      <div className="p-3 sm:p-4 space-y-2">
        {preview.map(item => {
          const waLink = whatsappLink(item);
          const ago = item.updatedAt ? getTimeAgo(item.updatedAt) : '—';
          return (
            <div key={item.id}
              className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex-grow min-w-0">
                <p className="text-zinc-200 font-medium truncate">{item.email}</p>
                <p className="text-[10px] text-zinc-600 truncate">
                  {item.whatsapp !== '—' ? item.whatsapp : 'sem whatsapp'} · R${item.amount.toFixed(2)} · {ago}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleCopy(item)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: copiedId === item.id ? '#34d399' : '#a1a1aa' }}>
                  {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span className="hidden sm:inline">{copiedId === item.id ? 'Copiado' : 'Copiar'}</span>
                </button>
                {waLink && (
                  <a href={waLink} target="_blank" rel="noreferrer"
                    onClick={() => !item.contacted && markContacted(item.id)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-white transition-colors"
                    style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}>
                    <span className="hidden sm:inline">Enviar </span>WhatsApp
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {pending.length > preview.length && (
          <Link href="/admin/recuperar-pix"
            className="block text-center py-2 rounded-xl text-[11px] font-bold text-amber-400 hover:bg-amber-500/5 transition-colors">
            + {pending.length - preview.length} outros — abrir página completa →
          </Link>
        )}
      </div>
      )}
    </div>
  );
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DISTRIBUTION DONUT
// ─────────────────────────────────────────────────────────────────────────────
function PlanDonut({ avancado, basico }: { avancado: number; basico: number }) {
  const total = avancado + basico;
  const data = [
    { name: 'Avançado', value: avancado, color: '#a855f7' },
    { name: 'Básico',   value: basico,   color: '#6366f1' },
  ];
  const advPct = total > 0 ? Math.round((avancado / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[120px] h-[120px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={42} outerRadius={58}
              paddingAngle={total > 0 ? 3 : 0}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-white leading-none">{total}</span>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1">vendas</span>
        </div>
      </div>
      <div className="flex-grow min-w-0 space-y-2.5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Crown className="w-3 h-3 text-purple-400" />
            <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider">Avançado</span>
            <span className="ml-auto text-[11px] font-black text-white font-mono">{avancado}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${advPct}%`,
                background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                boxShadow: '0 0 12px rgba(168,85,247,0.6)',
              }} />
          </div>
          <span className="text-[9px] text-zinc-600 font-mono">{advPct}% do mix</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="w-3 h-3 text-indigo-400" />
            <span className="text-[11px] font-black text-indigo-300 uppercase tracking-wider">Básico</span>
            <span className="ml-auto text-[11px] font-black text-white font-mono">{basico}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${100 - advPct}%`,
                background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              }} />
          </div>
          <span className="text-[9px] text-zinc-600 font-mono">{100 - advPct}% do mix</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSION FUNNEL — Visitantes → Vendas
// ─────────────────────────────────────────────────────────────────────────────
function ConversionFunnel({
  visitors, sales, revenue,
}: { visitors: number; sales: number; revenue: number }) {
  const convPct = visitors > 0 ? (sales / visitors) * 100 : 0;
  const avg = sales > 0 ? revenue / sales : 0;
  const stages = [
    { label: 'Visitantes', value: visitors, color: '#60a5fa', width: 100, icon: Globe },
    { label: 'Vendas',     value: sales,    color: '#a855f7', width: Math.min(60 + (convPct * 4), 85), icon: ShoppingCart },
    { label: 'Receita',    value: brl(revenue), raw: revenue, color: '#34d399', width: 50, icon: DollarSign, highlight: true },
  ];

  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="relative">
            <div className="relative rounded-xl p-3 transition-all hover:scale-[1.01]"
              style={{
                width: `${s.width}%`,
                background: `linear-gradient(90deg, ${s.color}22 0%, ${s.color}08 100%)`,
                border: `1px solid ${s.color}35`,
                boxShadow: s.highlight ? `0 8px 24px -8px ${s.color}44` : 'none',
              }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}20`, border: `1px solid ${s.color}44` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: s.color }}>
                      {s.label}
                    </p>
                    <p className="text-lg font-black text-white leading-none mt-0.5">
                      {typeof s.value === 'number' ? s.value.toLocaleString('pt-BR') : s.value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {i < stages.length - 1 && (
              <div className="flex items-center gap-1 pl-4 py-0.5">
                <div className="w-px h-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
                {i === 0 && (
                  <span className="text-[9px] font-black text-zinc-500 ml-1">
                    → {convPct.toFixed(2)}% convertem
                  </span>
                )}
                {i === 1 && sales > 0 && (
                  <span className="text-[9px] font-black text-zinc-500 ml-1">
                    → ticket médio {brl(avg)}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOAL PROGRESS RING — meta do dia
// ─────────────────────────────────────────────────────────────────────────────
function GoalProgressRing({
  current, goal, label, color,
}: { current: number; goal: number; label: string; color: string }) {
  const pct = Math.min((current / goal) * 100, 100);
  const data = [{ name: 'goal', value: pct, fill: color }];

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[92px] h-[92px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="75%" outerRadius="100%"
            data={data} startAngle={90} endAngle={-270}>
            <RadialBar
              background={{ fill: 'rgba(255,255,255,0.05)' } as any}
              dataKey="value"
              cornerRadius={20}
              fill={color}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-black text-white leading-none">{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-[9px] uppercase tracking-wider font-black text-zinc-500">{label}</p>
        <p className="text-lg font-black text-white mt-0.5 leading-none">
          {brl(current)}
        </p>
        <p className="text-[10px] text-zinc-500 mt-1">
          meta <span className="font-bold text-zinc-300">{brl(goal)}</span>
        </p>
        {pct >= 100 && (
          <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md text-[9px] font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
            <Trophy className="w-2.5 h-2.5" />
            BATIDA
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKDAY HEATMAP — vendas por dia da semana (últimos 30d)
// ─────────────────────────────────────────────────────────────────────────────
function WeekdayHeatmap({ chartData }: { chartData: DayData[] }) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  chartData.forEach(d => {
    const date = new Date(`${d.date}T12:00:00`);
    buckets[date.getDay()] += d.sales;
  });
  const max = Math.max(...buckets, 1);
  const bestIdx = buckets.indexOf(Math.max(...buckets));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {buckets.map((count, i) => {
          const intensity = count / max;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="relative w-full aspect-square rounded-lg flex items-center justify-center font-bold"
                style={{
                  background: count === 0
                    ? 'rgba(255,255,255,0.02)'
                    : `rgba(139,92,246,${0.1 + intensity * 0.35})`,
                  border: `1px solid rgba(139,92,246,${0.15 + intensity * 0.25})`,
                }}>
                <span className={`text-xs ${count === 0 ? 'text-zinc-700' : 'text-white'}`}>
                  {count}
                </span>
              </div>
              <span className="text-[9px] font-semibold text-zinc-500 uppercase">{days[i]}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-zinc-500 text-center mt-2">
        Melhor dia: <span className="font-bold text-purple-300">{days[bestIdx]}</span> ·{' '}
        <span className="font-mono">{buckets[bestIdx]} vendas</span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard({
  totalUsers, avancadoCount, basicoCount,
  totalSalesBRL, totalSalesUSD, salesHistory,
  recentErrors, unresolvedErrorCount,
  todayVisitors, todaySales, todayRevenue,
  yesterdayVisitors, yesterdaySales, yesterdayRevenue,
  totalVisitors, totalSalesCount, totalSoldCount, totalRevenue, overallConv,
  avgTicketBRL,
  chartData, sourceRows, recentSales,
}: DashboardProps) {
  // Build sparkline snapshots (last 7 days) para cada KPI
  const last7 = chartData.slice(-7);
  const visitorsSpark = last7.map(d => ({ date: d.date, value: d.visitors }));
  const salesSpark = last7.map(d => ({ date: d.date, value: d.sales }));
  const revenueSpark = last7.map(d => ({ date: d.date, value: d.revenue }));
  const [confirmStep, setConfirmStep] = useState(0);
  const [confirmInput, setConfirmInput] = useState('');
  const CONFIRM_WORD = 'APAGAR TUDO';

  const handleReset = async () => {
    if (confirmStep === 0) { setConfirmStep(1); return; }
    if (confirmInput !== CONFIRM_WORD) return;
    setConfirmStep(2);
    try {
      const r = await fetch('/api/admin/analytics/reset', { method: 'POST' });
      if (r.ok) { setConfirmStep(3); setTimeout(() => window.location.reload(), 1500); }
      else setConfirmStep(1);
    } catch { setConfirmStep(1); }
  };

  const convNum = parseFloat(overallConv);
  const convAccent = convNum >= 2 ? '#34d399' : convNum >= 0.5 ? '#fbbf24' : '#f87171';

  return (
    <div className="space-y-6">
      <SaleNotification />

      {/* ── ERROR MONITORING ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          border: unresolvedErrorCount > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(34,197,94,0.15)',
          background: unresolvedErrorCount > 0 ? 'rgba(239,68,68,0.04)' : 'rgba(34,197,94,0.03)',
        }}>
        <div className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: unresolvedErrorCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.1)' }}>
          <div className="flex items-center gap-2">
            {unresolvedErrorCount > 0
              ? <AlertTriangle className="w-4 h-4 text-red-400" />
              : <Check className="w-4 h-4 text-emerald-400" />}
            <h2 className={`text-sm font-bold ${unresolvedErrorCount > 0 ? 'text-red-300' : 'text-emerald-400'}`}>
              {unresolvedErrorCount > 0
                ? `${unresolvedErrorCount} erro${unresolvedErrorCount > 1 ? 's' : ''} no site`
                : 'Nenhum erro no site'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {unresolvedErrorCount > 0 && (
              <button
                className="text-[10px] text-zinc-500 hover:text-emerald-400 px-2 py-1 rounded border border-white/5 hover:border-emerald-500/30 transition-colors"
                onClick={async () => {
                  if (!confirm(`Marcar ${unresolvedErrorCount} erro(s) como resolvido(s)?`)) return;
                  await fetch('/api/error-log/resolve-all', { method: 'POST' });
                  window.location.reload();
                }}
              >
                resolver todos
              </button>
            )}
            <span className="text-[10px] text-zinc-500 font-mono">monitoramento ativo</span>
          </div>
        </div>
        {unresolvedErrorCount > 0 && (
          <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
            {recentErrors.filter(e => !e.resolved).slice(0, 8).map(err => (
              <div key={err.id}
                className="flex items-start gap-3 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex-grow min-w-0">
                  <p className="text-red-300 font-medium truncate">{err.message}</p>
                  <p className="text-zinc-600 truncate">{err.url} · {err.createdAt}</p>
                </div>
                <button
                  className="text-[10px] text-zinc-600 hover:text-emerald-400 shrink-0 px-2 py-1 rounded border border-transparent hover:border-emerald-500/30 transition-colors"
                  onClick={async () => {
                    await fetch(`/api/error-log/${err.id}/resolve`, { method: 'POST' });
                    window.location.reload();
                  }}
                >
                  resolver
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PIX ABANDONADOS ─────────────────────────────────────────────── */}
      <AbandonedPixSection />

      {/* ── HERO REVENUE + TOP KPIs ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <HeroRevenueCard
            todayRevenue={todayRevenue}
            yesterdayRevenue={yesterdayRevenue}
            todaySales={todaySales}
            yesterdaySales={yesterdaySales}
            chartData={chartData}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <KpiCard label="Ticket Médio" value={brl(avgTicketBRL)}
            sub="média geral BRL" icon={Receipt} accent="#f472b6" />
          <KpiCard label="Visitantes" value={totalVisitors.toLocaleString('pt-BR')}
            today={todayVisitors.toLocaleString('pt-BR')}
            trend={{ current: todayVisitors, previous: yesterdayVisitors }}
            sparkline={visitorsSpark}
            icon={Globe} accent="#818cf8" />
        </div>
      </div>

      {/* ── FUNNEL + GOAL + PLAN MIX ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Funil de Conversão" sub="Visitantes → vendas hoje" icon={Target} accent="#60a5fa">
          <ConversionFunnel
            visitors={todayVisitors}
            sales={todaySales}
            revenue={todayRevenue}
          />
        </Section>
        <Section title="Meta do Dia" sub="R$500 diários" icon={Trophy} accent="#fbbf24">
          <div className="space-y-4">
            <GoalProgressRing
              current={todayRevenue}
              goal={500}
              label="Hoje"
              color="#fbbf24"
            />
            <div className="pt-3 border-t border-white/5">
              <GoalProgressRing
                current={last7.reduce((s, d) => s + d.revenue, 0)}
                goal={3500}
                label="Semana"
                color="#a855f7"
              />
            </div>
          </div>
        </Section>
        <Section title="Mix de Planos" sub="Avançado vs Básico" icon={Crown} accent="#a855f7">
          <PlanDonut avancado={avancadoCount} basico={basicoCount} />
        </Section>
      </div>

      {/* ── KPI GRID ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="col-span-1">
          <ActiveUsersWidget variant="online" />
        </div>
        <div className="col-span-1">
          <ActiveUsersWidget variant="creating" />
        </div>
        <KpiCard label="Total de Usuários" value={totalUsers} icon={Users} accent="#60a5fa"
          sub="cadastrados na plataforma" />
        <KpiCard label="Páginas Criadas" value={totalSalesCount.toLocaleString('pt-BR')}
          sub={`${avancadoCount} Avançado · ${basicoCount} Básico`}
          icon={FileText} accent="#c084fc" />
        <KpiCard label="Receita BRL Total" value={brl(totalSalesBRL)} icon={DollarSign} accent="#34d399"
          sub="acumulado brasileiro" />
        <KpiCard label="Receita USD" value={usd(totalSalesUSD)} icon={DollarSign} accent="#22d3ee"
          sub="vendas internacionais" />
        <KpiCard label="Páginas Vendidas" value={totalSoldCount.toLocaleString('pt-BR')}
          today={todaySales.toLocaleString('pt-BR')}
          trend={{ current: todaySales, previous: yesterdaySales }}
          sparkline={salesSpark}
          icon={ShoppingCart} accent="#a855f7" />
        <KpiCard label="Conversão (UTM)" value={`${overallConv}%`}
          sub={convNum >= 2 ? '🔥 Excelente' : convNum >= 0.5 ? '👍 Boa' : '⚠️ Melhorar'}
          icon={Percent} accent={convAccent} />
      </div>

      {/* ── MAIN CHART + HEATMAP ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <Section title="Visitantes & Vendas" sub="Últimos 30 dias" icon={BarChart3} accent="#818cf8">
            <div className="flex items-center gap-5 mb-4 text-[10px]">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <span className="w-3 h-2 rounded inline-block"
                  style={{ background: 'linear-gradient(180deg, #818cf8, rgba(129,140,248,0.3))' }} />
                <span className="font-bold">Visitantes únicos</span>
              </span>
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="w-3 h-2 inline-block rounded"
                  style={{ background: 'linear-gradient(180deg, #c084fc, #a855f7)' }} />
                <span className="font-bold">Vendas</span>
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={1} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area dataKey="visitors" name="Visitantes" fill="url(#gV)" stroke="#818cf8"
                  strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }} />
                <Bar dataKey="sales" name="Vendas" fill="url(#gS)"
                  radius={[4, 4, 0, 0]} maxBarSize={18} />
              </ComposedChart>
            </ResponsiveContainer>
          </Section>
        </div>
        <Section title="Melhor Dia da Semana" sub="Vendas por dia (30d)" icon={Flame} accent="#ec4899">
          <WeekdayHeatmap chartData={chartData} />
        </Section>
      </div>

      {/* ── REVENUE AREA CHART ─────────────────────────────────────────── */}
      <Section title="Receita Diária (BRL)" sub="Faturamento nos últimos 30 dias" icon={TrendingUp} accent="#34d399">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false}
              tickFormatter={v => `R$${v}`} />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Receita"
              stroke="#34d399"
              strokeWidth={3}
              fill="url(#gR)"
              dot={false}
              activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* ── RECENT SALES + SOURCES ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <Section title="Últimas Vendas" sub={`${recentSales.length} páginas mais recentes`} icon={ShoppingCart} accent="#a855f7">
          {recentSales.length === 0 ? (
            <p className="text-sm text-zinc-600 py-4 text-center">Nenhuma venda ainda.</p>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale) => {
                const meta = getMeta(sale.utmSource);
                const isAdv = sale.plan === 'avancado';
                return (
                  <div key={sale.pageId}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                      style={{ background: isAdv ? 'rgba(168,85,247,0.15)' : 'rgba(99,102,241,0.1)' }}>
                      {isAdv ? '⭐' : '📄'}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold text-white truncate">{sale.title || 'Sem título'}</p>
                      <p className="text-[10px] text-zinc-500">{sale.createdAt} · {meta.emoji} {meta.label}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-emerald-400">{brl(sale.price)}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                        style={{
                          background: isAdv ? 'rgba(168,85,247,0.15)' : 'rgba(99,102,241,0.1)',
                          color: isAdv ? '#c084fc' : '#818cf8',
                        }}>
                        {isAdv ? 'Avançado' : 'Básico'}
                      </span>
                    </div>
                    <a href={`/p/${sale.pageId}`} target="_blank" rel="noreferrer"
                      className="text-zinc-600 hover:text-zinc-300 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Performance por Fonte" sub="UTM — últimos 30 dias" icon={Activity} accent="#f472b6">
          {sourceRows.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-zinc-600 mb-2">Nenhuma visita UTM registrada.</p>
              <p className="text-xs text-zinc-700">
                Use links com <code className="text-zinc-500">?utm_source=tiktok</code>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sourceRows.map((row) => {
                const meta = getMeta(row.source);
                const conv = parseFloat(row.convRate);
                const barW = Math.min((row.visits / (sourceRows[0]?.visits || 1)) * 100, 100);
                return (
                  <div key={row.source}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-zinc-400 font-mono">{row.visits.toLocaleString('pt-BR')} vis.</span>
                        <span className="text-emerald-400 font-bold font-mono">{brl(row.revenue)}</span>
                        <span className="font-bold font-mono text-[11px]"
                          style={{ color: conv >= 2 ? '#34d399' : conv >= 0.5 ? '#fbbf24' : '#f87171' }}>
                          {row.convRate}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${barW}%`, background: meta.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* ── UTM LINKS ────────────────────────────────────────────────────────── */}
      <Section title="Links UTM Prontos" sub="Clique para copiar — use nas suas bios e anúncios" icon={Copy} accent="#22d3ee">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2">
          {Object.entries(SOURCE_META).map(([key, meta]) => (
            <div key={key}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl cursor-pointer group transition-all hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => navigator.clipboard?.writeText(`https://mycupid.com.br?utm_source=${key}`)}>
              <span className="text-xl">{meta.emoji}</span>
              <span className="text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
              <code className="text-[9px] text-zinc-600 group-hover:text-zinc-400 transition-colors">copiar</code>
            </div>
          ))}
        </div>
      </Section>

      {/* ── SALES HISTORY TABLE ──────────────────────────────────────────────── */}
      <Section
        title="Histórico de Vendas"
        sub="Últimas 100 páginas criadas"
        icon={FileText}
        accent="#60a5fa"
        action={
          <span className="text-[11px] bg-white/5 text-zinc-400 px-3 py-1 rounded-full border border-white/8">
            {salesHistory.length} registros
          </span>
        }
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-sm">
            <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Plano</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {salesHistory.map((sale, i) => {
                const planColor = sale.plan === 'avancado'
                  ? { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.25)' }
                  : sale.plan === 'basico'
                    ? { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', border: 'rgba(99,102,241,0.25)' }
                    : { bg: 'rgba(255,255,255,0.06)', text: '#71717a', border: 'rgba(255,255,255,0.08)' };
                return (
                  <tr key={sale.id}
                    className="border-t transition-colors hover:bg-white/3"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-zinc-200">{sale.ownerEmail}</p>
                      <p className="text-[10px] text-zinc-600 font-mono">#{sale.id.slice(0, 10)}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize"
                        style={{ background: planColor.bg, color: planColor.text, border: `1px solid ${planColor.border}` }}>
                        {sale.plan}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {sale.isGift
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}>🎁 CRÉDITO</span>
                        : sale.price > 0
                          ? <span className="text-xs font-black text-emerald-400 font-mono">
                              {sale.currency === 'BRL' ? brl(sale.price) : usd(sale.price)}
                            </span>
                          : <span className="text-xs text-zinc-600">—</span>
                      }
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(new Date(sale.createdAt))}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/edit/${sale.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white transition-colors"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <Edit className="w-3 h-3" />Edit
                        </Link>
                        <Link href={`/p/${sale.id}`} target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white transition-colors"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <ExternalLink className="w-3 h-3" />View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {salesHistory.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-600">Nenhuma venda ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── DANGER ZONE ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-bold text-red-300">Zona de Perigo — Reset Total</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          Apaga os dados de analytics: visitas, UTM e visitantes únicos.
          <strong className="text-zinc-300"> Páginas de clientes e rascunhos não são afetados.</strong> Essa ação{' '}
          <strong className="text-red-400">não pode ser desfeita</strong>.
        </p>

        {confirmStep === 0 && (
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
            <Trash2 className="w-4 h-4" />Zerar tudo
          </button>
        )}
        {confirmStep === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-red-400 font-bold">
              Digite <code className="bg-red-500/10 px-1.5 py-0.5 rounded font-mono">{CONFIRM_WORD}</code> para confirmar:
            </p>
            <div className="flex items-center gap-2">
              <input type="text" value={confirmInput} onChange={e => setConfirmInput(e.target.value)}
                placeholder={CONFIRM_WORD} autoFocus
                className="px-3 py-2 rounded-xl text-sm font-mono text-white bg-red-950/30 border border-red-500/30 focus:outline-none focus:border-red-500/60 w-48" />
              <button onClick={handleReset} disabled={confirmInput !== CONFIRM_WORD}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
                style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5' }}>
                <Zap className="w-4 h-4" />Confirmar
              </button>
              <button onClick={() => { setConfirmStep(0); setConfirmInput(''); }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-2">
                Cancelar
              </button>
            </div>
          </div>
        )}
        {confirmStep === 2 && (
          <div className="flex items-center gap-2 text-sm text-red-300">
            <RefreshCw className="w-4 h-4 animate-spin" />Apagando tudo...
          </div>
        )}
        {confirmStep === 3 && (
          <div className="flex items-center gap-2 text-sm text-green-400 font-bold">
            ✓ Tudo apagado! Recarregando...
          </div>
        )}
      </div>

    </div>
  );
}
