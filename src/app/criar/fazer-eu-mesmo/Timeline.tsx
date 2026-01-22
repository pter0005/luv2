
"use client"

import React from "react"
import StellarCardGallerySingle from "@/components/ui/3d-image-gallery"

export default function Timeline({ events, onClose }: { events: any[], onClose: () => void }) {
    return (
       <StellarCardGallerySingle cards={events} onClose={onClose} />
    );
}
