// ESTE ARQUIVO AGORA É A VERSÃO 2 (V2)
// As páginas antigas usarão PageClientComponentV1.tsx
// Todas as suas novas alterações devem ser feitas aqui.

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/effect-cards';
import 'swiper/css/effect-flip';
import 'swiper/css/effect-cube';
import dynamic from 'next/dynamic';

import Countdown from '@/app/criar/fazer-eu-mesmo/Countdown';
import FallingHearts from '@/components/effects/FallingHearts';
import StarrySky from '@/components/effects/StarrySky';
import MysticVortex from '@/components/effects/MysticVortex';
import FloatingDots from '@/components/effects/FloatingDots';
import { Button } from '@/components/ui/button';
import { View, Puzzle, Loader2, Play, CheckCircle, Instagram, Mail, MessageSquare, Gamepad2, BrainCircuit, ArrowLeft, X, HelpCircle, Clock, AlertTriangle, Share2, Heart, Copy, Download, Pencil, Crown } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import NebulaBackground from '@/components/effects/NebulaBackground';
import NebulosaPoema from '@/components/effects/NebulosaPoema';
import UpgradeModal from './UpgradeModal';
import MysticFlowers from '@/components/effects/MysticFlowers';
import { Skeleton } from '@/components/ui/skeleton';


// Imports Dinâmicos
const YoutubePlayerV2 = dynamic(() => import('@/components/ui/YoutubePlayerV2'), { ssr: false });
const Timeline = dynamic(() => import('@/components/ui/3d-image-gallery'), { ssr: false });
const RealPuzzle = dynamic(() => import('@/components/puzzle/Puzzle'), { ssr: false });
const EasterEggIntro = dynamic(() => import('@/components/easter/EasterEggIntro'), { ssr: false });
const BunnyLoveIntro = dynamic(() => import('@/components/easter/BunnyLoveIntro'), { ssr: false });
const FlowerPoemIntro = dynamic(() => import('@/components/easter/FlowerPoemIntro'), { ssr: false });
const CustomAudioPlayer = dynamic(() => import('@/app/criar/fazer-eu-mesmo/CustomAudioPlayer'), { ssr: false });
const MemoryGame = dynamic(() => import('@/components/memory-game/MemoryGame'), {
    ssr: false,
    loading: () => <Skeleton className="w-full aspect-square" />,
});
const QuizGame = dynamic(() => import('@/components/quiz/QuizGame'), { ssr: false, loading: () => <Skeleton className="w-full aspect-square" />, });
const WordGame = dynamic(() => import('@/components/word-game/WordGame'), {
    ssr: false,
    loading: () => <Skeleton className="w-full aspect-square" />,
});


// Error boundary — if an intro overlay crashes, reveal the page instead of getting stuck
class IntroErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    console.error('Intro overlay crashed:', error);
    this.props.onError();
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

const GalleryImage = React.memo(({ img, index }: { img: any, index: number }) => {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    // Timeout: se a imagem não carregou em 12s, mostra estado de erro em vez
    // de spinner eterno. Cobre caso de URLs de arquivos já deletados do temp/
    // (Cloud Storage retorna 404, mas o Next.js Image às vezes não chama
    // onError pra certos erros de rede). 12s é generoso pro 3G brasileiro.
    useEffect(() => {
      if (status !== 'loading') return;
      const t = setTimeout(() => setStatus((s) => (s === 'loading' ? 'error' : s)), 12000);
      return () => clearTimeout(t);
    }, [status]);

    // URL quebrada conhecida: arquivo foi pra temp/ mas o move pro storage
    // permanente falhou. Em vez de tentar carregar (vai dar 404), já mostra
    // placeholder. Detecta tanto "/temp/" literal quanto "%2Ftemp%2F" encoded
    // (Firebase Storage SDK às vezes retorna URLs percent-encoded).
    const isBroken = typeof img?.url === 'string' && (
        img.url.includes('/temp/') || img.url.includes('%2Ftemp%2F')
    );

    return (
        <div className="relative w-full h-full bg-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
            {status === 'loading' && !isBroken && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                   <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
                </div>
            )}
            {(status === 'error' || isBroken) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-0 text-white/35 text-[11px] text-center px-4 gap-2">
                    <Heart className="w-6 h-6 fill-white/15 stroke-none" />
                    <span>Foto indisponível</span>
                </div>
            )}
            {img?.url && !isBroken && (
                <Image
                    src={img.url}
                    alt={`Imagem da galeria ${index + 1}`}
                    fill
                    className={cn(
                        "object-cover transition-opacity duration-700 ease-in-out z-10",
                        status === 'loaded' ? "opacity-100" : "opacity-0"
                    )}
                    sizes="(max-width: 768px) 90vw, 448px"
                    priority={index === 0}
                    onLoadingComplete={() => setStatus('loaded')}
                    onError={() => setStatus('error')}
                />
            )}
        </div>
    )
});
GalleryImage.displayName = 'GalleryImage';

