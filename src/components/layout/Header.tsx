
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Menu, UserCircle, LogOut, Heart } from "lucide-react";
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
import { useUser } from "@/firebase/provider";
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
import { motion } from "framer-motion";
import { removeSession } from "@/app/auth-actions";

const navLinks = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#planos", label: "Planos" },
  { href: "/#avaliacoes", label: "Avaliações" },
  { href: "/como-funciona", label: "Como Funciona" },
];

export default function Header() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const headerLogoUrl = PlaceHolderImages.find((p) => p.id === "headerLogo")?.imageUrl || "";
  const { user, isUserLoading } = useUser();
  
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
  
    if (user && user.uid) {
      return (
        <DropdownMenu modal={false}>
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
                <p className="text-sm font-medium leading-none">
                  Olá, {user.displayName || "Meu Perfil"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => router.push('/minhas-paginas')} 
              className="cursor-pointer"
            >
              <Heart className="mr-2 h-4 w-4" />
              <span>Minhas Páginas</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="cursor-pointer text-red-400 focus:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  
    return (
      <Link href="/login">
        <Button>Minha Conta</Button>
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
                  width={160}
                  height={40}
                  className="w-auto h-10 object-contain transition-all duration-300"
                  data-ai-hint="logo"
                  priority
              />
          </Link>
        </div>
        
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
            {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                <Button variant="link" className="text-foreground/80 hover:text-primary text-base px-4">
                    {link.label}
                </Button>
                </Link>
            ))}
        </nav>

        <div className="flex justify-end items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
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
                          width={140}
                          height={35}
                          className="w-auto h-8"
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

                        {user ? (
                        <div className="pt-6 border-t">
                            <Button asChild size="lg" className="w-full text-lg mb-4">
                                <Link href="/minhas-paginas" onClick={() => setSheetOpen(false)}>
                                    Minhas Páginas
                                </Link>
                            </Button>
                            <Button size="lg" className="w-full text-lg" variant="outline" onClick={handleSignOut}>
                                Sair
                            </Button>
                        </div>
                        ) : (
                            <Button asChild size="lg" className="mt-4 text-lg">
                            <Link href="/login" onClick={() => setSheetOpen(false)}>
                                Minha Conta
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
