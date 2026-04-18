"use client"

// Unified 3D galaxy timeline — same experience on desktop and mobile.
// Mobile optimizations (DPR, fog, star count, FOV, no antialias) are handled inside the gallery.
import dynamic from "next/dynamic"
import type { Card } from "./timeline-mobile"

const Gallery = dynamic(() => import("./timeline-desktop"), { ssr: false })

export default function StellarCardGallerySingle({ events, onClose }: { events: Card[]; onClose: () => void }) {
  if (events.length === 0) return null
  return <Gallery events={events} onClose={onClose} />
}