// ─────────────────────────────────────────────────────────────
// EXPIRY BANNER — mostra quando plano basico está quase expirando
// ─────────────────────────────────────────────────────────────
function ExpiryBanner({ expireAt, isEN = false }: { expireAt: any; isEN?: boolean }) {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const getExpiryDate = () => {
            if (!expireAt) return null;
            if (typeof expireAt === 'object' && (expireAt.seconds || expireAt._seconds)) {
                return new Date((expireAt.seconds || expireAt._seconds) * 1000);
            }
            const d = new Date(expireAt);
            return isNaN(d.getTime()) ? null : d;
        };

        const expiryDate = getExpiryDate();
        if (!expiryDate) return;

        const tick = () => {
            const diff = expiryDate.getTime() - Date.now();
            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft(null);
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ hours, minutes, seconds });
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [expireAt]);

    // Não mostrar se não tiver expiração (plano avançado)
    if (!expireAt) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-[200] px-4 py-3 text-center text-sm font-bold",
                isExpired
                    ? "bg-red-600 text-white"
                    : "bg-amber-500 text-black"
            )}
        >
            {isExpired ? (
                <div className="flex items-center justify-center gap-2">
                    <AlertTriangle size={16} />
                    <span>{isEN ? 'This page has expired.' : 'Esta página expirou.'}</span>
                    <a href={isEN ? 'https://mycupid.net' : 'https://mycupid.com.br'} className="underline ml-2">{isEN ? 'Create new page →' : 'Criar nova página →'}</a>
                </div>
            ) : timeLeft ? (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Clock size={16} className="animate-pulse" />
                    <span>
                        {isEN ? 'This page expires in' : 'Esta página expira em'}{' '}
                        <span className="tabular-nums font-black">
                            {timeLeft.hours > 0 && `${timeLeft.hours}h `}
                            {String(timeLeft.minutes).padStart(2, '0')}m{' '}
                            {String(timeLeft.seconds).padStart(2, '0')}s
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                          // Dispara evento customizado que o UpgradeModal
                          // escuta. Sem redirect — abre o modal in-page pra
                          // user pagar sem sair. Limpa o "dismissed" flag
                          // pra reabrir caso tenha fechado antes.
                          try {
                            sessionStorage.removeItem('upgrade_dismissed_' + (window.location.pathname.split('/p/')[1] || ''));
                          } catch {}
                          window.dispatchEvent(new CustomEvent('mycupid:open-upgrade'));
                        }}
                        className="ml-3 px-3 py-1 bg-black/20 hover:bg-black/30 rounded-full text-xs transition-all cursor-pointer"
                    >
                        {isEN ? 'Make permanent →' : 'Tornar permanente →'}
                    </button>
                </div>
            ) : null}
        </motion.div>
    );
}

