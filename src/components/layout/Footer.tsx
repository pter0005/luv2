import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const logoUrl = "https://imgur.com/xy2xYyi.png";

  return (
    <footer className="py-8 border-t border-t-border bg-background/80 backdrop-blur-sm">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoUrl}
            alt="b2gether Logo"
            width={160}
            height={160}
            className="w-32 h-32 md:w-40 md:h-40"
            data-ai-hint="logo love signature"
          />
        </Link>
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} b2gether. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/termos" className="hover:text-primary transition-colors">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="hover:text-primary transition-colors">
              Política de privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
