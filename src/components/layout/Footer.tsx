import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
  const { t } = useTranslation();
  const logoUrl = PlaceHolderImages.find((p) => p.id === 'footerLogo')?.imageUrl || '';

  return (
    <footer className="py-8 border-t border-t-border bg-background/80 md:backdrop-blur-sm">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
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
        <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-sm text-muted-foreground">
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
            <a href="https://brou.dev" target="_blank" rel="noopener noreferrer">
              <Image
                src="https://i.imgur.com/vjZ2cyr.png"
                alt="Desenvolvido por Brou"
                width={120}
                height={30}
                className="opacity-70 hover:opacity-100 transition-opacity"
              />
            </a>
        </div>
      </div>
    </footer>
  );
}
