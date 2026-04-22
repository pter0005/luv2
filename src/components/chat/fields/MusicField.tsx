'use client';

import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import Image from 'next/image';
import { Check, Link2, Loader2, Music, Search, SkipForward, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { searchMusic, type MusicSearchResult } from '@/app/chat/music-search-action';
import type { PageData } from '@/lib/wizard-schema';

type Mode = 'search' | 'paste';

function isLikelyYouTubeUrl(v: string) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(v.trim());
}

// Busca título/canal via oEmbed público do YouTube (sem API key)
async function fetchYoutubeMeta(url: string): Promise<{ title?: string; author?: string } | null> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!r.ok) return null;
    const data = await r.json();
    return { title: data?.title, author: data?.author_name };
  } catch { return null; }
}

export default function MusicField() {
  const { control, setValue, watch } = useFormContext<PageData>();
  const option = watch('musicOption');
  const currentUrl = watch('youtubeUrl') ?? '';

  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicSearchResult[]>([]);
  const [selected, setSelected] = useState<MusicSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Se já existe URL salva, marca option pra 'youtube' automaticamente
  useEffect(() => {
    if (currentUrl && option !== 'youtube') {
      setValue('musicOption', 'youtube', { shouldDirty: false });
    }
  }, [currentUrl, option, setValue]);

  // Busca com debounce de 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    // Se parece link direto, pula a busca — usuário vai colar
    if (isLikelyYouTubeUrl(q)) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        setError(null);
        const res = await searchMusic(q);
        if (res.error) {
          setError(res.error);
          setResults([]);
        } else {
          setResults(res.results || []);
        }
      });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const pickResult = useCallback(
    (r: MusicSearchResult) => {
      setSelected(r);
      setValue('musicOption', 'youtube', { shouldDirty: true });
      setValue('youtubeUrl', r.url, { shouldDirty: true, shouldValidate: true });
      // Salva título e "artista" (canal do YT) pra aparecer no player da página
      setValue('songName', r.title, { shouldDirty: true });
      setValue('artistName', r.channel, { shouldDirty: true });
    },
    [setValue]
  );

  const clearSelection = useCallback(() => {
    setSelected(null);
    setValue('youtubeUrl', '', { shouldDirty: true });
    setValue('musicOption', 'none', { shouldDirty: true });
    setValue('songName', '', { shouldDirty: true });
    setValue('artistName', '', { shouldDirty: true });
  }, [setValue]);

  const skip = useCallback(() => {
    setSelected(null);
    setQuery('');
    setResults([]);
    setValue('youtubeUrl', '', { shouldDirty: true });
    setValue('musicOption', 'none', { shouldDirty: true });
    setValue('songName', '', { shouldDirty: true });
    setValue('artistName', '', { shouldDirty: true });
  }, [setValue]);

  // Estado: música já escolhida
  if (currentUrl && (selected || option === 'youtube')) {
    const label = selected?.title || currentUrl;
    const thumb = selected?.thumbnail;
    const channel = selected?.channel;
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/10 ring-2 ring-purple-400/50 p-3 flex items-center gap-3 shadow-[0_8px_28px_-12px_rgba(168,85,247,0.5)]">
          {thumb ? (
            <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black/30">
              <Image src={thumb} alt="" fill className="object-cover" sizes="56px" unoptimized />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-lg bg-purple-500/20 ring-1 ring-purple-400/40 flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 text-purple-200" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-green-300">Música selecionada</span>
            </div>
            <div className="text-sm font-semibold text-white truncate">{label}</div>
            {channel && <div className="text-[11px] text-white/55 truncate">{channel}</div>}
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="shrink-0 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white flex items-center justify-center transition"
            aria-label="Remover música"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={skip}
          className="w-full text-[12px] text-white/55 hover:text-white/80 transition"
        >
          Prefiro trocar ou pular a música
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toggle: buscar vs colar link */}
      <div className="flex gap-1.5 p-1 rounded-full bg-white/[0.04] ring-1 ring-white/10 w-fit mx-auto">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={cn(
            'px-3 py-1.5 rounded-full text-[12px] font-medium transition flex items-center gap-1.5',
            mode === 'search' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
          )}
        >
          <Search className="w-3 h-3" /> Buscar
        </button>
        <button
          type="button"
          onClick={() => setMode('paste')}
          className={cn(
            'px-3 py-1.5 rounded-full text-[12px] font-medium transition flex items-center gap-1.5',
            mode === 'paste' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
          )}
        >
          <Link2 className="w-3 h-3" /> Colar link
        </button>
      </div>

      {mode === 'search' ? (
        <>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome da música ou artista..."
              className="h-12 pl-10 pr-10 bg-white/[0.04] ring-1 ring-white/10 text-white placeholder:text-white/35"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 animate-spin" />
            )}
          </div>

          {error && (
            <div className="rounded-lg p-2.5 bg-red-500/10 ring-1 ring-red-400/30 text-[12px] text-red-200">
              {error}
            </div>
          )}

          {!error && results.length > 0 && (
            <div className="space-y-1.5">
              {results.map((r) => (
                <button
                  key={r.url}
                  type="button"
                  onClick={() => pickResult(r)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] ring-1 ring-white/10 hover:ring-purple-400/50 transition text-left"
                >
                  <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-black/30">
                    <Image src={r.thumbnail} alt="" fill className="object-cover" sizes="48px" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white truncate">{r.title}</div>
                    <div className="text-[11px] text-white/50 truncate">
                      {r.channel}
                      {r.duration && <span className="text-white/35"> · {r.duration}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!error && !isSearching && query.trim().length >= 2 && results.length === 0 && !isLikelyYouTubeUrl(query) && (
            <div className="text-[12px] text-center text-white/45 py-4">
              Nenhum resultado. Tenta outro termo ou cola o link direto.
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="text-[12px] text-center text-white/40 py-2">
              Ex: <span className="text-white/60">"Evidências Chitãozinho", "Iris Goo Goo Dolls"</span>
            </div>
          )}
        </>
      ) : (
        <Controller
          control={control}
          name="youtubeUrl"
          render={({ field }) => (
            <div className="space-y-2">
              <Input
                {...field}
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e);
                  const v = e.target.value.trim();
                  if (v) {
                    setValue('musicOption', 'youtube', { shouldDirty: true });
                    if (isLikelyYouTubeUrl(v)) {
                      fetchYoutubeMeta(v).then((meta) => {
                        if (meta?.title) setValue('songName', meta.title, { shouldDirty: true });
                        if (meta?.author) setValue('artistName', meta.author, { shouldDirty: true });
                      });
                    }
                  }
                }}
                placeholder="https://youtube.com/watch?v=..."
                className="h-12 bg-white/[0.04] ring-1 ring-white/10 text-white placeholder:text-white/35"
                autoFocus
              />
              <p className="text-[11.5px] text-white/45 text-center">
                Cola o link do YouTube da música que vocês amam
              </p>
            </div>
          )}
        />
      )}

      <button
        type="button"
        onClick={skip}
        className="w-full h-10 rounded-lg text-[12px] text-white/55 hover:text-white/85 hover:bg-white/[0.04] transition flex items-center justify-center gap-1.5"
      >
        <SkipForward className="w-3.5 h-3.5" /> Pular, sem música
      </button>
    </div>
  );
}
