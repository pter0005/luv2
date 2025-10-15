
'use client';

import { useState, useEffect } from 'react';
import { differenceInYears, differenceInMonths, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, addYears, addMonths } from 'date-fns';

type CountdownProps = {
  targetDate: string;
  style?: 'Padrão' | 'Clássico' | 'Simples';
};

const Countdown = ({ targetDate, style = 'Padrão' }: CountdownProps) => {
  const calculateTimeLeft = () => {
    const target = new Date(targetDate);
    if (isNaN(target.getTime())) {
      return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 };
    }
    
    let now = new Date();
    
    // Se a data alvo for no futuro, não faz sentido contar.
    if (target > now) {
        return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 };
    }

    let years = differenceInYears(now, target);
    let dateAfterYears = addYears(target, years);
    if (now < dateAfterYears) {
      years = years - 1;
      dateAfterYears = addYears(target, years);
    }
    
    let months = differenceInMonths(now, dateAfterYears);
    let dateAfterMonths = addMonths(dateAfterYears, months);
     if (now < dateAfterMonths) {
      months = months -1;
      dateAfterMonths = addMonths(dateAfterYears, months);
    }

    const days = differenceInDays(now, dateAfterMonths);
    const hours = differenceInHours(now, addDays(dateAfterMonths, days));
    const minutes = differenceInMinutes(now, addHours(addDays(dateAfterMonths, days), hours));
    const seconds = differenceInSeconds(now, addMinutes(addHours(addDays(dateAfterMonths, days), hours), minutes));

    const totalDays = differenceInDays(now, target);

    return {
      years: Math.max(0, years),
      months: Math.max(0, months),
      days: Math.max(0, days),
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes),
      seconds: Math.max(0, seconds),
      totalDays: Math.max(0, totalDays),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);


  if (style === 'Simples') {
    return (
      <div className="text-center text-white">
        <h3 className="text-lg text-muted-foreground mb-2">Compartilhando momentos há</h3>
        <p className="text-4xl font-bold">{timeLeft.totalDays} dias</p>
      </div>
    );
  }

  if (style === 'Clássico') {
    return (
        <div className="w-full max-w-md mx-auto">
            <h3 className="text-lg text-center text-muted-foreground mb-4">Compartilhando momentos há</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white/5 rounded-lg">
                    <span className="text-4xl font-bold text-primary">{String(timeLeft.years).padStart(2, '0')}</span>
                    <span className="block text-xs text-muted-foreground">Anos</span>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                    <span className="text-4xl font-bold text-primary">{String(timeLeft.months).padStart(2, '0')}</span>
                    <span className="block text-xs text-muted-foreground">Meses</span>
                </div>
                 <div className="p-4 bg-white/5 rounded-lg">
                    <span className="text-4xl font-bold text-primary">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="block text-xs text-muted-foreground">Dias</span>
                </div>
            </div>
        </div>
    )
  }

  // Padrão Style
  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <h3 className="text-lg text-muted-foreground mb-4">Compartilhando momentos há</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 text-white">
        {Object.entries({
          anos: timeLeft.years,
          meses: timeLeft.months,
          dias: timeLeft.days,
          horas: timeLeft.hours,
          minutos: timeLeft.minutes,
          segundos: timeLeft.seconds,
        }).map(([unit, value]) => (
          <div key={unit} className="bg-zinc-800/80 p-3 rounded-lg flex flex-col items-center justify-center aspect-square">
            <span className="text-3xl lg:text-4xl font-bold gradient-text">{String(value).padStart(2, '0')}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Countdown;
    