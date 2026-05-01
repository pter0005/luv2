'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ShieldCheck, ShoppingBag, Gift, Link2, Tag, MessageCircle, Bell,
  ImageOff, QrCode, LogOut, Menu, X, LayoutDashboard, BarChart3,
  Edit3, FileText, FileWarning,
} from 'lucide-react';

interface AdminNavProps {
  logoutAction: () => void;
}

// Links organizados por grupo pra drawer mobile fazer sentido. Cada item tem:
// - ícone colorido com accent da função
// - href exato (para matching preciso de active state)
// - label curta (evita wrapping)
// - opcional: `badge` pra mostrar contador (ex: erros pendentes) no futuro
type NavItem = { label: string; href: string; Icon: typeof LayoutDashboard; color: string };
type NavGroup = { heading: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Principal',
    items: [
      { label: 'Dashboard', href: '/admin', Icon: LayoutDashboard, color: '#a855f7' },
      { label: 'Analytics', href: '/admin/analytics', Icon: BarChart3, color: '#6366f1' },
    ],
  },
  {
    heading: 'Vendas',
    items: [
      { label: 'Recuperar PIX', href: '/admin/recuperar-pix', Icon: ShoppingBag, color: '#fbbf24' },
      { label: 'WhatsApp', href: '/admin/whatsapp', Icon: MessageCircle, color: '#34d399' },
      { label: 'Descontos', href: '/admin/discount', Icon: Tag, color: '#22d3ee' },
    ],
  },
  {
    heading: 'Cortesia',
    items: [
      { label: 'Créditos', href: '/admin/creditos', Icon: Gift, color: '#10b981' },
      { label: 'Presentes', href: '/admin/gift', Icon: Link2, color: '#c084fc' },
    ],
  },
  {
    heading: 'Operações',
    items: [
      { label: 'Páginas', href: '/admin/pages', Icon: FileText, color: '#60a5fa' },
      { label: 'Imagens', href: '/admin/fix-images', Icon: ImageOff, color: '#fb923c' },
      { label: 'Diagnóstico', href: '/admin/diagnostico-uploads', Icon: FileWarning, color: '#ef4444' },
      { label: 'QR Code', href: '/admin/qrcode', Icon: QrCode, color: '#e879f9' },
      { label: 'Notificações', href: '/admin/notificacoes', Icon: Bell, color: '#facc15' },
    ],
  },
];

// Pra desktop: flat list ordenada pra barra única
const FLAT_NAV = NAV_GROUPS.flatMap(g => g.items);

function isActive(current: string, href: string): boolean {
  if (href === '/admin') return current === '/admin';
  return current === href || current.startsWith(href + '/');
}

