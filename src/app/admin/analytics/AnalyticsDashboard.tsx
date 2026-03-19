'use client';

import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, ShoppingCart, TrendingUp, Percent,
  MousePointer, RefreshCw, Trash2, AlertTriangle, Globe,
} from 'lucide-react';

// ─── tipos ───────────────────────────────────────────────────────────────────
export type DayData = {
  date: string;       // YYYY-MM-DD
  label: string;      // DD/MM
  visitors: number;
  sales: number;
  revenue: number;
};

export type SourceRow = {
  source: string;
  visits: number;
  sales: number;
  revenue: number;
  convRate: string;
};

export type DashboardProps = {
  todayVisitors: number;
  totalVisitors: number;
  totalSales: number;
  totalRevenue: number;
  overallConv: string;
  chartData: DayData[];
  sourceRows: SourceRow[];
};

// ─── helpers ─────────────────────────────────────────────────────────────────
const SOURCE_META: Record<string, { emoji: string; label: string; color: string }> = {
  tiktok:    { emoji: '🎵', label: 'TikTok',    color: '#f472b6' },
  instagram: { emoji: '📸', label: 'Instagram', color: '#a78bfa' },
  facebook:  { emoji: '📘', label: 'Facebook',  color: '#60a5fa' },
  google:    { emoji: '🔍', label: 'Google',    color: '#fbbf24' },
  whatsapp:  { emoji: '💬', label: 'WhatsApp',  color: '#34d399' },
  direct:    { emoji: '🔗', label: 'Direto',    color: '#94a3b8' },
  organic:   { emoji: '🌱', label: 'Orgânico',  color: '#6ee7b7' },
};
function getMeta(s: string) {
  return SOURCE_META[s.toLowerCase()] ?? { emoji: '🌐', label: s, color: '#94a3b8' };
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-xs shadow-2xl">
      <p className="font-bold text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-black">{p.dataKey === 'revenue' ? brl(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, glow,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; glow: string;
}) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}33`,
        boxShadow: `0 0 30px ${glow}`,
      }}
    >
      <div className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
          {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AnalyticsDashboard({
  todayVisitors, totalVisitors, totalSales, totalRevenue, overallConv, chartData, sourceRows,
}: DashboardProps) {
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleReset = async () => {
    if (!confirm) { setConfirm(true); return; }
    setResetting(true);
    try {
      await fetch('/api/admin/analytics/reset', { method: 'POST' });
      setResetDone(true);
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      // ignore
    } finally {
      setResetting(false);
      setConfirm(false);
    }
  };

  const convNum = parseFloat(overallConv);

  return (
    <div className="space-y-8">

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Visitantes hoje" value={todayVisitors.toLocaleString('pt-BR')}
          sub="dispositivos únicos" icon={Globe} color="#818cf8" glow="rgba(129,140,248,0.12)" />
        <KpiCard label="Visitantes (30d)" value={totalVisitors.toLocaleString('pt-BR')}
          sub="dispositivos únicos" icon={Users} color="#60a5fa" glow="rgba(96,165,250,0.12)" />
        <KpiCard label="Vendas (30d)" value={totalSales}
          sub="páginas criadas" icon={ShoppingCart} color="#a78bfa" glow="rgba(167,139,250,0.12)" />
        <KpiCard label="Receita (30d)" value={brl(totalRevenue)}
          sub="pagamentos confirmados" icon={TrendingUp} color="#34d399" glow="rgba(52,211,153,0.12)" />
        <KpiCard
          label="Conversão geral"
          value={`${overallConv}%`}
          sub={convNum >= 2 ? '🔥 Excelente' : convNum >= 0.5 ? '👍 Boa' : '⚠️ Baixa'}
          icon={Percent}
          color={convNum >= 2 ? '#34d399' : convNum >= 0.5 ? '#fbbf24' : '#f87171'}
          glow={convNum >= 2 ? 'rgba(52,211,153,0.12)' : convNum >= 0.5 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)'}
        />
      </div>

      {/* ── Gráfico: Visitantes + Vendas (30d) ────────────────────────────── */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white">Visitantes & Vendas</h2>
            <p className="text-xs text-zinc-500">Últimos 30 dias — dispositivos únicos por dia</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" />Visitantes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-400 inline-block" />Vendas
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="visitors" name="Visitantes" stroke="#818cf8" strokeWidth={2}
              fill="url(#gVisitors)" dot={false} activeDot={{ r: 4, fill: '#818cf8' }} />
            <Area type="monotone" dataKey="sales" name="Vendas" stroke="#a78bfa" strokeWidth={2}
              fill="url(#gSales)" dot={false} activeDot={{ r: 4, fill: '#a78bfa' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Gráfico: Receita por dia ───────────────────────────────────────── */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="mb-6">
          <h2 className="text-base font-bold text-white">Receita Diária</h2>
          <p className="text-xs text-zinc-500">Faturamento por dia nos últimos 30 dias</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `R$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" name="Receita" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Tabela por fonte ───────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <h2 className="text-base font-bold text-white">Performance por Fonte</h2>
            <p className="text-xs text-zinc-500">Últimos 30 dias</p>
          </div>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700">
            {sourceRows.length} fontes
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Fonte', 'Visitas UTM', 'Vendas', 'Receita', 'Conversão', 'Link UTM'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sourceRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 text-sm">
                    Nenhuma visita UTM ainda. Use links com <code>?utm_source=tiktok</code> nas suas bios.
                  </td>
                </tr>
              )}
              {sourceRows.map((row) => {
                const meta = getMeta(row.source);
                const conv = parseFloat(row.convRate);
                const convColor = conv >= 2 ? '#34d399' : conv >= 0.5 ? '#fbbf24' : '#f87171';
                return (
                  <tr key={row.source}
                    className="transition-colors hover:bg-white/[0.03]"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{meta.emoji}</span>
                        <span className="font-bold text-sm" style={{ color: meta.color }}>{meta.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-white">{row.visits.toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-4 font-mono text-zinc-300">{row.sales}</td>
                    <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                      {row.revenue > 0 ? brl(row.revenue) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold font-mono text-sm" style={{ color: convColor }}>
                        {row.convRate}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <code className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 select-all border border-zinc-700">
                        ?utm_source={row.source}
                      </code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Links UTM prontos ──────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold text-white mb-4">Links UTM Prontos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(SOURCE_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-lg shrink-0">{meta.emoji}</span>
              <div className="min-w-0 flex-grow">
                <p className="text-[10px] font-bold mb-0.5" style={{ color: meta.color }}>{meta.label}</p>
                <code className="text-[10px] text-zinc-500 truncate block select-all">
                  mycupid.com.br?utm_source={key}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reset ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.15)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-300">Resetar todos os dados de analytics</p>
              <p className="text-xs text-zinc-500 mt-1">
                Zera visitas, visitantes únicos e utm_visits. Não afeta páginas criadas.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting || resetDone}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 disabled:opacity-50"
            style={{
              background: confirm ? 'rgba(239,68,68,0.2)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${confirm ? 'rgba(239,68,68,0.5)' : 'rgba(248,113,113,0.2)'}`,
              color: confirm ? '#fca5a5' : '#f87171',
            }}
          >
            {resetting
              ? <><RefreshCw className="w-4 h-4 animate-spin" />Zerando...</>
              : resetDone
                ? '✓ Zerado!'
                : confirm
                  ? <><Trash2 className="w-4 h-4" />Confirmar reset</>
                  : <><Trash2 className="w-4 h-4" />Zerar dados</>
            }
          </button>
        </div>
        {confirm && !resetting && (
          <p className="text-xs text-red-400/70 mt-3 flex items-center gap-1">
            ⚠️ Clique em "Confirmar reset" para apagar todos os dados. Esta ação não pode ser desfeita.
            <button onClick={() => setConfirm(false)} className="ml-2 underline text-zinc-500 hover:text-zinc-300">
              Cancelar
            </button>
          </p>
        )}
      </div>

    </div>
  );
}
