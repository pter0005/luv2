
'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n';

const QR_OPTIONS = [
  {
    id: 'classic',
    title: 'Clássico',
    price: 0,
    bgImage: null,
    qrColor: '#000000',
  },
  {
    id: 'ticket',
    title: 'Ticket Amor',
    price: 3.90,
    bgImage: 'https://i.imgur.com/sYf8e4s.png', 
    qrColor: '#991b1b',
    previewPos: { top: '48%', left: '50%', width: '38%' }
  }
];

interface QrCodeSelectorProps {
  value: string;
  onChange: (id: string) => void;
  onPriceChange: (price: number) => void;
}

export default function QrCodeSelector({ value, onChange, onPriceChange }: QrCodeSelectorProps) {
  const [selected, setSelected] = useState(value || 'classic');
  const { t } = useTranslation();

  useEffect(() => {
    const selectedOption = QR_OPTIONS.find(opt => opt.id === selected);
    if (selectedOption) {
      onChange(selectedOption.id);
      onPriceChange(selectedOption.price);
    }
  }, [selected, onChange, onPriceChange]);

  const handleSelect = (option: typeof QR_OPTIONS[0]) => {
    setSelected(option.id);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-semibold text-foreground">✨ {t('wizard.qr.title')}</span>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{t('wizard.qr.upsell')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QR_OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <div 
              key={option.id}
              onClick={() => handleSelect(option)}
              className={cn(
                "relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 border-2 flex flex-col bg-card/50",
                isSelected 
                  ? 'border-primary shadow-lg scale-[1.03]' 
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="bg-muted/30 h-48 relative overflow-hidden flex items-center justify-center p-2">
                {option.bgImage ? (
                  <>
                    <Image 
                      src={option.bgImage} 
                      alt={option.title} 
                      fill
                      className="w-full h-full object-cover"
                      sizes="200px"
                    />
                    <div 
                      className="absolute bg-white p-1 rounded-md shadow-md"
                      style={{
                        top: option.previewPos.top,
                        left: option.previewPos.left,
                        width: option.previewPos.width,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <QRCode 
                        value="preview" 
                        size={256} 
                        style={{ width: '100%', height: 'auto' }}
                        fgColor={option.qrColor}
                        bgColor="#FFFFFF"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-white rounded-lg">
                    <QRCode 
                      value="preview" 
                      size={112}
                      fgColor="#000000"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 bg-card/80 border-t border-border mt-auto">
                <div 
                  className={cn(
                    "w-full py-2 rounded-lg font-bold text-sm transition-colors text-center",
                    option.price === 0 
                      ? 'bg-muted text-muted-foreground' 
                      : isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-primary/20 text-primary'
                  )}
                >
                  {option.price === 0 ? t('wizard.qr.free') : `R$ ${option.price.toFixed(2).replace('.', ',')}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

    