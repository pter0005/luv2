"use client"

import React, { useEffect, useState, useMemo } from "react"
import { X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
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
  const d = date as any
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
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative max-w-lg w-full max-h-[90vh] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src={card.imageUrl}
            alt={card.alt}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 95vw, 512px"
            priority
          />
        </div>
        <div
          className="text-center text-white p-4 rounded-2xl"
          style={{ background: "rgba(139,92,246,0.13)", border: "1px solid rgba(139,92,246,0.26)" }}
        >
          <h2 className="text-xl font-bold leading-snug">{card.title}</h2>
          {dateObj && (
            <p className="text-purple-400 font-semibold text-sm mt-1">
              {format(dateObj, "PPP", { locale: DATE_LOCALE })}
            </p>
          )}
        </div>
      </motion.div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 text-white rounded-full p-3 active:scale-90 transition-all border border-white/10"
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>,
    document.body,
  )
}

export default function MobileTimeline({ events, onClose }: { events: Card[]; onClose: () => void }) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  if (!mounted) return null

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[99999] bg-[#020202] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-safe-top pb-3 pt-4 shrink-0 bg-gradient-to-b from-black to-transparent">
        <div className="text-white">
          <h1 className="text-lg font-bold tracking-wide">Nossa Linha do Tempo</h1>
          <p className="text-[11px] text-white/60 mt-0.5">Toque para ver em detalhes</p>
        </div>
        <button
          onClick={onClose}
          className="bg-white/10 active:bg-white/25 text-white rounded-full p-3 active:scale-90 transition-all touch-manipulation border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable grid */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-8 pt-1">
        <div className="grid grid-cols-2 gap-2.5">
          {events.map((card, i) => {
            const dateObj = parseDateObj(card.date)
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: Math.min(i * 0.05, 0.55),
                  duration: 0.32,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => setSelectedCard(card)}
                className="relative rounded-2xl overflow-hidden border border-white/[0.07] active:scale-95 transition-transform duration-150 touch-manipulation"
                style={{ aspectRatio: "3/4", background: "#111" }}
              >
                <img
                  src={card.imageUrl}
                  alt={card.alt}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, transparent 70%)",
                  }}
                />
                <div className="absolute top-2 right-2 text-white/40 text-[9px]">✦</div>
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-white font-semibold text-[11px] leading-snug line-clamp-2 drop-shadow-md">
                    {card.title}
                  </p>
                  {dateObj && (
                    <p className="text-purple-300/90 text-[9px] font-medium tracking-wider mt-0.5 uppercase">
                      {format(dateObj, "dd MMM yyyy", { locale: DATE_LOCALE })}
                    </p>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedCard && (
          <FullScreenCardView card={selectedCard} onClose={() => setSelectedCard(null)} />
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  )
}
