import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function MercadoPagoLogo({ className, variant = 'horizontal' }: { className?: string; variant?: 'horizontal' | 'vertical' }) {
  const src = variant === 'vertical'
    ? '/MP_RGB_HANDSHAKE_color_vertical.png'
    : '/MP_RGB_HANDSHAKE_color_horizontal.png';
  // Aspect ratio aproximado das logos oficiais MP
  const width = variant === 'vertical' ? 60 : 120;
  const height = variant === 'vertical' ? 60 : 32;
  return (
    <Image
      src={src}
      alt="Mercado Pago"
      width={width}
      height={height}
      className={cn('h-12 w-auto object-contain', className)}
      priority={false}
      unoptimized
    />
  );
}

export default function MercadoPagoBadge({
  variant = 'default',
  className,
}: {
  variant?: 'default' | 'compact' | 'hero';
  className?: string;
}) {
  if (variant === 'compact') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-white/60', className)}>
        <span className="text-[10.5px] font-medium">via</span>
        <MercadoPagoLogo className="h-3.5" />
      </span>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2.5 rounded-xl px-3 py-2.5 bg-gradient-to-br from-sky-500/10 to-blue-500/5 ring-1 ring-sky-400/25',
          className
        )}
      >
        <div className="w-7 h-7 rounded-lg bg-[#00b1ea] flex items-center justify-center shrink-0 shadow-[0_4px_12px_-4px_rgba(0,177,234,0.6)]">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
            <path d="M12 2 3 7v6c0 5 3.9 9.4 9 10 5.1-.6 9-5 9-10V7l-9-5Zm-1.3 14.7-4-4 1.4-1.4 2.6 2.6L15.9 9l1.4 1.4-6.6 6.3Z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11.5px] font-bold text-white uppercase tracking-wider">100% seguro</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10.5px] text-white/60 leading-tight mt-0.5">
            <span>PIX e cartão assegurados por</span>
            <MercadoPagoLogo className="h-3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-white/70', className)}>
      <span className="text-[11px]">processado por</span>
      <MercadoPagoLogo className="h-4" />
    </div>
  );
}
