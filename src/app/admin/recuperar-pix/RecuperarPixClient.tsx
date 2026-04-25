'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Copy, Check, RefreshCw, ShoppingBag,
  Search, MessageCircle, CheckCircle2, Edit3, RotateCcw, X,
  Sparkles, Plus, Trash2, Star, StarOff, BookmarkPlus, ChevronDown, ChevronUp,
  ExternalLink, Eye, Zap, AlertTriangle,
} from 'lucide-react';
import { getPresets, saveCustomPresets as saveCustomPresetsAction, saveDefaultPreset as saveDefaultPresetAction } from './preset-actions';

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

type MessagePreset = {
  id: string;
  name: string;
  content: string;
  builtin?: boolean;
};

type FilterMode = 'all' | 'pending' | 'contacted' | 'with_whatsapp';

const LINK = 'https://mycupid.com.br/criar/fazer-eu-mesmo?plan=avancado';
const EXAMPLE_PAGE_URL = 'https://mycupid.com.br/p/FmpSee8q4pO4mEzmXo45';

// Emojis universais — Unicode 6.0 (2010), funcionam em qualquer aparelho antigo/novo
const SAFE_EMOJIS = ['😊', '😉', '😢', '❤️', '💜', '💖', '💕', '🎉', '✨', '🙏', '👀', '😍', '🌸', '💫', '😎', '😘'];

const BUILTIN_PRESETS: MessagePreset[] = [
  {
    id: 'builtin_valid',
    name: 'PIX ainda válido',
    builtin: true,
    content: `Oii! Vi que você gerou o PIX pra sua página no MyCupid mas ainda não finalizou. Tá tudo bem aí?\nSeu PIX ainda tá funcionando viu, é só abrir de novo e pagar rapidinho! Qualquer coisa me chama por aqui, vou te ajudar.\n\n${LINK}`,
  },
  {
    id: 'builtin_coupon',
    name: 'Cupom DESCONTO5',
    builtin: true,
    content: `Oii! Vi que você começou a criar sua página no MyCupid mas não finalizou. Tá tudo bem?\nPra não deixar você na mão, separei um cupom especial: *DESCONTO5* (R$5 de desconto). É só clicar no link aqui que já vai direto, vou adorar te ver finalizar.\n\n${LINK}`,
  },
  {
    id: 'builtin_simple',
    name: 'Curta e direta',
    builtin: true,
    content: `Oii! Vi que você começou a criar sua página no MyCupid e ainda não finalizou. Posso te ajudar em alguma coisa?\n\n${LINK}`,
  },
];

// LocalStorage vira CACHE OTIMISTA — source of truth é o Firestore via
// getPresets/saveCustomPresets/saveDefaultPreset. Antes era só local, o que
// causava "mensagem criada no PC não aparecia no celular" (cada device com
// seu storage isolado). Agora sync entre devices.
const CACHE_PRESETS = 'recuperar_pix_presets_v1';
const CACHE_DEFAULT = 'recuperar_pix_default_preset_v1';

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

