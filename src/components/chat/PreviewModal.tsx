'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import PreviewContent from '@/app/criar/fazer-eu-mesmo/PreviewContent';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PreviewModal({ open, onClose }: PreviewModalProps) {
  const [isClient, setIsClient] = React.useState(false);
  const [previewPuzzleRevealed, setPreviewPuzzleRevealed] = React.useState(true);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-sm h-[85vh] max-h-[820px] bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 ring-1 ring-white/20"
          aria-label="Fechar pré-visualização"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute top-3 left-3 z-50 px-3 py-1 rounded-full bg-black/70 text-white text-[10px] uppercase tracking-widest ring-1 ring-white/20">
          Prévia
        </div>

        <div className="w-full h-full overflow-y-auto">
          <PreviewContent
            isClient={isClient}
            onShowTimeline={() => { /* disabled in preview */ }}
            hasValidTimelineEvents={false}
            showPuzzlePreview={false}
            showEasterPreview={false}
            showPoemaPreview={false}
            previewPuzzleRevealed={previewPuzzleRevealed}
            setPreviewPuzzleRevealed={setPreviewPuzzleRevealed}
          />
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
