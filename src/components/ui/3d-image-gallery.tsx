"use client"

// Smart wrapper: loads mobile OR desktop chunk independently.
// Mobile users never download Three.js (~600 KB).
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import type { Card } from "./timeline-mobile"

const MobileTimeline  = dynamic(() => import("./timeline-mobile"),  { ssr: false })
const DesktopGallery  = dynamic(() => import("./timeline-desktop"), { ssr: false })

export default function StellarCardGallerySingle({
  events,
  onClose,
}: {
  events: Card[]
  onClose: () => void
}) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || (window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ?? false))
  }, [])

  // null = not yet determined (one render cycle after mount)
  if (isMobile === null || events.length === 0) return null

  if (isMobile) return <MobileTimeline events={events} onClose={onClose} />
  return <DesktopGallery events={events} onClose={onClose} />
}
