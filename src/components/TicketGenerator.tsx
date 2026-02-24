'use client';

import React, { useRef, useState } from 'react';
import QRCode from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';

const ticketBaseUrl = 'https://i.imgur.com/sYf8e4s.png'; 

interface TicketGeneratorProps {
  linkUrl: string;
  nomeArquivo?: string;
}

export default function TicketGenerator({ linkUrl, nomeArquivo = 'ticket-amor' }: TicketGeneratorProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const baixarImagem = async () => {
    if (!ticketRef.current) return;
    setLoading(true);

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${nomeArquivo}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Erro ao gerar ticket:', error);
      alert('Erro ao gerar imagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="absolute -left-[9999px] top-0">
          <div 
              ref={ticketRef}
              className="relative w-[350px]"
          >
              <img 
                  src={ticketBaseUrl} 
                  alt="Ticket Base" 
                  className="w-full h-auto block"
                  crossOrigin="anonymous"
              />
              <div 
                  className="absolute flex items-center justify-center bg-white p-1 rounded"
                  style={{
                      top: '55%',
                      left: '50%',
                      width: '43%',
                      transform: 'translateX(-50%)',
                  }}
              >
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={linkUrl}
                  viewBox={`0 0 256 256`}
                  fgColor="#991b1b"
                  bgColor="#ffffff"
                />
              </div>
          </div>
      </div>
      
      <div className="w-full pt-4 mt-4 border-t border-border">
        <Button
          onClick={baixarImagem}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Gerando...' : 'Baixar Ticket Personalizado'}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
            Dica: Imprima em papel fotográfico ou envie no WhatsApp!
        </p>
      </div>
    </>
  );
}
