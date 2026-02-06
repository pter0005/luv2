import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useTranslation } from "@/lib/i18n";
import { Instagram, Mail, MessageSquare, Heart, ExternalLink } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();
  const logoUrl = PlaceHolderImages.find((p) => p.id === 'footerLogo')?.imageUrl || '/logo-placeholder.png'; // Garanta que tem um fallback

  return (
    <footer className="relative border-t border-white/10 bg-transparent pt-16 pb-8 overflow-hidden">
      {/* Efeito de Glow no Topo (Opcional, dá um charme roxo) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Coluna 1: Marca e Tagline */}
          <div className="space-y-6">
            <Link href="/" className="block w-fit transition-transform duration-300 ease-in-out hover:scale-105">
              <Image
                src={logoUrl}
                alt="MyCupid Logo"
                width={140}
                height={40}
                className="w-36 h-auto object-contain"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-4">
              <SocialLink href="https://www.instagram.com/mycupid.oficial/" icon={<Instagram size={20} />} label="Instagram" />
              <SocialLink href="https://api.whatsapp.com/message/E3AOU6LPGW7GO1?autoload=1&app_absent=0" icon={<MessageSquare size={20} />} label="WhatsApp" />
              <SocialLink href="mailto:contatomycupid@gmail.com" icon={<Mail size={20} />} label="Email" />
            </div>
          </div>

          {/* Coluna 2: Produto */}
          <div>
            <h3 className="font-bold text-white mb-6">{t('footer.platform')}</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><FooterLink href="/criar">{t('footer.createPage')}</FooterLink></li>
              <li><FooterLink href="/minhas-paginas">{t('footer.myCreations')}</FooterLink></li>
              <li><FooterLink href="/login">{t('footer.login')}</FooterLink></li>
              <li><FooterLink href="/#planos">{t('footer.plans')}</FooterLink></li>
            </ul>
          </div>

          {/* Coluna 3: Suporte & Legal */}
          <div>
            <h3 className="font-bold text-white mb-6">{t('footer.support')}</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><FooterLink href="https://api.whatsapp.com/message/E3AOU6LPGW7GO1?autoload=1&app_absent=0">{t('footer.helpCenter')}</FooterLink></li>
              <li><FooterLink href="/termos">{t('footer.terms')}</FooterLink></li>
              <li><FooterLink href="/privacidade">{t('footer.privacy')}</FooterLink></li>
            </ul>
          </div>

          {/* Coluna 4: Desenvolvedor (Brou) */}
          <div className="lg:text-right">
             <h3 className="font-bold text-white mb-6">{t('footer.development')}</h3>
             <a 
                href="https://new-tec.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group inline-block bg-white/5 border border-white/10 rounded-xl p-4 transition-all hover:bg-white/10 hover:border-purple-500/30 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]"
             >
                <div className="flex flex-col items-start lg:items-end gap-2">
                    <span className="text-xs text-gray-500 font-medium group-hover:text-gray-300 transition-colors">{t('footer.poweredBy')}</span>
                    <Image
                        src="https://i.imgur.com/vjZ2cyr.png"
                        alt="Brou Dev"
                        width={100}
                        height={25}
                        className="transition-all"
                    />
                </div>
             </a>
          </div>
        </div>

        {/* Rodapé Inferior: Copyright */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div className="flex flex-col md:flex-row items-center gap-x-4 gap-y-2 text-center md:text-left">
                <p>
                    {t('footer.copyright', { year: new Date().getFullYear() })}
                </p>
                <span className="hidden md:inline">|</span>
                <p>CNPJ: 64.966.299/0001-16</p>
            </div>
            <p className="flex items-center gap-1">
                {t('footer.madeWith')} <Heart size={12} className="text-purple-500 fill-purple-500 animate-pulse" /> {t('footer.forCouples')}
            </p>
        </div>
      </div>
    </footer>
  );
}

// Pequenos componentes auxiliares para limpar o código
function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      aria-label={label}
      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-purple-500 hover:text-white transition-all duration-300"
    >
      {icon}
    </a>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    // Verifica se é link externo
    const isExternal = href.startsWith('http');
    
    if (isExternal) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors flex items-center gap-2 group">
                {children} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
        )
    }

    return (
        <Link href={href} className="hover:text-purple-400 transition-colors inline-block">
            {children}
        </Link>
    );
}
