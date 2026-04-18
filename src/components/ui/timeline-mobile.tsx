"use client"

// Shared exports used by both the 3D gallery and the full-screen card view.
// (File kept under this name for backwards-compat with existing imports.)

import { useMemo } from "react"
import { X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion } from "framer-motion"
import { createPortal } from "react-dom"
import Image from "next/image"

const DATE_LOCALE = ptBR

export type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
  date?: Date | { seconds: number; _seconds?: number }
}

export function parseDateObj(date: Card["date"]) {
  if (!date) return null
  const d       = date as any
  const seconds = d._seconds ?? d.seconds
  if (seconds) return new Date(seconds * 1000)
  return date instanceof Date ? date : null
}

export function FullScreenCardView({ card, onClose }: { card: Card; onClose: () => void }) {
  const dateObj = useMemo(() => parseDateObj(card.date), [card.date])
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[999999] bg-black/92 backdrop-blur-lg flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative max-w-lg w-full flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
          <Image src={card.imageUrl} alt={card.alt} fill className="object-contain" sizes="95vw" priority />
        </div>
        <div className="text-center text-white p-4 rounded-2xl" style={{ background: "rgba(139,92,246,0.13)", border: "1px solid rgba(139,92,246,0.26)" }}>
          <h2 className="text-xl font-bold leading-snug">{card.title}</h2>
          {dateObj && <p className="text-purple-400 text-sm font-semibold mt-1">{format(dateObj, "PPP", { locale: DATE_LOCALE })}</p>}
        </div>
      </motion.div>
      <button onClick={onClose} className="absolute top-4 right-4 bg-white/10 text-white rounded-full p-3 active:scale-90 transition-all border border-white/10">
        <X className="w-5 h-5" />
      </button>
    </motion.div>,
    document.body,
  )
}
