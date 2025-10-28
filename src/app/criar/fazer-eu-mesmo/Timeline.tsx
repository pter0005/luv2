"use client"

import React from "react"
import StellarCardGallerySingle, { CardProvider, useCard, useScreenOrientation } from "@/components/ui/3d-image-gallery"

function TimelineContent({ onClose }: { onClose: () => void }) {
    const { cards } = useCard();
    const { isMobile } = useScreenOrientation();
  
    if (!cards || cards.length === 0) {
      return (
          <div className="w-full h-screen fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white text-center">
              <p className="text-xl font-bold">Nenhum momento foi adicionado ainda.</p>
              <button onClick={onClose} className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                  Voltar
              </button>
          </div>
      )
    }
  
    return <StellarCardGallerySingle cards={cards} isMobile={isMobile} onClose={onClose} />;
}


export default function Timeline({ events, onClose }: { events: any[], onClose: () => void }) {
    if (!events || events.length === 0) {
        return null;
    }

    return (
        <CardProvider events={events}>
            <TimelineContent onClose={onClose} />
        </CardProvider>
    );
}
