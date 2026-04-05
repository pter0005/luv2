'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useUser } from '@/firebase';

// ══════════════════════════════════════════════════════════════
// EASTER_MODE — set to false to instantly remove all Easter theming
// ══════════════════════════════════════════════��═══════════════
const EASTER_MODE = true;

const OPTIONS = [
  { key: 'namorade', emoji: '💜', label: 'Namorada/o',     sub: 'declare seu amor' },
  { key: 'espouse',  emoji: '💍', label: 'Esposa/o',       sub: 'eternize o amor' },
  { key: 'mae',      emoji: '🌸', label: 'Mãe',            sub: 'surpreenda ela' },
  { key: 'pai',      emoji: '💙', label: 'Pai',            sub: 'surpreenda ele' },
  { key: 'amige',    emoji: '🤍', label: 'Amigo/a',        sub: 'homenageie essa pessoa' },
  { key: 'avo',      emoji: '🌻', label: 'Avó/Avô',        sub: 'um presente especial' },
  { key: 'filho',    emoji: '💛', label: 'Filho/Filha',    sub: 'eternize esse amor' },
  { key: 'outro',    emoji: '✨', label: 'Outra pessoa',   sub: 'alguém especial' },
];

import { ADMIN_EMAILS } from '@/lib/admin-emails';

// ── Easter countdown hook (2h from page load) ────────────────
function useCountdown(durationMs: number) {
  const [endTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('easter_countdown_end');
      if (stored) {
        const t = parseInt(stored, 10);
        if (t > Date.now()) return t;
      }
      const end = Date.now() + durationMs;
      localStorage.setItem('easter_countdown_end', String(end));
      return end;
    }
    return Date.now() + durationMs;
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, endTime - now);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { h, m, s, expired: remaining <= 0 };
}

// ── Floating Easter decoration ────────────────────────────────
const EASTER_FLOATERS = [
  { emoji: '🥚', x: 8,  y: 12, size: 28, delay: 0,    dur: 12 },
  { emoji: '🐰', x: 88, y: 8,  size: 24, delay: -3,   dur: 14 },
  { emoji: '🌸', x: 5,  y: 65, size: 20, delay: -5,   dur: 10 },
  { emoji: '🥚', x: 92, y: 60, size: 22, delay: -7,   dur: 13 },
  { emoji: '💐', x: 50, y: 5,  size: 18, delay: -2,   dur: 11 },
  { emoji: '🐣', x: 15, y: 85, size: 20, delay: -4,   dur: 15 },
  { emoji: '🌷', x: 82, y: 82, size: 22, delay: -6,   dur: 12 },
  { emoji: '✨', x: 35, y: 15, size: 16, delay: -1,   dur: 9  },
  { emoji: '🐇', x: 70, y: 20, size: 18, delay: -8,   dur: 11 },
  { emoji: '🥚', x: 25, y: 45, size: 16, delay: -3.5, dur: 13 },
];

