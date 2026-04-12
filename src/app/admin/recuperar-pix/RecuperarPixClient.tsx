'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Copy, Check, ExternalLink, RefreshCw, ShoppingBag,
  Search, MessageCircle, CheckCircle2, Filter,
} from 'lucide-react';

type AbandonedPix = {
  id: string;
  email: string;
  whatsapp: string;
  plan: string;
  amount: number;
  title: string;
  createdAt: string | null;
  updatedAt: string | null;
  contacted: boolean;
  contactedAt: string | null;
};

type FilterMode = 'all' | 'pending' | 'contacted' | 'with_whatsapp';

function getTimeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

function isPixStillValid(item: AbandonedPix): boolean {
  const ref = item.updatedAt || item.createdAt;
  if (!ref) return false;
  const ageMin = (Date.now() - new Date(ref).getTime()) / 60000;
  return ageMin < 30;
}

function buildMessage(item: AbandonedPix): string {
  if (isPixStillValid(item)) {
    // PIX ainda tá rolando — só um empurrãozinho, sem cupom
    return `Oii! Vi que você gerou o PIX pra sua página no MyCupid mas ainda não finalizou 🥹\nTá tudo bem aí? Seu PIX ainda tá funcionando viu, é só abrir de novo e pagar rapidinho! Qualquer coisa me chama por aqui 💜\n\nhttps://mycupid.com.br/criar/fazer-eu-mesmo?plan=avancado`;
  }
  // PIX expirou — oferece cupom de recuperação
  return `Oii! Vi que você começou a criar sua página no MyCupid mas não finalizou. Tá tudo bem? 🥹\nPra não deixar você na mão, separei um cupom especial pra você: *DESCONTO5* (R$5 de desconto). É só clicar no link aqui que já vai direto 💜🥰\n\nhttps://mycupid.com.br/criar/fazer-eu-mesmo?plan=avancado`;
}

