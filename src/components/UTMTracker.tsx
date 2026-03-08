'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function UTMTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const source = searchParams.get('utm_source');
    
    // If there's a source, save it as the last known source for this session.
    // This can be picked up by the CreatePageWizard.
    if (source) {
      try {
        sessionStorage.setItem('last_utm_source', source);
      } catch (error) {
        console.error('Could not save UTM source to session storage:', error);
      }
    }

    const effectiveSource = source || 'direct';
    const trackedKey = `utm_tracked_${effectiveSource}_${pathname}`;

    try {
      if (sessionStorage.getItem(trackedKey)) {
        return;
      }
      sessionStorage.setItem(trackedKey, 'true');

      // Avoids spamming 'direct' visits for every internal navigation.
      if (!source && sessionStorage.getItem('has_tracked_visit')) {
        return;
      }
      
      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: effectiveSource, pathname }),
        keepalive: true,
      });

      sessionStorage.setItem('has_tracked_visit', 'true');

    } catch (error) {
      console.error('UTM Tracker failed:', error);
    }
    
  }, [pathname, searchParams]);

  return null; // This component renders nothing.
}