export default function CriarPage() {
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const countdown = useCountdown(2 * 60 * 60 * 1000); // 2 hours

  const handleConfirm = () => {
    if (!selected) return;
    setConfirming(true);

    if (selected === 'pascoa') {
      setTimeout(() => {
        router.push('/criar/fazer-eu-mesmo?plan=pascoa&new=true&segment=namorade');
      }, 400);
      return;
    }

    const segment = selected === 'outro' ? '' : `&segment=${selected}`;
    setTimeout(() => {
      router.push(`/criar/fazer-eu-mesmo?plan=avancado&new=true${segment}`);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">

      {/* ── KEYFRAMES ─────────────────────────────────────── */}
      {EASTER_MODE && (
        <style>{`
          @keyframes easterFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        `}</style>
      )}

      {/* ── Background glows ──────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-purple-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full" />
      </div>

      {/* ── Floating Easter decorations ──────────────────── */}
      {EASTER_MODE && (
        <div className="pointer-events-none fixed inset-0 -z-5 overflow-hidden">
          {EASTER_FLOATERS.map((f, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${f.x}%`,
                top: `${f.y}%`,
                fontSize: f.size,
                opacity: 0.06,
                animation: `easterFloat ${f.dur}s ease-in-out infinite`,
                animationDelay: `${f.delay}s`,
              }}
            >
              {f.emoji}
            </div>
          ))}
        </div>
      )}

      {/* ── EASTER BANNER ── */}
      {EASTER_MODE && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div style={{ background: 'linear-gradient(90deg, #fce4ec 0%, #fff0f5 30%, #fce4ec 50%, #fff0f5 70%, #fce4ec 100%)' }}
            className="border-b border-pink-200/30">
            <div className="flex items-center justify-center gap-3 px-4 py-2 text-center">
              <svg width="16" height="20" viewBox="0 0 56 72" fill="none" className="shrink-0">
                <ellipse cx="18" cy="16" rx="7" ry="18" fill="#fff" stroke="#ddb8c8" strokeWidth="2"/>
                <ellipse cx="18" cy="16" rx="4" ry="13" fill="#ffc8e0"/>
                <ellipse cx="38" cy="16" rx="7" ry="18" fill="#fff" stroke="#ddb8c8" strokeWidth="2"/>
                <ellipse cx="38" cy="16" rx="4" ry="13" fill="#ffc8e0"/>
                <ellipse cx="28" cy="38" rx="22" ry="19" fill="#fff" stroke="#ddb8c8" strokeWidth="2"/>
                <circle cx="21" cy="37" r="3" fill="#2e1f28"/>
                <ellipse cx="19.8" cy="35.8" rx="1.3" ry="1.1" fill="#fff"/>
                <circle cx="35" cy="37" r="3" fill="#2e1f28"/>
                <ellipse cx="33.8" cy="35.8" rx="1.3" ry="1.1" fill="#fff"/>
                <ellipse cx="28" cy="41" rx="2.2" ry="1.5" fill="#ff90ac"/>
                <path d="M25 43.5Q28 47 31 43.5" stroke="#b07888" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
              <span className="text-[12px] font-bold tracking-wide" style={{ color: '#d32f4a' }}>
                Feliz Pascoa! Crie uma surpresa especial com o coelhinho
              </span>
              <svg width="14" height="18" viewBox="0 0 16 20" className="shrink-0">
                <ellipse cx="8" cy="11" rx="6.5" ry="8.5" fill="#ffb347"/>
                <path d="M3 9Q8 6 13 9" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                <path d="M3.5 13Q8 16 12.5 13" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* HEADER                                             */}
      {/* ═══════════���═════════════════════════════���══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`text-center mb-10 ${EASTER_MODE ? 'mt-8' : ''}`}
      >
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">MyCupid</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
          Pra quem e a surpresa?
        </h1>
        <p className="text-white/40 mt-3 text-base">
          A pagina vai ser personalizada pra esse presente.
        </p>
      </motion.div>

      {/* ════════════════════════════════════════════════════ */}
      {/* EASTER PROMO CARD — visible to EVERYONE            */}
      {/* ════════════════════════════════════════��═══════════ */}
      {EASTER_MODE && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="w-full max-w-2xl mb-5"
        >
          <motion.button
            onClick={() => setSelected('pascoa')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 outline-none text-left"
            style={{
              background: selected === 'pascoa'
                ? 'linear-gradient(135deg, rgba(252,228,236,0.12) 0%, rgba(255,182,193,0.08) 50%, rgba(252,228,236,0.12) 100%)'
                : 'linear-gradient(135deg, rgba(45,17,82,0.7) 0%, rgba(26,10,46,0.7) 50%, rgba(45,17,82,0.7) 100%)',
              border: selected === 'pascoa'
                ? '2px solid rgba(255,150,180,0.6)'
                : '2px solid rgba(255,150,180,0.2)',
              boxShadow: selected === 'pascoa'
                ? '0 0 40px rgba(255,150,180,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 0 20px rgba(139,92,246,0.08)',
            }}
          >
            {/* TOP BADGE */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 px-5 py-1.5 text-[10px] font-black rounded-b-xl z-10 tracking-[0.15em] uppercase flex items-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, #ff8aab, #ff5e8a)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(255,100,140,0.3)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" fillOpacity="0.9"/>
              </svg>
              Novidade
            </div>

            {/* Selection check */}
            <AnimatePresence>
              {selected === 'pascoa' && (
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center z-10"
                  style={{ background: 'linear-gradient(135deg, #5ee8b5, #3dd4a0)', boxShadow: '0 0 15px rgba(60,210,160,0.4)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.2 5.8L6.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-5 p-6 pt-9">
              {/* Bunny SVG illustration — kawaii style matching the intro */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <svg width="64" height="88" viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="pcHeadG" cx="40%" cy="35%"><stop offset="0%" stopColor="#fff"/><stop offset="100%" stopColor="#f5edf3"/></radialGradient>
                    <radialGradient id="pcBodyG" cx="40%" cy="30%"><stop offset="0%" stopColor="#fff"/><stop offset="100%" stopColor="#f0e6ee"/></radialGradient>
                    <linearGradient id="pcEarP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffd0e5"/><stop offset="50%" stopColor="#ffb5d0"/><stop offset="100%" stopColor="#ffa2c2"/></linearGradient>
                    <radialGradient id="pcCheek" cx="50%" cy="50%"><stop offset="0%" stopColor="rgba(255,130,170,0.7)"/><stop offset="100%" stopColor="rgba(255,160,185,0)"/></radialGradient>
                    <radialGradient id="pcNose" cx="35%" cy="35%"><stop offset="0%" stopColor="#ffbed0"/><stop offset="100%" stopColor="#ff90ac"/></radialGradient>
                  </defs>
                  {/* Shadow */}
                  <ellipse cx="60" cy="152" rx="22" ry="4" fill="rgba(200,158,175,0.25)"/>
                  {/* Body */}
                  <ellipse cx="60" cy="120" rx="24" ry="18" fill="url(#pcBodyG)" stroke="#cbaabb" strokeWidth="1.8"/>
                  <ellipse cx="60" cy="122" rx="12" ry="9" fill="rgba(255,245,250,0.5)"/>
                  {/* Tail */}
                  <circle cx="38" cy="118" r="6" fill="url(#pcBodyG)" stroke="#cbaabb" strokeWidth="1.2"/>
                  {/* Feet */}
                  <ellipse cx="48" cy="136" rx="8" ry="5" fill="url(#pcBodyG)" stroke="#cbaabb" strokeWidth="1.4"/>
                  <ellipse cx="72" cy="136" rx="8" ry="5" fill="url(#pcBodyG)" stroke="#cbaabb" strokeWidth="1.4"/>
                  {/* Paw pads */}
                  <circle cx="45" cy="135.5" r="1.8" fill="#ff9eb8"/><circle cx="51" cy="135.5" r="1.8" fill="#ff9eb8"/>
                  <circle cx="69" cy="135.5" r="1.8" fill="#ff9eb8"/><circle cx="75" cy="135.5" r="1.8" fill="#ff9eb8"/>
                  {/* Arms */}
                  <ellipse cx="38" cy="112" rx="8" ry="5" fill="url(#pcBodyG)" stroke="#cbaabb" strokeWidth="1.4" transform="rotate(-25,38,112)"/>
                  <ellipse cx="82" cy="112" rx="8" ry="5" fill="url(#pcBodyG)" stroke="#cbaabb" strokeWidth="1.4" transform="rotate(25,82,112)"/>
                  {/* Left ear */}
                  <path d="M45 52 C38 49,35 28,40 12 C42 6,48 5,50 12 C54 28,53 49,45 52Z" fill="url(#pcHeadG)" stroke="#cbaabb" strokeWidth="1.8"/>
                  <path d="M46 46 C41 44,39 30,42 19 C43 14,47 14,48 19 C50 30,49 44,46 46Z" fill="url(#pcEarP)"/>
                  {/* Right ear */}
                  <path d="M75 52 C82 49,85 28,80 12 C78 6,72 5,70 12 C66 28,67 49,75 52Z" fill="url(#pcHeadG)" stroke="#cbaabb" strokeWidth="1.8"/>
                  <path d="M74 46 C79 44,81 30,78 19 C77 14,73 14,72 19 C70 30,71 44,74 46Z" fill="url(#pcEarP)"/>
                  {/* Head */}
                  <ellipse cx="60" cy="70" rx="34" ry="30" fill="url(#pcHeadG)" stroke="#cbaabb" strokeWidth="2"/>
                  {/* Head shine */}
                  <ellipse cx="52" cy="52" rx="16" ry="8" fill="rgba(255,255,255,0.5)" transform="rotate(-8,52,52)"/>
                  {/* Eyes */}
                  <circle cx="48" cy="68" r="5" fill="#1a1018"/>
                  <ellipse cx="46" cy="66" rx="2.5" ry="2.2" fill="#fff" transform="rotate(-20,46,66)"/>
                  <circle cx="50" cy="70" r="1.1" fill="rgba(255,255,255,0.6)"/>
                  <circle cx="72" cy="68" r="5" fill="#1a1018"/>
                  <ellipse cx="70" cy="66" rx="2.5" ry="2.2" fill="#fff" transform="rotate(-20,70,66)"/>
                  <circle cx="74" cy="70" r="1.1" fill="rgba(255,255,255,0.6)"/>
                  {/* Cheeks */}
                  <ellipse cx="38" cy="77" rx="9" ry="6" fill="url(#pcCheek)"/>
                  <ellipse cx="82" cy="77" rx="9" ry="6" fill="url(#pcCheek)"/>
                  <circle cx="35" cy="75" r="1" fill="rgba(255,255,255,0.5)"/>
                  <circle cx="85" cy="75" r="1" fill="rgba(255,255,255,0.5)"/>
                  {/* Nose */}
                  <path d="M60 76 C58 73,55 74,57 76 C57.5 77,60 79,60 79 C60 79,62.5 77,63 76 C65 74,62 73,60 76Z" fill="url(#pcNose)"/>
                  {/* Mouth */}
                  <path d="M55 82 Q60 88,65 82" stroke="#b07888" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                  {/* Heart */}
                  <g transform="translate(90,56) scale(0.5)">
                    <path d="M0 12 C-18 -2,-10-18,0-6 C10-18,18-2,0 12Z" fill="#ff5e8a"/>
                    <ellipse cx="-4" cy="-4" rx="3" ry="1.8" fill="rgba(255,255,255,0.5)" transform="rotate(-30,-4,-4)"/>
                  </g>
                </svg>
                {/* Easter eggs SVG */}
                <div className="flex gap-2 -mt-1">
                  <svg width="18" height="22" viewBox="0 0 18 22">
                    <ellipse cx="9" cy="12" rx="7.5" ry="9.5" fill="url(#pcEgg1)" stroke="#e8a040" strokeWidth="1"/>
                    <defs><linearGradient id="pcEgg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffd06a"/><stop offset="100%" stopColor="#ffb347"/></linearGradient></defs>
                    <path d="M3 10Q9 7 15 10" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeOpacity="0.7"/>
                    <path d="M3.5 14Q9 17 14.5 14" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeOpacity="0.5"/>
                    <circle cx="6" cy="7" r="1.5" fill="#fff" fillOpacity="0.4"/>
                  </svg>
                  <svg width="18" height="22" viewBox="0 0 18 22">
                    <ellipse cx="9" cy="12" rx="7.5" ry="9.5" fill="url(#pcEgg2)" stroke="#d06080" strokeWidth="1"/>
                    <defs><linearGradient id="pcEgg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffaac8"/><stop offset="100%" stopColor="#ff8aab"/></linearGradient></defs>
                    <path d="M3 9Q9 6 15 9" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeOpacity="0.7"/>
                    <path d="M4 13Q9 16 14 13" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeOpacity="0.5"/>
                    <circle cx="11" cy="7" r="1.5" fill="#fff" fillOpacity="0.4"/>
                  </svg>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-black leading-tight" style={{ color: '#ffe8f0' }}>
                  Surpresa de Pascoa
                </h3>
                <p className="text-[12px] mt-1.5 leading-relaxed" style={{ color: 'rgba(255,200,220,0.65)' }}>
                  Coelhinho kawaii interativo &quot;Voce me ama?&quot; com 7 reacoes diferentes + celebracao com coracoes + revelacao cinematografica da sua pagina
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1 text-[11px] font-black rounded-full"
                    style={{ background: 'rgba(255,138,171,0.15)', color: '#ff8aab', border: '1px solid rgba(255,138,171,0.3)' }}>
                    Incluso no template
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="w-full p-3 text-center font-bold text-sm border-t mt-0 transition-all duration-300"
              style={{
                background: selected === 'pascoa' ? 'rgba(255,138,171,0.1)' : 'rgba(255,255,255,0.03)',
                borderColor: selected === 'pascoa' ? 'rgba(255,138,171,0.3)' : 'rgba(255,255,255,0.06)',
                color: selected === 'pascoa' ? '#ff8aab' : 'rgba(255,200,220,0.5)',
              }}
            >
              {selected === 'pascoa' ? 'Template Selecionado!' : 'Clique para selecionar'}
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* OPTIONS GRID                                       */}
      {/* ═══════════���════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl"
      >
        {OPTIONS.map((opt, i) => {
          const isSelected = selected === opt.key;
          return (
            <motion.button
              key={opt.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 + 0.15 }}
              onClick={() => setSelected(opt.key)}
              className="relative flex flex-col items-center justify-center gap-2 rounded-2xl py-5 px-3 cursor-pointer transition-all duration-200 active:scale-95 outline-none"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(109,40,217,0.2) 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: isSelected
                  ? '1.5px solid rgba(168,85,247,0.7)'
                  : '1.5px solid rgba(255,255,255,0.07)',
                boxShadow: isSelected
                  ? '0 0 24px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : 'none',
              }}
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.2 5.8L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="text-3xl leading-none">{opt.emoji}</span>
              <div className="text-center">
                <p className="text-sm font-bold text-white leading-tight">{opt.label}</p>
                <p className="text-[10px] text-white/35 mt-0.5">{opt.sub}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ════════════════════════════════════════════════════ */}
      {/* CTA BUTTON                                         */}
      {/* ═════════════════════════════════════���══════════════ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="mt-8 w-full max-w-lg"
          >
            <motion.button
              onClick={handleConfirm}
              disabled={confirming}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: selected === 'pascoa'
                  ? 'linear-gradient(135deg, #7c3aed, #9333ea, #a855f7)'
                  : 'linear-gradient(135deg, #9333ea, #7c3aed)',
                boxShadow: selected === 'pascoa'
                  ? '0 0 40px rgba(147,51,234,0.5), 0 0 80px rgba(255,180,60,0.15), 0 4px 16px rgba(0,0,0,0.3)'
                  : '0 0 30px rgba(147,51,234,0.5), 0 4px 16px rgba(0,0,0,0.3)',
                opacity: confirming ? 0.7 : 1,
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
              <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>

              {confirming ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : (
                <>
                  <span>{selected === 'pascoa' ? 'Criar surpresa de Pascoa' : 'Criar a surpresa agora'}</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <p className="text-center text-xs text-white/25 mt-3">
              {selected === 'pascoa'
                ? 'Pronto em menos de 5 minutos · inclui intro animada do coelhinho'
                : 'Pronto em menos de 5 minutos · a partir de R$14,90'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
