import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Footer() {
  const logoUrl = PlaceHolderImages.find((p) => p.id === "logo")?.imageUrl || "";

  return (
    <footer className="py-8 border-t border-t-border bg-background/80 backdrop-blur-sm">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoUrl}
            alt="Amore Pages Logo"
            width={120}
            height={120}
            className="w-24 h-24"
            data-ai-hint="logo"
          />
        </Link>
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Amore Pages. Todos os direitos reservados.</p>
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
