"use client"

import React from "react"
import dynamic from 'next/dynamic'

const StellarCardGallerySingle = dynamic(() => import('@/components/ui/3d-image-gallery'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 w-full h-screen bg-black flex items-center justify-center text-white"><p>Carregando galáxia...</p></div>
});


export default function Timeline({ events, onClose }: { events: any[], onClose: () => void }) {
    return (
       <StellarCardGallerySingle events={events} onClose={onClose} />
    );
}
