"use client";

import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Menu, Heart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#avaliacoes", label: "Avaliações" },
  { href: "/como-funciona", label: "Como Funciona" },
];

export default function Header() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const logoUrl = PlaceHolderImages.find((p) => p.id === "logo")?.imageUrl || "";

  return (
    <header className="sticky top-0 left-0 w-full z-50 transition-all duration-300 bg-transparent">
      <div className="container flex items-center justify-between h-24">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoUrl}
            alt="Amore Pages Logo"
            width={140}
            height={140}
            className="w-28 h-28 md:w-32 md:h-32"
            data-ai-hint="logo"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button variant="link" className="text-foreground/80 hover:text-primary">
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/criar">
            <Button>Criar Página</Button>
          </Link>
        </div>

        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-2xl font-script">
                   <Image
                      src={logoUrl}
                      alt="Amore Pages Logo"
                      width={120}
                      height={120}
                      className="w-24 h-24"
                      data-ai-hint="logo"
                    />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start text-lg",
                      pathname === link.href && "text-primary font-bold"
                    )}
                    onClick={() => setSheetOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Button asChild size="lg" className="mt-4">
                  <Link href="/criar" onClick={() => setSheetOpen(false)}>
                    Criar Página
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
