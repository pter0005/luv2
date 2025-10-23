"use client";

import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#avaliacoes", label: "Avaliações" },
  { href: "/como-funciona", label: "Como Funciona" },
];

export default function Header() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const headerLogoUrl = PlaceHolderImages.find((p) => p.id === "headerLogo")?.imageUrl || "";


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    // Set initial state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className={cn(
        "sticky top-0 left-0 w-full z-50 transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-sm border-b border-border/50 shadow-lg" : "bg-transparent"
      )}>
      <div className={cn(
          "container flex items-center justify-between transition-all duration-300",
          isScrolled ? "h-20" : "h-28"
        )}>
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={headerLogoUrl}
            alt="b2gether Logo"
            width={180}
            height={180}
            className={cn(
              "transition-all duration-300",
              isScrolled ? "w-40 h-40" : "w-48 h-48 md:w-56 md:h-56"
            )}
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
                      src={headerLogoUrl}
                      alt="b2gether Logo"
                      width={180}
                      height={180}
                      className="w-48 h-48"
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
                      "justify-start text-xl py-6",
                      pathname === link.href && "text-primary font-bold"
                    )}
                    onClick={() => setSheetOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Button asChild size="lg" className="mt-4 text-lg">
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