function whatsappLink(item: AbandonedPix): string | null {
  const phone = item.whatsapp.replace(/\D/g, '');
  if (phone.length < 10) return null;
  const full = phone.startsWith('55') ? phone : `55${phone}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(buildMessage(item))}`;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return raw;
  const d = digits.startsWith('55') ? digits.slice(2) : digits;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

export default function RecuperarPixClient() {
  const [items, setItems] = useState<AbandonedPix[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('pending');
  const [search, setSearch] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/abandoned-pix', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.abandoned || []);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markContacted = async (item: AbandonedPix, contacted: boolean) => {
    // Optimistic update
    setItems(prev => prev.map(p =>
      p.id === item.id
        ? { ...p, contacted, contactedAt: contacted ? new Date().toISOString() : null }
        : p
    ));
    try {
      await fetch('/api/admin/abandoned-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, contacted }),
      });
    } catch {
      // Revert on error
      setItems(prev => prev.map(p =>
        p.id === item.id
          ? { ...p, contacted: !contacted, contactedAt: !contacted ? new Date().toISOString() : null }
          : p
      ));
    }
  };

  const handleCopy = (item: AbandonedPix) => {
    navigator.clipboard.writeText(buildMessage(item));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    if (!item.contacted) markContacted(item, true);
  };

  const handleWhatsApp = (item: AbandonedPix, link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
    if (!item.contacted) markContacted(item, true);
  };

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filter === 'pending' && item.contacted) return false;
      if (filter === 'contacted' && !item.contacted) return false;
      if (filter === 'with_whatsapp' && (item.whatsapp === '—' || item.whatsapp.replace(/\D/g, '').length < 10)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!item.email.toLowerCase().includes(q) &&
            !item.title.toLowerCase().includes(q) &&
            !item.whatsapp.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, filter, search]);

  const stats = useMemo(() => {
    const total = items.length;
    const contacted = items.filter(i => i.contacted).length;
    const withWhats = items.filter(i => i.whatsapp !== '—' && i.whatsapp.replace(/\D/g, '').length >= 10).length;
    const totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);
    return { total, contacted, pending: total - contacted, withWhats, totalAmount };
  }, [items]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
        <p className="text-xs text-zinc-500">Carregando PIX abandonados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── HERO STATS ─────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 sm:p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(239,68,68,0.04) 100%)',
          border: '1px solid rgba(251,191,36,0.2)',
        }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: '#fbbf24' }} />
        <div className="relative flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <ShoppingBag className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-grow min-w-0">
            <h2 className="text-base sm:text-lg font-black text-white leading-tight">Recuperar Vendas</h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              PIX gerados nos últimos 7 dias que ainda não foram pagos
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Atualizar">
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatBox label="Total" value={stats.total} color="#fbbf24" />
          <StatBox label="A contactar" value={stats.pending} color="#f87171" />
          <StatBox label="Já contatados" value={stats.contacted} color="#34d399" />
          <StatBox label="Potencial" value={`R$${stats.totalAmount.toFixed(0)}`} color="#a78bfa" />
        </div>
      </div>

      {/* ── SEARCH + FILTERS ───────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email, nome ou WhatsApp..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <FilterChip label="A contactar" active={filter === 'pending'} onClick={() => setFilter('pending')} count={stats.pending} />
          <FilterChip label="Contatados" active={filter === 'contacted'} onClick={() => setFilter('contacted')} count={stats.contacted} />
          <FilterChip label="Com WhatsApp" active={filter === 'with_whatsapp'} onClick={() => setFilter('with_whatsapp')} count={stats.withWhats} />
          <FilterChip label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} count={stats.total} />
        </div>
      </div>

      {/* ── LIST ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl py-14 px-6 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">
            {items.length === 0 ? 'Nenhum PIX abandonado' : 'Tudo em dia por aqui'}
          </p>
          <p className="text-xs text-zinc-500">
            {items.length === 0
              ? 'Todos os PIX gerados foram pagos. 🎉'
              : filter === 'pending'
                ? 'Todos os PIX pendentes já foram contatados.'
                : 'Nenhum resultado encontrado com esse filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(item => (
            <PixCard
              key={item.id}
              item={item}
              copied={copiedId === item.id}
              onCopy={() => handleCopy(item)}
              onWhatsApp={(link) => handleWhatsApp(item, link)}
              onToggleContacted={() => markContacted(item, !item.contacted)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</p>
      <p className="text-base sm:text-lg font-black mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}

function FilterChip({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
        active
          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
          : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10'
      }`}>
      {label}
      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${active ? 'bg-amber-500/20 text-amber-200' : 'bg-white/5 text-zinc-500'}`}>
        {count}
      </span>
    </button>
  );
}

function PixCard({
  item, copied, onCopy, onWhatsApp, onToggleContacted,
}: {
  item: AbandonedPix;
  copied: boolean;
  onCopy: () => void;
  onWhatsApp: (link: string) => void;
  onToggleContacted: () => void;
}) {
  const waLink = whatsappLink(item);
  const ago = getTimeAgo(item.updatedAt || item.createdAt);
  const planLabel = item.plan === 'avancado' ? 'Avançado' : 'Básico';
  const name = (item.email.split('@')[0] || 'cliente').replace(/[._-]+/g, ' ');
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${item.contacted ? 'opacity-60' : ''}`}
      style={{
        background: item.contacted ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)',
        border: item.contacted
          ? '1px solid rgba(34,197,94,0.15)'
          : '1px solid rgba(255,255,255,0.06)',
      }}>
      <div className="p-3.5 sm:p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
            style={{
              background: item.contacted ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.12)',
              color: item.contacted ? '#34d399' : '#fbbf24',
              border: `1px solid ${item.contacted ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)'}`,
            }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              {item.contacted && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  ENVIADO
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 truncate">{item.email}</p>
          </div>
          <button
            onClick={onToggleContacted}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: item.contacted ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${item.contacted ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
            aria-label={item.contacted ? 'Desmarcar como contatado' : 'Marcar como contatado'}>
            {item.contacted
              ? <Check className="w-3.5 h-3.5 text-emerald-400" />
              : <div className="w-3 h-3 rounded border border-zinc-500" />}
          </button>
        </div>

        {/* Info chips */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[10px]">
          <InfoChip>{planLabel}</InfoChip>
          <InfoChip accent="#34d399">R${item.amount.toFixed(2)}</InfoChip>
          <InfoChip>{ago}</InfoChip>
          {isPixStillValid(item) ? (
            <InfoChip accent="#60a5fa">⏱ PIX válido · sem cupom</InfoChip>
          ) : (
            <InfoChip accent="#fbbf24">💸 expirado · oferece DESCONTO5</InfoChip>
          )}
          {item.whatsapp !== '—' && item.whatsapp.replace(/\D/g, '').length >= 10 ? (
            <InfoChip accent="#4ade80">📱 {formatPhone(item.whatsapp)}</InfoChip>
          ) : (
            <InfoChip accent="#f87171">sem WhatsApp</InfoChip>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-bold transition-all"
            style={{
              background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: copied ? '#34d399' : '#d4d4d8',
            }}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar mensagem'}
          </button>
          {waLink ? (
            <button
              onClick={() => onWhatsApp(waLink)}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-black transition-all"
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(37,211,102,0.25)',
              }}>
              <MessageCircle className="w-3.5 h-3.5" />
              Enviar no WhatsApp
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-[10px] text-zinc-600"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              sem WhatsApp
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoChip({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold"
      style={{
        background: accent ? `${accent}14` : 'rgba(255,255,255,0.04)',
        color: accent || '#a1a1aa',
        border: `1px solid ${accent ? `${accent}28` : 'rgba(255,255,255,0.06)'}`,
      }}>
      {children}
    </span>
  );
}
