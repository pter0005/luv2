"use client"

import React from "react"
import StellarCardGallerySingle, { CardProvider } from "@/components/ui/3d-image-gallery"

export default function Timeline({ events, onClose }: { events: any[], onClose: () => void }) {
    if (!events || events.length === 0) {
        return null;
    }

    return (
        <CardProvider events={events}>
            <StellarCardGallerySingle onClose={onClose} />
        </CardProvider>
    );
}
