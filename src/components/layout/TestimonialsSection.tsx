"use client";

import Image from "next/image";
import TestimonialsMarquee from '@/components/layout/TestimonialsMarquee';
import { memo } from 'react';

const TestimonialsSection = () => {
  return (
    <div className="container relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-gray-500 overflow-hidden"><Image src={`https://picsum.photos/seed/avatar${i}/24/24`} alt="User" width={24} height={24} /></div>)}
            </div>
            <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">+10.000 CASAIS FELIZES</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
          O que nossos{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            clientes
          </span>{' '}
          dizem
        </h2>
        <p className="text-lg text-muted-foreground">Histórias reais de pessoas que criaram páginas únicas para surpreender alguém especial com o MyCupid.</p>
      </div>
      <TestimonialsMarquee />
    </div>
  );
};

export default memo(TestimonialsSection);
