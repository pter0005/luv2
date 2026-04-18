"use client"

// Mobile  → CSS 3D cylinder carousel   (no WebGL, smooth on any phone)
// Desktop → Three.js WebGL galaxy       (loaded only when needed)
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import type { Card } from "./timeline-mobile"

const MobileTimeline = dynamic(() => import("./timeline-mobile"),  { ssr: false })
const DesktopGallery  = dynamic(() => import("./timeline-desktop"), { ssr: false })

export default function StellarCardGallerySingle({ events, onClose }: { events: Card[]; onClose: () => void }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    setIsMobile(
      window.innerWidth < 768 ||
      (window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ?? false),
    )
  }, [])

  if (isMobile === null || events.length === 0) return null
  if (isMobile) return <MobileTimeline events={events} onClose={onClose} />
  return <DesktopGallery events={events} onClose={onClose} />
}
