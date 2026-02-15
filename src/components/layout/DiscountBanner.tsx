'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function DiscountBanner() {
  const [timeLeft, setTimeLeft] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const getExpiryTime = () => {
      let expiry = localStorage.getItem('discountExpiry');
      if (!expiry) {
        const newExpiry = new Date().getTime() + 2 * 60 * 60 * 1000; // 2 hours from now
        expiry = newExpiry.toString();
        localStorage.setItem('discountExpiry', expiry);
      }
      return parseInt(expiry, 10);
    };

    const expiryTime = getExpiryTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiryTime - now;

      if (distance > 0) {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
        setShowBanner(true);
      } else {
        setTimeLeft('00:00:00');
        setShowBanner(false); // Hide banner when time is up
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-600 via-purple-700 to-red-600 text-white text-center py-2.5 text-sm font-bold shadow-lg flex items-center justify-center gap-2">
      <Clock className="w-4 h-4" />
      <p>
        {t('banner.title')} <span className="font-mono tracking-wider">{timeLeft}</span>!
      </p>
    </div>
  );
}
