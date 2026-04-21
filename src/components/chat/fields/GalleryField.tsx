'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import Image from 'next/image';
import { Camera, ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { uploadFile } from '@/lib/upload';
import { compressImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import { MAX_GALLERY_IMAGES, type PageData } from '@/lib/wizard-schema';

type PendingUpload = {
  id: string;
  previewUrl: string;
  progress: number; // 0-1
};

export default function GalleryField() {
  const { control } = useFormContext<PageData>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'galleryImages' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { user } = useUser();
  const firebase = useFirebase();
  const { toast } = useToast();

  const totalCount = fields.length + pending.length;
  const remainingSlots = MAX_GALLERY_IMAGES - totalCount;

  // Limpa object URLs quando pending esvazia — evita memory leak
  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;

    const slots = MAX_GALLERY_IMAGES - fields.length - pending.length;
    if (slots <= 0) {
      toast({ variant: 'destructive', title: 'Limite atingido', description: `Máximo de ${MAX_GALLERY_IMAGES} fotos.` });
      return;
    }
    const selected = files.slice(0, slots);
    if (files.length > selected.length) {
      toast({
        title: `${selected.length} de ${files.length} fotos`,
        description: `Limite de ${MAX_GALLERY_IMAGES} atingido — o resto foi ignorado.`,
      });
    }

    let activeUser = user;
    if (!activeUser && firebase.auth) {
      try {
        const cred = await signInAnonymously(firebase.auth);
        activeUser = cred.user;
      } catch {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível iniciar a sessão.' });
        return;
      }
    }
    if (!activeUser) return;

    // Cria entradas "pending" com preview local — UX instantânea
    const batch: PendingUpload[] = selected.map((file) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      progress: 0,
    }));
    setPending((prev) => [...prev, ...batch]);

    // Upload em paralelo (limitado por batch pra não saturar rede do celular)
    const CONCURRENCY = 3;
    let failed = 0;

    // Upload um arquivo e RETORNA o resultado — não mexe no form aqui.
    // Assim a gente pode juntar a chunk toda e fazer um único append(arr)
    // por chunk, evitando race condition do useFieldArray (appends paralelos
    // podem perder itens porque cada um lê o array atual).
    const uploadOne = async (file: File, entry: PendingUpload) => {
      try {
        // Tenta comprimir — mas se o browser não conseguir (HEIC do iPhone,
        // TIFF, etc), manda o arquivo original pra não travar o upload.
        let toUpload: File | Blob = file;
        try {
          toUpload = await compressImage(file, 1600, 0.82);
        } catch (err) {
          console.warn('[gallery] compressImage falhou, enviando original', err);
        }
        setPending((prev) => prev.map((p) => (p.id === entry.id ? { ...p, progress: 0.5 } : p)));
        const uploaded = await uploadFile(firebase.storage, activeUser!.uid, toUpload, 'gallery');
        return { ok: true as const, uploaded, entry };
      } catch (err) {
        console.error('[gallery] upload falhou', err);
        return { ok: false as const, entry };
      }
    };

    for (let i = 0; i < selected.length; i += CONCURRENCY) {
      const chunk = selected.slice(i, i + CONCURRENCY);
      const chunkEntries = batch.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map((file, j) => uploadOne(file, chunkEntries[j])));

      const successful = results.filter((r) => r.ok).map((r) => (r as any).uploaded);
      const settledIds = new Set(results.map((r) => r.entry.id));
      failed += results.filter((r) => !r.ok).length;

      // Append sequencial: um por vez pra não disputar o estado do useFieldArray
      for (const up of successful) append(up);

      setPending((prev) => {
        prev.forEach((p) => { if (settledIds.has(p.id)) URL.revokeObjectURL(p.previewUrl); });
        return prev.filter((p) => !settledIds.has(p.id));
      });
    }

    if (failed > 0) {
      toast({
        variant: 'destructive',
        title: `${failed} ${failed === 1 ? 'foto falhou' : 'fotos falharam'}`,
        description: 'Tenta mandar de novo as que faltaram.',
      });
    }
  }, [fields.length, pending.length, user, firebase, append, toast]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(Array.from(files));
    if (e.target) e.target.value = '';
  }, [processFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length) processFiles(files);
  }, [processFiles]);

  // Drag & drop entre fotos pra reordenar
  const handleReorderStart = (idx: number) => setDragIndex(idx);
  const handleReorderOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
  };
  const handleReorderDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) { setDragIndex(null); return; }
    move(dragIndex, idx);
    setDragIndex(null);
  };

  return (
    <div className="space-y-3">
      {(fields.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-3 gap-2">
          {fields.map((f, i) => {
            const url = (f as any).url as string;
            const isBeingDragged = dragIndex === i;
            return (
              <div
                key={f.id}
                draggable
                onDragStart={() => handleReorderStart(i)}
                onDragOver={(e) => handleReorderOver(e, i)}
                onDrop={(e) => handleReorderDrop(e, i)}
                onDragEnd={() => setDragIndex(null)}
                className={cn(
                  'group relative aspect-square rounded-xl overflow-hidden bg-white/[0.05] ring-1 ring-white/10 transition cursor-move',
                  isBeingDragged && 'opacity-40 scale-95',
                  dragIndex !== null && !isBeingDragged && 'ring-2 ring-pink-400/40'
                )}
              >
                <Image src={url} alt="" fill className="object-cover" sizes="160px" />
                {/* Badge de posição — mostra ordem */}
                <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] font-bold flex items-center justify-center backdrop-blur">
                  {i + 1}
                </div>
                {/* Botão remover */}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-red-500/90 text-white rounded-full p-1 transition opacity-80 hover:opacity-100 active:scale-95"
                  aria-label="Remover foto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          {pending.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.05] ring-1 ring-pink-400/40"
            >
              <img src={p.previewUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/20">
                <div
                  className="h-full bg-pink-400 transition-all"
                  style={{ width: `${Math.max(0.1, p.progress) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {fields.length > 0 && (
        <p className="text-[10.5px] text-white/40 px-0.5 text-center">
          Arrasta as fotos pra reordenar · a primeira é o destaque 💫
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleSelect}
      />

      {remainingSlots > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (dragIndex === null) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'grid grid-cols-2 gap-2 rounded-2xl p-2 transition',
            dragOver && 'bg-pink-500/10 ring-2 ring-pink-400/50 ring-dashed'
          )}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending.length > 0}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl',
              'bg-gradient-to-br from-pink-500/15 to-purple-500/10 hover:from-pink-500/25 hover:to-purple-500/20',
              'ring-1 ring-pink-400/30 hover:ring-pink-400/60 transition',
              'disabled:opacity-60 disabled:cursor-wait active:scale-[0.98]'
            )}
          >
            {pending.length > 0 ? (
              <>
                <Loader2 className="w-5 h-5 text-pink-300 animate-spin" />
                <span className="text-[11.5px] font-semibold text-white">
                  Enviando {pending.length} {pending.length === 1 ? 'foto' : 'fotos'}…
                </span>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-[0_6px_18px_-6px_rgba(236,72,153,0.5)]">
                  <ImagePlus className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[12.5px] font-semibold text-white leading-tight">
                  Escolher da galeria
                </span>
                <span className="text-[10px] text-white/55">
                  até {remainingSlots} {remainingSlots === 1 ? 'foto' : 'fotos'} · pode selecionar várias
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={pending.length > 0}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 h-24 rounded-xl',
              'bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/10 hover:ring-white/25 transition',
              'disabled:opacity-40 active:scale-[0.98]'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-white/[0.06] ring-1 ring-white/15 flex items-center justify-center">
              <Camera className="w-4.5 h-4.5 text-white/80" />
            </div>
            <span className="text-[12.5px] font-semibold text-white/85 leading-tight">
              Tirar foto
            </span>
            <span className="text-[10px] text-white/40">usar câmera</span>
          </button>
        </div>
      )}

      {fields.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-white/50 px-0.5">
          <span>{fields.length} de {MAX_GALLERY_IMAGES} {fields.length === 1 ? 'foto' : 'fotos'}</span>
          {fields.length >= 3 && fields.length < MAX_GALLERY_IMAGES && (
            <span className="text-emerald-300/80">👌 já tá bom pra seguir</span>
          )}
        </div>
      )}
    </div>
  );
}
