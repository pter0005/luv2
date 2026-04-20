'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import Image from 'next/image';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { uploadFile } from '@/lib/upload';
import { compressImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import { MAX_GALLERY_IMAGES, type PageData } from '@/lib/wizard-schema';

export default function GalleryField() {
  const { control } = useFormContext<PageData>();
  const { fields, append, remove } = useFieldArray({ control, name: 'galleryImages' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useUser();
  const firebase = useFirebase();
  const { toast } = useToast();

  const handleSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_GALLERY_IMAGES - fields.length;
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) {
      toast({ variant: 'destructive', title: 'Limite atingido', description: `Máximo de ${MAX_GALLERY_IMAGES} fotos.` });
      return;
    }

    let activeUser = user;
    if (!activeUser && firebase.auth) {
      const cred = await signInAnonymously(firebase.auth);
      activeUser = cred.user;
    }
    if (!activeUser) return;

    setUploading(true);
    try {
      for (const file of selected) {
        const compressed = await compressImage(file, 1600, 0.82);
        const uploaded = await uploadFile(firebase.storage, activeUser.uid, compressed, 'gallery');
        append(uploaded);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: err?.message ?? 'Tente de novo.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [fields.length, user, firebase, append, toast]);

  return (
    <div className="space-y-3">
      {fields.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {fields.map((f, i) => {
            const url = (f as any).url as string;
            return (
              <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <Image src={url} alt="" fill className="object-cover" sizes="160px" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-1"
                  aria-label="Remover foto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      {fields.length < MAX_GALLERY_IMAGES && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-16 border-dashed"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando…</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" /> Adicionar fotos ({fields.length}/{MAX_GALLERY_IMAGES})</>
          )}
        </Button>
      )}
    </div>
  );
}