export default function AdminNav({ logoutAction }: AdminNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fecha drawer ao mudar de página
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Bloqueia scroll do body enquanto drawer aberto
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen, mounted]);

  // Label da página ativa pro header mobile (breadcrumb tipo "Admin / Créditos")
  const activeItem = FLAT_NAV.find(i => isActive(pathname, i.href));
  const activeLabel = activeItem?.label || 'Admin';

  const today = mounted
    ? new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    : '';

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP HEADER (md+): barra horizontal com active state pill-style
          ═══════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-40 hidden md:block border-b"
        style={{
          background: 'rgba(9,9,11,0.88)',
          borderColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          {/* Brand */}
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.2))',
                border: '1px solid rgba(168,85,247,0.4)',
                boxShadow: '0 4px 20px -4px rgba(168,85,247,0.4)',
              }}
            >
              <ShieldCheck className="w-4 h-4 text-purple-300" />
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-black text-white tracking-tight">Admin</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">MyCupid</div>
            </div>
          </Link>

          {/* Divider */}
          <div className="w-px h-8 bg-white/[0.06] shrink-0" />

          {/* Nav — horizontal scroll se não couber (raramente acontece em desktop wide) */}
          <nav className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' } as any}>
            {FLAT_NAV.map(({ label, href, Icon, color }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'shrink-0 group relative flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-semibold transition-all',
                    active
                      ? 'text-white bg-white/[0.06] ring-1 ring-white/10 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]',
                  )}
                  style={active ? {
                    boxShadow: `inset 0 0 0 1px ${color}30, 0 0 20px -10px ${color}80`,
                  } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: active ? color : undefined }} />
                  <span>{label}</span>
                  {active && (
                    <span
                      className="absolute inset-x-2 -bottom-px h-px opacity-60"
                      style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Direita: data + chat link + sair */}
          <div className="flex items-center gap-2 shrink-0">
            {today && (
              <span className="hidden xl:block text-[11px] text-zinc-500 tabular-nums">{today}</span>
            )}
            <Link
              href="/chat"
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-bold text-pink-200 bg-pink-500/10 ring-1 ring-pink-500/30 hover:bg-pink-500/20 hover:text-pink-100 transition"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Criar página
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] font-semibold text-zinc-500 hover:text-red-300 hover:bg-red-500/10 transition"
                title="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE HEADER (<md): brand + label da página atual + hambúrguer
          ═══════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-40 md:hidden border-b"
        style={{
          background: 'rgba(9,9,11,0.92)',
          borderColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="flex h-14 items-center justify-between px-4 gap-3">
          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.2))',
                border: '1px solid rgba(168,85,247,0.4)',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">Admin</div>
              <div className="text-sm font-bold text-white truncate">{activeLabel}</div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.06] ring-1 ring-white/10 transition active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          DRAWER MOBILE — slide-in da direita, full-height, grupos semânticos
          ═══════════════════════════════════════════════════════════════════ */}
      {mounted && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
            className={cn(
              'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity md:hidden',
              drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
            )}
          />
          {/* Panel */}
          <aside
            role="dialog"
            aria-label="Navegação admin"
            className={cn(
              'fixed top-0 right-0 bottom-0 z-50 w-[88vw] max-w-sm flex flex-col md:hidden transition-transform',
              drawerOpen ? 'translate-x-0' : 'translate-x-full',
            )}
            style={{
              background: 'linear-gradient(180deg, #0b0014 0%, #0a0a0a 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.2))',
                    border: '1px solid rgba(168,85,247,0.4)',
                  }}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-300" />
                </div>
                <div className="leading-tight">
                  <div className="text-[13px] font-black text-white">Admin</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">MyCupid</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] ring-1 ring-white/10 transition active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav items agrupados */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {NAV_GROUPS.map(group => (
                <div key={group.heading}>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                    {group.heading}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map(({ label, href, Icon, color }) => {
                      const active = isActive(pathname, href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition active:scale-[0.98]',
                            active
                              ? 'bg-white/[0.06] text-white ring-1 ring-white/10'
                              : 'text-zinc-300 hover:bg-white/[0.03] hover:text-white',
                          )}
                          style={active ? {
                            boxShadow: `inset 0 0 0 1px ${color}30`,
                          } : undefined}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition"
                            style={{
                              background: active ? `${color}25` : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${active ? color + '50' : 'rgba(255,255,255,0.06)'}`,
                            }}
                          >
                            <Icon className="h-4 w-4" style={{ color: active ? color : 'rgb(161,161,170)' }} />
                          </div>
                          <span className="text-[13.5px] font-semibold flex-1">{label}</span>
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* CTA de voltar pro site */}
              <div className="pt-3 border-t border-white/5">
                <Link
                  href="/chat"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-pink-500/15 to-purple-500/15 ring-1 ring-pink-500/30 text-pink-200 hover:from-pink-500/25 hover:to-purple-500/25 transition active:scale-[0.98]"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(236,72,153,0.2)', border: '1px solid rgba(236,72,153,0.4)' }}
                  >
                    <Edit3 className="h-4 w-4 text-pink-300" />
                  </div>
                  <span className="text-[13.5px] font-bold flex-1">Criar página</span>
                  <span className="text-[9px] bg-pink-500/20 px-2 py-0.5 rounded-full text-pink-200 font-bold uppercase tracking-wider">/chat</span>
                </Link>
              </div>
            </nav>

            {/* Footer drawer: data + logout */}
            <div className="px-3 py-4 border-t border-white/5 shrink-0 space-y-2">
              {today && (
                <div className="px-3 text-[11px] text-zinc-600 tabular-nums capitalize">
                  {today}
                </div>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300 bg-red-500/5 hover:bg-red-500/15 ring-1 ring-red-500/20 transition active:scale-[0.98]"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    <LogOut className="h-4 w-4 text-red-400" />
                  </div>
                  <span className="text-[13.5px] font-bold">Sair da conta</span>
                </button>
              </form>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
