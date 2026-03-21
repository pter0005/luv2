'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ComposedChart, Area, Bar, BarChart,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users, FileText, DollarSign, Globe, ShoppingCart,
  TrendingUp, Percent, AlertTriangle, CheckCircle,
  ExternalLink, Edit, Calendar, Trash2, RefreshCw,
  Zap, Gift, BarChart2, FileWarning, ImageOff, ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ActiveUsersWidget } from '@/components/admin/ActiveUsersWidget';

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
  createdAt: Date; ownerEmail: string; isGift?: boolean;
};
export type DashboardProps = {
  totalUsers: number;
  avancadoCount: number;
  basicoCount: number;
  totalSalesBRL: number;
  totalSalesUSD: number;
  pendingFileIssues: number;
  salesHistory: SaleRecord[];
  todayVisitors: number;
  todaySales: number;
  todayRevenue: number;
  totalVisitors: number;
  totalSalesCount: number;
  totalRevenue: number;
  overallConv: string;
  chartData: DayData[];
  sourceRows: SourceRow[];
  recentSales: RecentSale[];
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
// KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent, today }: {
  label: string; value: string | number; sub?: string;
  icon: any; accent: string; today?: string;
}) {
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: `1px solid ${accent}28`,
      }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ background: accent }} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accent}18` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <p className="text-3xl font-black text-white leading-none mb-1">{value}</p>
      {today !== undefined && (
        <div className="flex items-center gap-1 text-[11px] font-semibold mt-2" style={{ color: accent }}>
          <ArrowUpRight className="w-3 h-3" />
          {today} hoje
        </div>
      )}
      {sub && today === undefined && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, sub, children, action }: {
  title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
      <div className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard({
  totalUsers, avancadoCount, basicoCount,
  totalSalesBRL, totalSalesUSD, pendingFileIssues, salesHistory,
  todayVisitors, todaySales, todayRevenue,
  totalVisitors, totalSalesCount, totalRevenue, overallConv,
  chartData, sourceRows, recentSales,
}: DashboardProps) {
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

      {/* ── FILE ISSUES ALERT ──────────────────────────────────────────────── */}
      {pendingFileIssues > 0 ? (
        <div className="flex items-center justify-between p-4 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-red-400 text-sm">
                {pendingFileIssues} arquivo{pendingFileIssues > 1 ? 's' : ''} preso{pendingFileIssues > 1 ? 's' : ''} em temp/
              </p>
              <p className="text-xs text-red-400/60">Imagens de clientes que falharam ao ser movidas.</p>
            </div>
          </div>
          <Button asChild size="sm"
            className="bg-red-600 hover:bg-red-700 shrink-0 rounded-xl">
            <Link href="/admin/pages">Ver e Reprocessar →</Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-2xl"
          style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-400">Todos os arquivos de clientes estão íntegros.</p>
        </div>
      )}

      {/* ── KPI GRID ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Active users widget occupies 1 slot */}
        <div className="col-span-1">
          <ActiveUsersWidget />
        </div>
        <KpiCard label="Total de Usuários" value={totalUsers} icon={Users} accent="#60a5fa"
          sub="cadastrados na plataforma" />
        <KpiCard label="Páginas Criadas" value={totalSalesCount}
          sub={`${avancadoCount} Avançado · ${basicoCount} Básico`}
          icon={FileText} accent="#c084fc" />
        <KpiCard label="Receita BRL" value={brl(totalSalesBRL)} icon={DollarSign} accent="#34d399"
          sub="vendas brasileiras" />
        <KpiCard label="Receita USD" value={usd(totalSalesUSD)} icon={DollarSign} accent="#22d3ee"
          sub="vendas internacionais" />
        <KpiCard label="Visitantes Únicos" value={totalVisitors.toLocaleString('pt-BR')}
          today={todayVisitors.toLocaleString('pt-BR')}
          icon={Globe} accent="#818cf8" />
        <KpiCard label="Páginas Vendidas" value={totalSalesCount.toLocaleString('pt-BR')}
          today={todaySales.toLocaleString('pt-BR')}
          icon={ShoppingCart} accent="#a855f7" />
        <KpiCard label="Conversão (UTM)" value={`${overallConv}%`}
          sub={convNum >= 2 ? '🔥 Excelente' : convNum >= 0.5 ? '👍 Boa' : '⚠️ Melhorar'}
          icon={Percent} accent={convAccent} />
      </div>

      {/* ── CHARTS ROW ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Section title="Visitantes & Vendas" sub="Últimos 30 dias">
          <div className="flex items-center gap-6 mb-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-400 inline-block rounded" />Visitantes únicos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-purple-400/70 inline-block rounded-sm" />Vendas
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area dataKey="visitors" name="Visitantes" fill="url(#gV)" stroke="#818cf8"
                strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Bar dataKey="sales" name="Vendas" fill="#a855f7" opacity={0.8}
                radius={[3, 3, 0, 0]} maxBarSize={16} />
            </ComposedChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Receita Diária (BRL)" sub="Faturamento por dia nos últimos 30 dias">
          <ResponsiveContainer width="100%" height={252}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" name="Receita" radius={[4, 4, 0, 0]} maxBarSize={24}
                fill="#34d399" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* ── RECENT SALES + SOURCES ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Section title="Últimas Vendas" sub={`${recentSales.length} páginas mais recentes`}>
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

        <Section title="Performance por Fonte" sub="UTM — últimos 30 dias">
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
      <Section title="Links UTM Prontos" sub="Clique para copiar — use nas suas bios e anúncios">
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
                        {fmtDate(sale.createdAt)}
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
