import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useTranslation } from "@/lib/i18n";
import { Instagram, Mail, MessageSquare } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();
  const logoUrl = PlaceHolderImages.find((p) => p.id === 'footerLogo')?.imageUrl || '';

  return (
    <footer className="py-12 border-t border-t-border bg-background/50 md:backdrop-blur-sm">
      <div className="container grid grid-cols-1 md:grid-cols-3 items-center gap-8 text-center md:text-left">
        
        {/* Coluna 1: Logo MyCupid */}
        <div className="flex justify-center md:justify-start">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={logoUrl}
                alt="MyCupid Logo"
                width={160}
                height={160}
                className="w-32 h-32"
                data-ai-hint="logo love cupid"
              />
            </Link>
        </div>
        
        {/* Coluna 2: Links e Copyright */}
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <a href="https://www.instagram.com/mycupid.oficial/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="https://api.whatsapp.com/message/E3AOU6LPGW7GO1?autoload=1&app_absent=0" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageSquare className="h-6 w-6" />
              </a>
              <a href="mailto:contatomycupid@gmail.com" aria-label="Email" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-6 w-6" />
              </a>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <p className="whitespace-nowrap">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
                <span className="hidden sm:block">|</span>
                <div className="flex items-center gap-4">
                    <Link href="/termos" className="hover:text-primary transition-colors">
                    {t('footer.terms')}
                    </Link>
                    <Link href="/privacidade" className="hover:text-primary transition-colors">
                    {t('footer.privacy')}
                    </Link>
                </div>
            </div>
        </div>

        {/* Coluna 3: Logo Brou */}
        <div className="flex justify-center md:justify-end">
            <a href="https://brou.dev" target="_blank" rel="noopener noreferrer" className="group">
              <Image
                src="https://i.imgur.com/vjZ2cyr.png"
                alt="Desenvolvido por Brou"
                width={150}
                height={37.5}
                className="opacity-60 group-hover:opacity-100 transition-opacity duration-300"
              />
            </a>
        </div>
      </div>
    </footer>
  );
}
