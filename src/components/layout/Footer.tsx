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
      <div className="container flex flex-col items-center justify-center gap-8 text-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoUrl}
            alt="MyCupid Logo"
            width={160}
            height={160}
            className="w-32 h-32 md:w-40 md:h-40"
            data-ai-hint="logo love cupid"
          />
        </Link>
        
        <div className="flex items-center gap-6">
          <a href="https://www.instagram.com/mycupid.oficial/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
            <Instagram className="h-6 w-6" />
          </a>
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary transition-colors">
            <MessageSquare className="h-6 w-6" />
          </a>
          <a href="mailto:contatomycupid@gmail.com" aria-label="Email" className="text-muted-foreground hover:text-primary transition-colors">
            <Mail className="h-6 w-6" />
          </a>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-6">
            <Link href="/termos" className="hover:text-primary transition-colors">
              {t('footer.terms')}
            </Link>
            <Link href="/privacidade" className="hover:text-primary transition-colors">
              {t('footer.privacy')}
            </Link>
          </div>
        </div>
        <a href="https://brou.dev" target="_blank" rel="noopener noreferrer" className="group mt-4">
          <Image
            src="https://i.imgur.com/vjZ2cyr.png"
            alt="Desenvolvido por Brou"
            width={150}
            height={37.5}
            className="opacity-60 group-hover:opacity-100 transition-opacity duration-300"
          />
        </a>
      </div>
    </footer>
  );
}
