'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function DevAuthDomainHelper() {
  const [hostname, setHostname] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // This code runs only on the client
    const currentHostname = window.location.hostname;
    // Show this helper only in development environments (localhost or cloud workstation previews)
    if (currentHostname.includes('localhost') || currentHostname.endsWith('.web.app') || currentHostname.endsWith('.app')) {
      setHostname(currentHostname);
    }
  }, []);

  if (!hostname) {
    return null;
  }
  
  const handleCopy = () => {
    navigator.clipboard.writeText(hostname);
    toast({
        title: "Domínio copiado!",
        description: "Agora cole no seu Firebase Console.",
    });
  }

  return (
    <div className="fixed bottom-4 left-4 z-[999] max-w-sm rounded-xl border border-yellow-500/30 bg-background/90 p-4 text-foreground shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-yellow-400" />
            <div>
                <h3 className="text-base font-semibold text-yellow-300">Ação Necessária para Login</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Para o login com Google/Email funcionar no ambiente de desenvolvimento, você precisa autorizar este domínio.
                </p>
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-black/50 p-2 pl-3">
            <p className="flex-1 overflow-x-auto whitespace-nowrap text-sm font-mono">{hostname}</p>
            <Button size="icon" variant="ghost" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
            </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
           Vá em Firebase Console → Authentication → Settings → Authorized domains → Add domain.
        </p>
    </div>
  );
}
