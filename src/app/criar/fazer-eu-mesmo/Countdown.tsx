
'use client';

import { useState, useEffect, useCallback } from 'react';
import { differenceInYears, differenceInMonths, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, addYears, addMonths, addDays, addHours, addMinutes } from 'date-fns';

type CountdownProps = {
  targetDate: string;
  style?: 'Padrão' | 'Simples';
  color?: string;
};

const Countdown = ({ targetDate, style = 'Padrão', color = '#FFFFFF' }: CountdownProps) => {
    
  const calculateTimeLeft = useCallback(() => {
    const target = new Date(targetDate);
    // A data alvo não pode ser no futuro e deve ser uma data válida.
    if (isNaN(target.getTime()) || target > new Date()) {
      return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    let now = new Date();
    
    let years = differenceInYears(now, target);
    let dateAfterYears = addYears(target, years);
    
    let months = differenceInMonths(now, dateAfterYears);
    let dateAfterMonths = addMonths(dateAfterYears, months);
    
    let days = differenceInDays(now, dateAfterMonths);
    let dateAfterDays = addDays(dateAfterMonths, days);
    
    let hours = differenceInHours(now, dateAfterDays);
    let dateAfterHours = addHours(dateAfterDays, hours);
    
    let minutes = differenceInMinutes(now, dateAfterHours);
    let dateAfterMinutes = addMinutes(dateAfterHours, minutes);

    let seconds = differenceInSeconds(now, dateAfterMinutes);

    return {
      years: Math.max(0, years),
      months: Math.max(0, months),
      days: Math.max(0, days),
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes),
      seconds: Math.max(0, seconds),
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);


  if (style === 'Simples') {
    return (
        <div className="w-full max-w-2xl mx-auto text-center p-4 rounded-lg bg-black/30 md:backdrop-blur-sm">
            <p className="text-md md:text-lg leading-relaxed" style={{ color: color }}>
                <span className="text-muted-foreground">Compartilhando momentos há</span><br/>
                <span className="font-bold">{String(timeLeft.years).padStart(2, '0')}</span> anos{' '}
                <span className="font-bold">{String(timeLeft.months).padStart(2, '0')}</span> meses{' '}
                <span className="font-bold">{String(timeLeft.days).padStart(2, '0')}</span> dias<br/>
                <span className="font-bold">{String(timeLeft.hours).padStart(2, '0')}</span> horas{' '}
                <span className="font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span> minutos{' '}
                <span className="font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span> segundos 💜
            </p>
        </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.years, label: 'Anos' },
    { value: timeLeft.months, label: 'Meses' },
    { value: timeLeft.days, label: 'Dias' },
    { value: timeLeft.hours, label: 'Horas' },
    { value: timeLeft.minutes, label: 'Minutos' },
    { value: timeLeft.seconds, label: 'Segundos' },
  ];

  return (
    <div className="w-full mx-auto">
        <h3 className="text-base text-center text-muted-foreground mb-4">Compartilhando momentos há</h3>
        <div className="grid grid-cols-6 gap-1 md:gap-2 text-center">
          {timeUnits.map(unit => (
            <div key={unit.label} className="p-1 md:p-2 bg-white/5 rounded-lg md:backdrop-blur-sm border border-white/10 shadow-lg">
                <span className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: color }}>
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="block text-[10px] md:text-xs text-muted-foreground mt-1">{unit.label}</span>
            </div>
          ))}
        </div>
    </div>
  );
};

export default Countdown;
