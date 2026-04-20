'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { CheckCircle, Gem, Loader2, Mic, StopCircle, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { uploadFile } from '@/lib/upload';
import { useToast } from '@/hooks/use-toast';
import type { PageData } from '@/lib/wizard-schema';

export default function VoiceField() {
  const { control, setValue } = useFormContext<PageData>();
  const firebase = useFirebase();
  const { toast } = useToast();
  const audioRecording = useWatch({ control, name: 'audioRecording' });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading' | 'recorded'>(
    audioRecording?.url ? 'recorded' : 'idle'
  );
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const upload = async (blob: Blob) => {
    let activeUser = firebase.user;
    if (!activeUser && firebase.auth) {
      const cred = await signInAnonymously(firebase.auth);
      activeUser = cred.user;
    }
    if (!activeUser) {
      setStatus('idle');
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar. Tente de novo.' });
      return;
    }
    setStatus('uploading');
    try {
      const data = await uploadFile(firebase.storage, activeUser.uid, blob, 'audio');
      setValue('audioRecording', data, { shouldDirty: true, shouldValidate: true });
      setStatus('recorded');
      toast({ title: 'Mensagem salva 💝', description: 'Sua voz vai emocionar demais.' });
    } catch {
      setStatus('idle');
      toast({ variant: 'destructive', title: 'Erro no upload' });
    }
  };

  const start = async () => {
    if (status === 'recording' || status === 'uploading') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      let mr: MediaRecorder;
      try {
        mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      } catch {
        mr = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const mime = mr.mimeType || 'audio/webm;codecs=opus';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        audioChunksRef.current = [];
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        upload(blob);
      };
      mr.start();
      setStatus('recording');
      setElapsed(0);
      timerRef.current = window.setInterval(() => {
        setElapsed((p) => {
          if (p >= 59) { stop(); return 60; }
          return p + 1;
        });
      }, 1000);
    } catch {
      toast({ variant: 'destructive', title: 'Microfone bloqueado', description: 'Libere o mic nas permissões.' });
    }
  };

  const stop = () => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  };

  const remove = () => {
    setValue('audioRecording', undefined, { shouldDirty: true, shouldValidate: true });
    setStatus('idle');
    setElapsed(0);
  };

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl ring-2 ring-pink-400/50 bg-gradient-to-br from-pink-500/15 via-fuchsia-500/10 to-rose-500/10 p-4 shadow-[0_12px_40px_-12px_rgba(236,72,153,0.55)]">
        <div className="flex items-start gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-pink-400/40 shrink-0">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Gem className="w-3 h-3 text-fuchsia-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-200">Feature especial</span>
            </div>
            <p className="text-xs text-white/80 leading-snug">
              Imagina a cara dela(e) ao <em>ouvir sua voz</em> dizendo o que sente 🥹 até 60s.
            </p>
          </div>
        </div>

        {status === 'idle' && (
          <button
            type="button"
            onClick={start}
            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-4 py-3 text-white text-sm font-bold shadow-md shadow-pink-400/40 transition active:scale-95"
          >
            <span className="inline-flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              Gravar minha mensagem
            </span>
          </button>
        )}

        {status === 'recording' && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/15 ring-1 ring-red-500/40">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              <span className="font-mono text-lg font-bold tabular-nums text-white">{mmss}</span>
              <span className="text-[10px] uppercase tracking-wider text-red-300">Gravando</span>
            </div>
            <Button type="button" onClick={stop} variant="destructive" size="sm" className="w-full">
              <StopCircle className="mr-1.5 h-4 w-4" /> Parar
            </Button>
          </div>
        )}

        {status === 'uploading' && (
          <div className="flex items-center justify-center gap-2 py-4 rounded-xl bg-white/[0.06] ring-1 ring-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-pink-300" />
            <span className="text-xs font-medium text-white">Salvando…</span>
          </div>
        )}

        {status === 'recorded' && audioRecording?.url && (
          <div className="space-y-2">
            <div className="rounded-xl bg-white/[0.06] ring-1 ring-pink-400/30 p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs font-semibold text-green-300">Mensagem gravada</span>
              </div>
              <audio src={audioRecording.url} controls className="w-full h-8" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={start}>
                <Mic className="mr-1 h-3.5 w-3.5" /> Gravar de novo
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={remove} className="text-muted-foreground hover:text-destructive">
                <Trash className="mr-1 h-3.5 w-3.5" /> Remover
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-white/50">Opcional — pode pular tranquilo</p>
    </div>
  );
}