export default function PageClientComponent({ pageData }: { pageData: any }) {
  const { user } = useUser();
  // Locale do doc — NÃO do visitante. Garante que uma página criada em BR
  // mostra PT mesmo se aberta pelo `.net` e vice-versa.
  const isEN = pageData.locale === 'en';
  const [showTimeline, setShowTimeline] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // AUTO-HEAL: detecta se o doc tem URLs `temp/` (arquivo ainda não foi
  // movido pra storage final) e chama /api/page-heal pra tentar recuperar em
  // tempo real. Se curou, recarrega a página depois de 2s pra mostrar as
  // URLs novas. Dedup via sessionStorage — evita loop infinito se o heal
  // retornar "nenhum curado" (arquivos já deletados do storage).
  useEffect(() => {
    if (!pageData?.id) return;
    if (typeof window === 'undefined') return;
    const healedKey = `heal_tried_${pageData.id}`;
    if (sessionStorage.getItem(healedKey)) return;

    const docStr = JSON.stringify(pageData);
    const hasTempUrls = docStr.includes('"temp/') || docStr.includes('%2Ftemp%2F');
    if (!hasTempUrls) return;

    sessionStorage.setItem(healedKey, '1');
    fetch(`/api/page-heal?pageId=${encodeURIComponent(pageData.id)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then((res) => {
        if (res?.healed > 0) {
          // Deu certo — recarrega pra pegar URLs novas do Firestore
          setTimeout(() => window.location.reload(), 1500);
        }
      })
      .catch(() => { /* silencioso — cron faz segunda tentativa em até 30min */ });
  }, [pageData?.id]);

  const [isPuzzleComplete, setIsPuzzleComplete] = useState(false);
  
  const [puzzleRevealed, setPuzzleRevealed] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const playerRef = useRef<{ play: () => void }>(null);
  const [musicStarted, setMusicStarted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);

  const handleDownloadQr = async () => {
    setIsDownloadingQr(true);
    try {
      const { downloadQrCard } = await import('@/lib/downloadQrCard');
      await downloadQrCard(pageData.id, pageData.qrCodeDesign || 'classic', `qrcode-${pageData.id}.png`);
    } catch {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`https://mycupid.com.br/p/${pageData.id}`)}`;
      window.open(url, '_blank');
    } finally {
      setIsDownloadingQr(false);
    }
  };

  const handleShareLink = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/p/${pageData.id}` : '';
    const shareText = 'Olha essa página de amor que encontrei 💝';
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: 'MyCupid', text: shareText, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {}
  };

  const isDemoPage = pageData.id === 'WgZtB23Y4OgatZPdrShO';

  const puzzleImageSrc = useMemo(() => {
    if (!pageData.puzzleImage) return null;
    if (typeof pageData.puzzleImage === 'object' && pageData.puzzleImage.url) {
        return pageData.puzzleImage.url;
    }
    if (typeof pageData.puzzleImage === 'string') {
        return pageData.puzzleImage;
    }
    return null;
  }, [pageData.puzzleImage]);

  const hasPuzzle = useMemo(() => {
    if (!pageData.enablePuzzle || !puzzleImageSrc) return false;
    const isBroken = puzzleImageSrc.includes('/temp/') || puzzleImageSrc.includes('%2Ftemp%2F');
    return !isBroken;
  }, [pageData.enablePuzzle, puzzleImageSrc]);

  const hasEasterIntro = useMemo(() => {
    return pageData.introType === 'easter';
  }, [pageData.introType]);

  const hasLoveIntro = useMemo(() => {
    return pageData.introType === 'love';
  }, [pageData.introType]);

  const hasPoemaIntro = useMemo(() => {
    return pageData.introType === 'poema';
  }, [pageData.introType]);

  const hasMemoryGame = useMemo(() => {
    return !!(pageData.enableMemoryGame && pageData.memoryGameImages?.length > 0);
  }, [pageData.enableMemoryGame, pageData.memoryGameImages]);

  const hasQuiz = useMemo(() => !!(pageData.enableQuiz && pageData.quizQuestions?.length > 0), [pageData.enableQuiz, pageData.quizQuestions]);

  const hasWordGame = useMemo(() => !!(pageData.enableWordGame && pageData.wordGameQuestions?.length > 0), [pageData.enableWordGame, pageData.wordGameQuestions]);

  const timelineEventsForDisplay = useMemo(() => {
    if (!Array.isArray(pageData.timelineEvents)) return [];
    return pageData.timelineEvents
      .filter((event: any) => event && event.image && typeof event.image.url === 'string')
      .map((event: any) => {
        let dateObj;
        if (event.date) {
            try {
                let d: Date;
                if (typeof event.date === 'object' && event.date !== null && (event.date.seconds !== undefined || event.date._seconds !== undefined)) {
                    d = new Date((event.date.seconds || event.date._seconds) * 1000);
                } else {
                    d = new Date(event.date);
                }
                if (!isNaN(d.getTime())) dateObj = d;
            } catch {
                dateObj = undefined;
            }
        }
        return {
            id: event.id || Math.random().toString(),
            imageUrl: event.image!.url,
            alt: 'Imagem da linha do tempo',
            title: event.description || '',
            date: dateObj,
        };
      });
  }, [pageData.timelineEvents]);
  
  const hasValidTimelineEvents = timelineEventsForDisplay.length > 0;

  const handleReveal = useCallback(() => {
    setShowExplosion(true);
    setPuzzleRevealed(true);
    try { playerRef.current?.play(); } catch {}
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (!hasPuzzle && !hasEasterIntro && !hasLoveIntro && !hasPoemaIntro) {
      setPuzzleRevealed(true);
    }
  }, [hasPuzzle, hasEasterIntro, hasLoveIntro, hasPoemaIntro]);

  useEffect(() => {
    if (isPuzzleComplete) {
      const timer = setTimeout(() => { handleReveal(); }, 700);
      return () => clearTimeout(timer);
    }
  }, [isPuzzleComplete, handleReveal]);
  
  const targetDateIso = useMemo(() => {
    if (!pageData.specialDate) return null;
    const d = pageData.specialDate;
    try {
        let date: Date | null = null;
        if (d && typeof d === 'object') {
            const seconds = (d as any)._seconds || (d as any).seconds;
            if (seconds) date = new Date(seconds * 1000);
        } else if (d) {
            date = new Date(d);
        }
        if (date && !isNaN(date.getTime())) return date.toISOString();
    } catch {
        return null;
    }
    return null;
  }, [pageData.specialDate]);

  if (!isClient) return null;

  const isFormattingArray = Array.isArray(pageData.messageFormatting);

  return (
    <div className="min-h-screen w-full bg-background relative overflow-x-hidden">
      
      {/* BANNER DE EXPIRAÇÃO — plano basico próximo de expirando */}
      {!isDemoPage && pageData.plan === 'basico' && <ExpiryBanner expireAt={pageData.expireAt} isEN={isEN} />}

      {/* UPSELL — popup de upgrade para permanente */}
      {!isDemoPage && pageData.plan === 'basico' && pageData.expireAt && (
        <UpgradeModal pageId={pageData.id} expireAt={pageData.expireAt} />
      )}
      
      <AnimatePresence>
        {showExplosion && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            onAnimationComplete={() => setShowExplosion(false)}
            className="fixed inset-0 z-[999] pointer-events-none bg-black"
          />
        )}
      </AnimatePresence>
      
      <header className="top-0 left-0 w-full pt-8 pb-4 flex justify-center z-30 relative pointer-events-none">
        <Image
          src="https://i.imgur.com/3jk3dFB.png"
          alt="MyCupid Logo"
          width={600}
          height={171}
          className="w-auto h-28 object-contain"
          priority
        />
      </header>
      
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none translate-z-0">
        {puzzleRevealed && pageData.backgroundAnimation === 'falling-hearts' && <FallingHearts count={30} color={pageData.heartColor} />}
        {puzzleRevealed && pageData.backgroundAnimation === 'starry-sky' && <StarrySky />}
        {puzzleRevealed && pageData.backgroundAnimation === 'nebula' && <NebulaBackground />}
        {puzzleRevealed && pageData.backgroundAnimation === 'nebulosa' && <NebulosaPoema />}
        {puzzleRevealed && pageData.backgroundAnimation === 'mystic-flowers' && <MysticFlowers />}
        {puzzleRevealed && pageData.backgroundAnimation === 'mystic-vortex' && <MysticVortex />}
        {puzzleRevealed && pageData.backgroundAnimation === 'floating-dots' && <FloatingDots />}
      </div>

      <motion.main 
        className="relative z-10 w-full min-h-screen pb-24"
        initial={false}
        animate={{ 
          opacity: puzzleRevealed ? 1 : 0.4, 
          filter: puzzleRevealed ? 'blur(0px)' : 'blur(15px)',
        }}
        transition={{ duration: 1.0, ease: "easeOut" }}
      >
        <div className="w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center gap-y-16 relative z-20">
          
          <div className="space-y-8 text-center mt-4">
            <h1 className="text-4xl md:text-7xl font-handwriting leading-tight drop-shadow-lg px-2" style={{ color: pageData.titleColor }}>
              {pageData.title}
            </h1>
            <p className={cn("text-white/90 whitespace-pre-wrap text-base md:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-md px-4", 
                pageData.messageFontSize,
                isFormattingArray && pageData.messageFormatting.includes("bold") && "font-bold",
                isFormattingArray && pageData.messageFormatting.includes("italic") && "italic",
                isFormattingArray && pageData.messageFormatting.includes("strikethrough") && "line-through"
              )}>
              {pageData.message}
            </p>
          </div>

          {targetDateIso && (
            <div className="w-full">
                <Countdown targetDate={targetDateIso} style={pageData.countdownStyle} color={pageData.countdownColor} />
            </div>
          )}
          
          {hasValidTimelineEvents && (
            <div className="text-center w-full">
                <Button 
                    type="button"
                    onClick={() => setShowTimeline(true)} 
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-8 py-6 text-lg rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95 w-full max-w-xs"
                >
                    <View className="mr-2 h-5 w-5" /> {isEN ? 'Our Timeline' : 'Nossa Linha do Tempo'}
                </Button>
            </div>
          )}

          {pageData.galleryImages?.length > 0 && (() => {
            const style = (pageData.galleryStyle || 'coverflow').toLowerCase();
            const isSingleSlide = style === 'cards' || style === 'flip' || style === 'cube';
            return (
              <div className="w-full max-w-[90vw] md:max-w-md mx-auto relative z-10">
                <Swiper
                  effect={style as any}
                  grabCursor={true}
                  centeredSlides={true}
                  slidesPerView={isSingleSlide ? 1 : 'auto'}
                  spaceBetween={isSingleSlide ? 0 : 30}
                  autoplay={{ delay: 4000, disableOnInteraction: false }}
                  coverflowEffect={{ rotate: 25, stretch: 0, depth: 120, modifier: 1, slideShadows: true }}
                  cardsEffect={{ slideShadows: true, perSlideOffset: 8, perSlideRotate: 2, rotate: true }}
                  flipEffect={{ slideShadows: true, limitRotation: true }}
                  cubeEffect={{ shadow: true, slideShadows: true, shadowOffset: 30, shadowScale: 0.88 }}
                  pagination={{ clickable: true, dynamicBullets: true }}
                  modules={[EffectCoverflow, Pagination, EffectCards, EffectFlip, EffectCube, Autoplay]}
                  className="mySwiper w-full aspect-square !overflow-visible py-8"
                >
                  {pageData.galleryImages.map((img: any, i: number) => (
                    <SwiperSlide key={img.url || i} className='!w-full !h-full rounded-2xl'>
                        <GalleryImage img={img} index={i} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            );
          })()}
          
          {(hasMemoryGame || hasQuiz || hasWordGame) && (
              <div className="text-center w-full">
                  <Button 
                      type="button"
                      onClick={() => setShowGames(true)} 
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-8 py-6 text-lg rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95 w-full max-w-xs"
                  >
                      <Gamepad2 className="mr-2 h-5 w-5" /> {isEN ? "Let's Play?" : 'Vamos Jogar?'}
                  </Button>
              </div>
          )}

          <div className="w-full max-w-[95vw] md:max-w-sm z-10 mt-8 mb-8 flex flex-col items-center gap-3">
             {pageData.musicOption === 'youtube' && pageData.youtubeUrl && (
                <YoutubePlayerV2
                  ref={playerRef}
                  url={pageData.youtubeUrl}
                  songName={pageData.songName}
                  artistName={pageData.artistName}
                  volume={0.6}
                  onMusicActive={() => setMusicStarted(true)}
                />
             )}

             {pageData.audioRecording?.url && (
                <div className="w-full">
                    <CustomAudioPlayer src={pageData.audioRecording.url} />
                </div>
             )}

             {/* Fallback: se a música não tocou automaticamente após o puzzle */}
             {puzzleRevealed && !musicStarted && pageData.musicOption === 'youtube' && pageData.youtubeUrl && (
                <button
                  onClick={() => { playerRef.current?.play(); }}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border border-pink-400/30 text-white text-sm font-semibold hover:from-pink-500/30 hover:to-fuchsia-500/30 transition-all animate-pulse shadow-lg shadow-pink-500/10"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                  {isEN ? 'Tap to start the music' : 'Toque para ativar a música'}
                </button>
             )}
          </div>

        </div>

        {/* ── SHARE CTA (com Edit no topo pro VIP) ──────────── */}
        <div className="relative z-10 w-full max-w-md mx-auto mt-8 px-4">
            {(() => {
              // Banner de edição aparece pra QUALQUER visitante em página VIP.
              // A autenticação real (verificação do email do dono) acontece
              // no /editar/[pageId]. Assim o dono consegue editar em QUALQUER
              // device (celular novo, trocou navegador) só lembrando do email.
              // Aceita 'vip' (chat) e 'avancado' (wizard /criar) — ambos top-tier.
              const canEdit = !isDemoPage && (pageData.plan === 'vip' || pageData.plan === 'avancado');
              return (
                <div className="relative rounded-2xl p-6 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-purple-900/30 border border-purple-500/20 backdrop-blur-sm text-center">
                    {/* Edit panel (VIP + dono): banner dourado no topo do card, separado
                        do resto por divider — visualmente destaca "benefício exclusivo"
                        sem poluir a UI com card separado. */}
                    {canEdit && (
                      <>
                        <Link
                          href={`/editar/${pageData.id}`}
                          className="group relative -mx-6 -mt-6 mb-5 block overflow-hidden rounded-t-2xl p-4 active:scale-[0.99] transition-transform text-left"
                          style={{
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.22), rgba(236,72,153,0.20), rgba(168,85,247,0.22))',
                            borderBottom: '1px solid rgba(251,191,36,0.3)',
                          }}
                        >
                          {/* shimmer animado no hover */}
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                          <div className="relative flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center shrink-0 shadow-md ring-1 ring-white/30">
                              <Pencil className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Crown className="w-3 h-3 text-amber-300 shrink-0" />
                                <span className="text-[9.5px] uppercase tracking-[0.2em] text-amber-200 font-bold">
                                  {isEN ? 'VIP benefit' : 'Benefício VIP'}
                                </span>
                              </div>
                              <div className="text-[15px] font-black text-white leading-tight mt-0.5">
                                {isEN ? 'Edit my page' : 'Editar minha página'}
                              </div>
                              <div className="text-[11.5px] text-white/70 mt-0.5 leading-snug">
                                {isEN ? 'Change anything, anytime' : 'Mude qualquer coisa, a qualquer hora'}
                              </div>
                            </div>
                            <div className="text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14m-6-6 6 6-6 6" />
                              </svg>
                            </div>
                          </div>
                        </Link>
                      </>
                    )}

                    <div className="flex items-center justify-center mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                            <Heart className="w-6 h-6 text-white" fill="white" />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{isEN ? 'Loved this page?' : 'Gostou dessa página?'}</h3>
                    <p className="text-xs text-gray-400 mb-4">{isEN ? 'Create yours and surprise someone special too' : 'Crie a sua e surpreenda alguém especial também'}</p>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleShareLink}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white text-sm bg-white/10 hover:bg-white/15 border border-white/10 transition-all active:scale-95"
                        >
                            {linkCopied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                            {linkCopied ? (isEN ? 'Link copied!' : 'Link copiado!') : (isEN ? 'Share this page' : 'Compartilhar esta página')}
                        </button>
                        <button
                            onClick={handleDownloadQr}
                            disabled={isDownloadingQr}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium text-zinc-500 hover:text-zinc-300 text-xs transition-colors disabled:opacity-60"
                        >
                            {isDownloadingQr ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                            {isDownloadingQr ? (isEN ? 'Generating...' : 'Gerando...') : (isEN ? 'Download QR Code' : 'Baixar QR Code')}
                        </button>
                        <a
                            href={isEN ? 'https://mycupid.net/chat' : 'https://mycupid.com.br/criar'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-white text-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-purple-900/40"
                        >
                            <Heart className="w-4 h-4" fill="white" />
                            {isEN ? 'Create my page' : 'Criar minha página'}
                        </a>
                    </div>
                </div>
              );
            })()}
        </div>

        <footer className="relative z-10 w-full mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">Siga-nos</p>
            <div className="flex items-center justify-center gap-4">
            <a href="https://www.instagram.com/mycupid.oficial/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', boxShadow: '0 4px 15px rgba(225,48,108,0.3)' }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://api.whatsapp.com/message/E3AOU6LPGW7GO1?autoload=1&app_absent=0" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{ background: '#25D366', boxShadow: '0 4px 15px rgba(37,211,102,0.3)' }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <a href="mailto:contatomycupid@gmail.com" aria-label="Email"
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', boxShadow: '0 4px 15px rgba(118,75,162,0.3)' }}>
                <Mail size={22} className="text-white" />
            </a>
            </div>
            <p className="text-xs text-muted-foreground/50 mt-8">
              Criado com <a href="https://mycupid.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">MyCupid</a>
            </p>
        </footer>
      </motion.main>

      <AnimatePresence>
        {showTimeline && (
          <Timeline events={timelineEventsForDisplay} onClose={() => setShowTimeline(false)} />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showGames && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-lg"
          >
            <AnimatePresence mode="wait">
              {activeGame === null ? (
                <motion.div
                  key="game-selection"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-2xl text-center"
                >
                  <h2 className="text-4xl font-bold font-headline text-white mb-8">Escolha um Jogo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hasMemoryGame && (
                        <div
                        onClick={() => setActiveGame('memory')}
                        className="card-glow p-6 rounded-2xl flex flex-col items-center gap-4 cursor-pointer text-center bg-white/5 border-white/10"
                        >
                        <BrainCircuit className="w-10 h-10 text-primary" />
                        <h3 className="font-bold text-lg text-white">Jogo da Memória</h3>
                        <p className="text-sm text-muted-foreground">Encontre os pares de suas fotos especiais.</p>
                        </div>
                    )}
                    {hasQuiz && (
                        <div
                        onClick={() => setActiveGame('quiz')}
                        className="card-glow p-6 rounded-2xl flex flex-col items-center gap-4 cursor-pointer text-center bg-white/5 border-white/10"
                        >
                        <HelpCircle className="w-10 h-10 text-primary" />
                        <h3 className="font-bold text-lg text-white">Quiz do Casal</h3>
                        <p className="text-sm text-muted-foreground">Crie um quiz divertido sobre vocês.</p>
                        </div>
                    )}
                    {hasWordGame && (
                        <div
                        onClick={() => setActiveGame('word')}
                        className="card-glow p-6 rounded-2xl flex flex-col items-center gap-4 cursor-pointer text-center bg-white/5 border-white/10"
                        >
                        <span className="text-5xl">💘</span>
                        <h3 className="text-xl font-bold text-white">Adivinhe a Palavra</h3>
                        <p className="text-sm text-muted-foreground">Descubra as respostas secretas letra por letra.</p>
                        </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="active-game-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                  <Button
                    variant="ghost"
                    onClick={() => setActiveGame(null)}
                    className="absolute top-4 left-4 text-white z-20"
                  >
                    <ArrowLeft className="mr-2" /> Voltar
                  </Button>
                  {activeGame === 'memory' && pageData.memoryGameImages && <MemoryGame images={pageData.memoryGameImages.map((img: any) => img.url)} />}
                  {activeGame === 'quiz' && pageData.quizQuestions && <QuizGame questions={pageData.quizQuestions} />}
                  {activeGame === 'word' && pageData.wordGameQuestions && <WordGame questions={pageData.wordGameQuestions} onExit={() => setActiveGame(null)} />}
                </motion.div>
              )}
            </AnimatePresence>
             <Button
                variant="ghost"
                size="icon"
                onClick={() => { setShowGames(false); setActiveGame(null); }}
                className="absolute top-4 right-4 text-white rounded-full bg-white/10 z-20"
              >
                <X className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!puzzleRevealed && hasPuzzle && puzzleImageSrc && (
          <motion.div
            key="puzzle-overlay-layer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-sm overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-50">
                {pageData.puzzleBackgroundAnimation === 'starry-sky' && <StarrySky />}
                {pageData.puzzleBackgroundAnimation === 'nebula' && <NebulaBackground />}
                {pageData.puzzleBackgroundAnimation === 'mystic-vortex' && <MysticVortex />}
                {pageData.puzzleBackgroundAnimation === 'floating-dots' && <FloatingDots />}
            </div>
            <div className="relative z-10 w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="text-center space-y-4">
                  <div className="inline-block p-4 bg-primary/10 rounded-full border-2 border-primary/20 shadow-lg shadow-primary/20">
                      <Puzzle className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                      <h2 className="text-4xl md:text-5xl font-bold text-white font-headline tracking-tighter">
                          Um Enigma de{' '}
                          <span className="gradient-text">
                              Amor
                          </span>
                      </h2>
                      <p className="text-white/70 text-sm max-w-xs mx-auto">
                          Resolva o quebra-cabeça para revelar uma surpresa especial.
                      </p>
                  </div>
              </div>

               <AnimatePresence mode="wait">
                {!isPuzzleComplete ? (
                   <motion.div key="puzzle-view" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <div className="p-2 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
                        <RealPuzzle
                            imageSrc={puzzleImageSrc}
                            onReveal={() => {
                              try { playerRef.current?.play(); } catch {}
                              setIsPuzzleComplete(true);
                            }}
                        />
                        </div>
                   </motion.div>
                ) : (
                    <motion.div
                        key="reveal-button-view"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                        className="flex flex-col items-center gap-6 pt-4"
                    >
                        <div className="p-4 bg-green-500/10 rounded-full border-2 border-green-500/20">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Desafio Concluído!</h3>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <IntroErrorBoundary onError={handleReveal}>
        <AnimatePresence>
          {!puzzleRevealed && hasEasterIntro && (
            <motion.div
              key="easter-overlay-layer"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="fixed inset-0 z-[100]"
            >
              <EasterEggIntro onReveal={handleReveal} />
            </motion.div>
          )}
        </AnimatePresence>
      </IntroErrorBoundary>

      <IntroErrorBoundary onError={handleReveal}>
        <AnimatePresence>
          {!puzzleRevealed && hasLoveIntro && (
            <motion.div
              key="love-overlay-layer"
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '-100%' }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 z-[100]"
            >
              <BunnyLoveIntro onReveal={handleReveal} />
            </motion.div>
          )}
        </AnimatePresence>
      </IntroErrorBoundary>

      <IntroErrorBoundary onError={handleReveal}>
        <AnimatePresence>
          {!puzzleRevealed && hasPoemaIntro && (
            <motion.div
              key="poema-overlay-layer"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="fixed inset-0 z-[100]"
              style={{ background: '#0a0510' }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <FlowerPoemIntro onReveal={handleReveal} gender={(pageData as any).introGender || 'fem'} fontFamily={(pageData as any).introFont || 'cormorant'} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </IntroErrorBoundary>
    </div>
  );
}