function whatsappLink(item: AbandonedPix, message: string): string | null {
  const phone = item.whatsapp.replace(/\D/g, '');
  if (phone.length < 10) return null;
  const full = phone.startsWith('55') ? phone : `55${phone}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
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
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── BROADCAST (disparar pra todos) ───────────────────────────────
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ opened: number; blocked: number } | null>(null);

  // Presets
  const [customPresets, setCustomPresets] = useState<MessagePreset[]>([]);
  const [defaultPresetId, setDefaultPresetId] = useState<string>('');
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [creatingPreset, setCreatingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetContent, setNewPresetContent] = useState('');

  // Load presets: primeiro cache local (instantâneo), depois Firestore
  // (source of truth, sobrescreve se vier diferente). Garante que o PC
  // sempre vê o que foi salvo no celular e vice-versa.
  useEffect(() => {
    // 1. Pinta da cache pra evitar flash de vazio
    try {
      const cachedPresets = localStorage.getItem(CACHE_PRESETS);
      if (cachedPresets) setCustomPresets(JSON.parse(cachedPresets));
      const cachedDefault = localStorage.getItem(CACHE_DEFAULT);
      if (cachedDefault) setDefaultPresetId(cachedDefault);
    } catch {}

    // 2. Busca do Firestore e atualiza se vier coisa diferente
    (async () => {
      try {
        const remote = await getPresets();
        setCustomPresets(remote.customPresets);
        setDefaultPresetId(remote.defaultPresetId);
        // Atualiza cache pra próxima visita ser instantânea
        try {
          localStorage.setItem(CACHE_PRESETS, JSON.stringify(remote.customPresets));
          localStorage.setItem(CACHE_DEFAULT, remote.defaultPresetId);
        } catch {}
      } catch (err) {
        console.warn('[presets] falha ao buscar remoto, usando cache local:', err);
      }
    })();
  }, []);

  const allPresets = useMemo(() => [...BUILTIN_PRESETS, ...customPresets], [customPresets]);

  // Write-through: atualiza UI imediato + cache local + dispara save no Firestore.
  // Se Firestore falhar, UI continua OK (otimista); próximo load sincroniza.
  const saveCustomPresets = (next: MessagePreset[]) => {
    setCustomPresets(next);
    try { localStorage.setItem(CACHE_PRESETS, JSON.stringify(next)); } catch {}
    saveCustomPresetsAction(next).catch(err => console.warn('[presets] save remote failed:', err));
  };

  const saveDefaultPreset = (id: string) => {
    setDefaultPresetId(id);
    try { localStorage.setItem(CACHE_DEFAULT, id); } catch {}
    saveDefaultPresetAction(id).catch(err => console.warn('[presets] save default failed:', err));
  };

  const createPreset = () => {
    const name = newPresetName.trim();
    const content = newPresetContent.trim();
    if (!name || !content) return;
    const preset: MessagePreset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name, content,
    };
    saveCustomPresets([...customPresets, preset]);
    setNewPresetName('');
    setNewPresetContent('');
    setCreatingPreset(false);
  };

  const deletePreset = (id: string) => {
    saveCustomPresets(customPresets.filter(p => p.id !== id));
    if (defaultPresetId === id) saveDefaultPreset('');
  };

  // Build default message — uses default preset if set, otherwise validity-based
  const buildMessage = useCallback((item: AbandonedPix): string => {
    if (defaultPresetId) {
      const p = allPresets.find(p => p.id === defaultPresetId);
      if (p) return p.content;
    }
    return isPixStillValid(item)
      ? BUILTIN_PRESETS[0].content
      : BUILTIN_PRESETS[1].content;
  }, [defaultPresetId, allPresets]);

  const getMessage = (item: AbandonedPix) => customMessages[item.id] ?? buildMessage(item);
  const setMessage = (id: string, value: string) => setCustomMessages(prev => ({ ...prev, [id]: value }));
  const resetMessage = (item: AbandonedPix) => {
    setCustomMessages(prev => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const applyPresetToCard = (cardId: string, presetContent: string) => {
    setMessage(cardId, presetContent);
  };

  const saveCardAsPreset = (cardId: string) => {
    const content = customMessages[cardId];
    if (!content) return;
    const name = prompt('Nome da mensagem pronta:');
    if (!name?.trim()) return;
    const preset: MessagePreset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(), content,
    };
    saveCustomPresets([...customPresets, preset]);
  };

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
      setItems(prev => prev.map(p =>
        p.id === item.id
          ? { ...p, contacted: !contacted, contactedAt: !contacted ? new Date().toISOString() : null }
          : p
      ));
    }
  };

  const handleCopy = (item: AbandonedPix) => {
    navigator.clipboard.writeText(getMessage(item));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    if (!item.contacted) markContacted(item, true);
  };

  const handleWhatsApp = (item: AbandonedPix) => {
    const link = whatsappLink(item, getMessage(item));
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
    if (!item.contacted) markContacted(item, true);
  };

  // Dispara WhatsApp pra todos os itens elegíveis do filtro atual.
  // Abre N abas sincronamente dentro do click handler pra respeitar popup blocker.
  const handleSendAll = (targets: AbandonedPix[]) => {
    let opened = 0;
    let blocked = 0;
    const openedIds: string[] = [];
    for (const item of targets) {
      const link = whatsappLink(item, getMessage(item));
      if (!link) continue;
      const w = window.open(link, '_blank', 'noopener,noreferrer');
      if (w) {
        opened++;
        openedIds.push(item.id);
      } else {
        blocked++;
      }
    }

    // Marca todas que abriram como contatadas (otimista + API fire-and-forget)
    if (openedIds.length > 0) {
      const nowIso = new Date().toISOString();
      setItems(prev => prev.map(p =>
        openedIds.includes(p.id) ? { ...p, contacted: true, contactedAt: nowIso } : p
      ));
      openedIds.forEach(id => {
        fetch('/api/admin/abandoned-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, contacted: true }),
        }).catch(() => {});
      });
    }

    setBroadcastResult({ opened, blocked });
    setBroadcastOpen(false);
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

  // Itens do filtro atual que têm WhatsApp válido E ainda não foram contatados.
  const eligibleForBroadcast = useMemo(
    () => filtered.filter(i =>
      !i.contacted &&
      i.whatsapp !== '—' &&
      i.whatsapp.replace(/\D/g, '').length >= 10
    ),
    [filtered]
  );

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

        {/* ── BROADCAST — disparar WhatsApp pra todos do filtro ───── */}
        <button
          onClick={() => setBroadcastOpen(true)}
          disabled={eligibleForBroadcast.length === 0}
          className="relative mt-3 w-full group overflow-hidden rounded-xl py-3 px-4 text-white font-black text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:scale-[1.01] enabled:active:scale-[0.99]"
          style={{
            background: eligibleForBroadcast.length > 0
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'rgba(255,255,255,0.04)',
            border: eligibleForBroadcast.length > 0
              ? '1px solid rgba(16,185,129,0.5)'
              : '1px solid rgba(255,255,255,0.08)',
            boxShadow: eligibleForBroadcast.length > 0
              ? '0 8px 24px rgba(16,185,129,0.3)'
              : 'none',
          }}>
          {eligibleForBroadcast.length > 0 && (
            <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
          )}
          <span className="relative flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            {eligibleForBroadcast.length > 0
              ? `Disparar WhatsApp pros ${eligibleForBroadcast.length} do filtro`
              : 'Nenhum elegível no filtro atual'}
          </span>
        </button>

        {/* ── Página de exemplo pra mostrar pro prospect ───────────── */}
        <div className="relative mt-3 flex items-center gap-2 flex-wrap">
          <a
            href={EXAMPLE_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-purple-200 hover:text-white transition-colors"
            style={{
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.3)',
            }}>
            <Eye className="w-3 h-3" />
            Ver página exemplo
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
          <button
            onClick={async () => {
              try { await navigator.clipboard.writeText(EXAMPLE_PAGE_URL); } catch {}
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-zinc-300 hover:text-white transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
            <Copy className="w-3 h-3" />
            Copiar link do exemplo
          </button>
          <span className="text-[10px] text-zinc-500 truncate flex-1 min-w-0">
            {EXAMPLE_PAGE_URL}
          </span>
        </div>
      </div>

      {/* ── PRESETS MANAGER ─────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
        <button
          onClick={() => setPresetsOpen(!presetsOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-white">Mensagens prontas</p>
              <p className="text-[10px] text-zinc-500">
                {customPresets.length} personalizadas · {BUILTIN_PRESETS.length} padrão
                {defaultPresetId && (
                  <span className="text-purple-300 ml-1">· Padrão definido</span>
                )}
              </p>
            </div>
          </div>
          {presetsOpen
            ? <ChevronUp className="w-4 h-4 text-zinc-500" />
            : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {presetsOpen && (
          <div className="border-t px-3 sm:px-4 py-3 space-y-2.5"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Clique na estrela pra definir como mensagem padrão em todos os cards. Você ainda pode editar individualmente depois.
            </p>

            <div className="space-y-1.5">
              {allPresets.map(preset => (
                <PresetRow
                  key={preset.id}
                  preset={preset}
                  isDefault={defaultPresetId === preset.id}
                  onSetDefault={() => saveDefaultPreset(defaultPresetId === preset.id ? '' : preset.id)}
                  onDelete={() => deletePreset(preset.id)}
                />
              ))}
            </div>

            {creatingPreset ? (
              <div className="rounded-xl p-3 space-y-2"
                style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.25)' }}>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value.slice(0, 40))}
                  placeholder="Nome (ex: Desconto VIP)"
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                />
                <textarea
                  value={newPresetContent}
                  onChange={(e) => setNewPresetContent(e.target.value.slice(0, 1000))}
                  placeholder="Escreva sua mensagem aqui..."
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none font-mono leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600 font-mono">{newPresetContent.length}/1000</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setCreatingPreset(false); setNewPresetName(''); setNewPresetContent(''); }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">
                      Cancelar
                    </button>
                    <button
                      onClick={createPreset}
                      disabled={!newPresetName.trim() || !newPresetContent.trim()}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreatingPreset(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/25 border-dashed hover:bg-purple-500/15 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Criar nova mensagem pronta
              </button>
            )}
          </div>
        )}
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
              ? 'Todos os PIX gerados foram pagos.'
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
              message={getMessage(item)}
              isEditing={editingId === item.id}
              isCustom={customMessages[item.id] !== undefined}
              presets={allPresets}
              onCopy={() => handleCopy(item)}
              onWhatsApp={() => handleWhatsApp(item)}
              onToggleContacted={() => markContacted(item, !item.contacted)}
              onToggleEdit={() => setEditingId(editingId === item.id ? null : item.id)}
              onMessageChange={(val) => setMessage(item.id, val)}
              onResetMessage={() => resetMessage(item)}
              onApplyPreset={(content) => applyPresetToCard(item.id, content)}
              onSaveAsPreset={() => saveCardAsPreset(item.id)}
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

function PresetRow({
  preset, isDefault, onSetDefault, onDelete,
}: {
  preset: MessagePreset;
  isDefault: boolean;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: isDefault ? 'rgba(168,85,247,0.06)' : 'rgba(0,0,0,0.2)',
        border: `1px solid ${isDefault ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.05)'}`,
      }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={onSetDefault}
          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
          title={isDefault ? 'Remover como padrão' : 'Definir como padrão'}>
          {isDefault
            ? <Star className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
            : <StarOff className="w-3.5 h-3.5 text-zinc-600" />}
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-grow min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-white truncate">{preset.name}</p>
            {preset.builtin && (
              <span className="text-[8px] font-bold text-zinc-500 bg-white/5 px-1 py-0.5 rounded uppercase tracking-wider">
                Padrão
              </span>
            )}
            {isDefault && (
              <span className="text-[8px] font-black text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1 py-0.5 rounded uppercase tracking-wider">
                Em uso
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 truncate mt-0.5">
            {preset.content.slice(0, 70)}{preset.content.length > 70 ? '…' : ''}
          </p>
        </button>
        {!preset.builtin && (
          <button
            onClick={onDelete}
            className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Excluir">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      {expanded && (
        <div className="px-3 pb-2.5 pt-0">
          <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed bg-black/30 rounded-lg p-2 border border-white/5">
            {preset.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function PixCard({
  item, copied, message, isEditing, isCustom, presets,
  onCopy, onWhatsApp, onToggleContacted, onToggleEdit, onMessageChange, onResetMessage,
  onApplyPreset, onSaveAsPreset,
}: {
  item: AbandonedPix;
  copied: boolean;
  message: string;
  isEditing: boolean;
  isCustom: boolean;
  presets: MessagePreset[];
  onCopy: () => void;
  onWhatsApp: () => void;
  onToggleContacted: () => void;
  onToggleEdit: () => void;
  onMessageChange: (val: string) => void;
  onResetMessage: () => void;
  onApplyPreset: (content: string) => void;
  onSaveAsPreset: () => void;
}) {
  const hasWhats = item.whatsapp !== '—' && item.whatsapp.replace(/\D/g, '').length >= 10;
  const ago = getTimeAgo(item.updatedAt || item.createdAt);
  const planLabel = item.plan === 'avancado' ? 'Avançado' : 'Básico';
  const name = (item.email.split('@')[0] || 'cliente').replace(/[._-]+/g, ' ');
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const charCount = message.length;

  return (
    <div className={`rounded-2xl overflow-hidden transition-all ${item.contacted ? 'opacity-60' : ''}`}
      style={{
        background: item.contacted ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)',
        border: item.contacted
          ? '1px solid rgba(34,197,94,0.15)'
          : isEditing
            ? '1px solid rgba(251,191,36,0.3)'
            : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isEditing ? '0 0 40px -10px rgba(251,191,36,0.3)' : 'none',
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
              {isCustom && !isEditing && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30">
                  <Edit3 className="w-2.5 h-2.5" />
                  EDITADA
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
            <InfoChip accent="#60a5fa">PIX ainda válido</InfoChip>
          ) : (
            <InfoChip accent="#fbbf24">PIX expirado</InfoChip>
          )}
          {hasWhats ? (
            <InfoChip accent="#4ade80">{formatPhone(item.whatsapp)}</InfoChip>
          ) : (
            <InfoChip accent="#f87171">sem WhatsApp</InfoChip>
          )}
        </div>

        {/* Message preview / editor */}
        <div className="mb-3 rounded-xl overflow-hidden"
          style={{
            background: isEditing ? 'rgba(251,191,36,0.04)' : 'rgba(0,0,0,0.25)',
            border: `1px solid ${isEditing ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.05)'}`,
          }}>
          <div className="flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: isEditing ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                {isEditing ? 'Editando mensagem' : 'Mensagem a enviar'}
              </span>
              {isEditing && (
                <span className="text-[9px] text-zinc-600 font-mono ml-1">{charCount}/1000</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isCustom && (
                <button
                  onClick={onResetMessage}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                  title="Restaurar mensagem padrão">
                  <RotateCcw className="w-2.5 h-2.5" />
                  Padrão
                </button>
              )}
              <button
                onClick={onToggleEdit}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors"
                style={{
                  color: isEditing ? '#fbbf24' : '#a1a1aa',
                  background: isEditing ? 'rgba(251,191,36,0.12)' : 'transparent',
                }}>
                {isEditing ? <><X className="w-2.5 h-2.5" />Fechar</> : <><Edit3 className="w-2.5 h-2.5" />Editar</>}
              </button>
            </div>
          </div>
          {isEditing ? (
            <div>
              <textarea
                value={message}
                onChange={(e) => onMessageChange(e.target.value.slice(0, 1000))}
                rows={6}
                autoFocus
                className="w-full px-3 py-2.5 bg-transparent text-xs text-white placeholder:text-zinc-600 focus:outline-none resize-none font-mono leading-relaxed"
                placeholder="Escreva sua mensagem personalizada..."
              />
              {/* Safe emoji palette + example link quick-insert */}
              <div className="px-3 py-2 border-t flex items-center gap-1 flex-wrap"
                style={{ borderColor: 'rgba(251,191,36,0.15)', background: 'rgba(0,0,0,0.15)' }}>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mr-1">Emojis seguros:</span>
                {SAFE_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => onMessageChange((message + e).slice(0, 1000))}
                    className="text-base hover:scale-125 transition-transform"
                    title={`Inserir ${e}`}>
                    {e}
                  </button>
                ))}
                <button
                  onClick={() => onMessageChange((message + '\n\nVeja um exemplo: ' + EXAMPLE_PAGE_URL).slice(0, 1000))}
                  className="ml-auto flex items-center gap-1 text-[9px] font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-full px-2 py-0.5 transition-colors"
                  title="Inserir link da página de exemplo">
                  <Eye className="w-2.5 h-2.5" />
                  + Exemplo
                </button>
              </div>
              <div className="px-3 py-2 border-t flex items-center gap-1.5 flex-wrap"
                style={{ borderColor: 'rgba(251,191,36,0.15)', background: 'rgba(0,0,0,0.2)' }}>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mr-0.5">Inserir:</span>
                {presets.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onApplyPreset(p.content)}
                    className="text-[9px] font-bold text-zinc-300 bg-white/5 hover:bg-purple-500/15 hover:text-purple-200 border border-white/10 hover:border-purple-500/30 rounded-full px-2 py-0.5 transition-colors"
                    title={p.content}>
                    {p.name}
                  </button>
                ))}
                {isCustom && (
                  <button
                    onClick={onSaveAsPreset}
                    className="ml-auto flex items-center gap-1 text-[9px] font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-full px-2 py-0.5 transition-colors">
                    <BookmarkPlus className="w-2.5 h-2.5" />
                    Salvar como pronta
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="px-3 py-2.5 text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line line-clamp-4 font-mono">
              {message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl text-[11px] font-bold transition-all"
            style={{
              background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: copied ? '#34d399' : '#d4d4d8',
            }}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          {hasWhats ? (
            <button
              onClick={onWhatsApp}
              className="flex-[1.5] flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl text-[11px] font-black transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                boxShadow: '0 6px 20px -4px rgba(37,211,102,0.4)',
              }}>
              <MessageCircle className="w-4 h-4" />
              Enviar no WhatsApp
            </button>
          ) : (
            <div className="flex-[1.5] flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl text-[10px] text-zinc-600"
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
