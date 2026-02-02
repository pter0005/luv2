"use client";

import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Menu, UserCircle, LogOut, LayoutDashboard, Heart, Globe } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useTranslation } from "@/lib/i18n";
import { motion } from "framer-motion";
import { removeSession } from "@/app/auth-actions";

const navLinks = [
  { href: "/#recursos", labelKey: "nav.recursos" },
  { href: "/#planos", labelKey: "nav.planos" },
  { href: "/#avaliacoes", labelKey: "nav.avaliacoes" },
  { href: "/como-funciona", labelKey: "nav.comoFunciona" },
];

export default function Header() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const headerLogoUrl = PlaceHolderImages.find((p) => p.id === "headerLogo")?.imageUrl || "";
  const { user, isUserLoading } = useUser();
  const { t, setLocale, locale } = useTranslation();
  
  // State for header visibility on scroll
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastY && currentY > 100) {
        setHidden(true); // Scrolling down
      } else {
        setHidden(false); // Scrolling up
      }
      setLastY(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastY]);


  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth); // Faz o logout no cliente Firebase
      await removeSession(); // Chama a server action para remover o cookie
      router.push('/login'); // Redireciona o usuário para a página de login
      router.refresh(); // Garante que o estado da aplicação seja limpo
    } catch (error) {
      console.error("Erro ao sair:", error);
      // Fallback em caso de erro, força um redirect
      window.location.href = '/login';
    }
  };

  const renderUserArea = () => {
    if (isUserLoading) {
      return <div className="h-10 w-24 rounded-md bg-muted animate-pulse" />;
    }

    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuário"} />
                <AvatarFallback>
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{t('profile.greeting')}, {user.displayName || "Meu Perfil"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/minhas-paginas">
                <Heart className="mr-2 h-4 w-4" />
                <span>{t('user.myPages')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('user.signOut')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Link href="/login">
        <Button>{t('user.myAccount')}</Button>
      </Link>
    );
  };

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-colors duration-300 bg-background/80 md:backdrop-blur-sm border-b border-border/50 shadow-lg"
      )}>
      <div className={cn(
          "container flex items-center justify-between transition-all duration-300 h-20"
        )}>
        
        <div className="flex justify-start">
          <Link href="/" className="flex items-center gap-2">
              <Image
                  src={headerLogoUrl}
                  alt="MyCupid Logo"
                  width={220}
                  height={220}
                  className="w-52 h-52 transition-all duration-300"
                  data-ai-hint="logo"
                  priority
              />
          </Link>
        </div>
        
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
            {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                <Button variant="link" className="text-foreground/80 hover:text-primary text-base px-4">
                    {t(link.labelKey as any)}
                </Button>
                </Link>
            ))}
        </nav>

        <div className="flex justify-end items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Globe className="h-5 w-5" />
                      <span className="sr-only">{t('lang.change')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setLocale('pt')}>{t('lang.pt')}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setLocale('en')}>{t('lang.en')}</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setLocale('es')}>{t('lang.es')}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {renderUserArea()}
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
                          alt="MyCupid Logo"
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
                            {t(link.labelKey as any)}
                        </Link>
                        ))}

                        <div className="pt-6 border-t">
                            <h3 className="px-4 py-2 text-muted-foreground">{t('lang.change')}</h3>
                            <div className="flex flex-col space-y-2">
                                <Button variant={locale === 'pt' ? 'secondary' : 'ghost'} className="justify-start text-lg" onClick={() => { setLocale('pt'); setSheetOpen(false); }}>{t('lang.pt')}</Button>
                                <Button variant={locale === 'en' ? 'secondary' : 'ghost'} className="justify-start text-lg" onClick={() => { setLocale('en'); setSheetOpen(false); }}>{t('lang.en')}</Button>
                                <Button variant={locale === 'es' ? 'secondary' : 'ghost'} className="justify-start text-lg" onClick={() => { setLocale('es'); setSheetOpen(false); }}>{t('lang.es')}</Button>
                            </div>
                        </div>

                        {user ? (
                        <div className="pt-6 border-t">
                            <Button asChild size="lg" className="w-full text-lg mb-4">
                                <Link href="/minhas-paginas" onClick={() => setSheetOpen(false)}>
                                    {t('user.myPages')}
                                </Link>
                            </Button>
                            <Button size="lg" className="w-full text-lg" variant="outline" onClick={handleSignOut}>
                                {t('user.signOut')}
                            </Button>
                        </div>
                        ) : (
                            <Button asChild size="lg" className="mt-4 text-lg">
                            <Link href="/login" onClick={() => setSheetOpen(false)}>
                                {t('user.myAccount')}
                            </Link>
                            </Button>
                        )}
                    </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>

      </div>
    </motion.header>
  );
}
