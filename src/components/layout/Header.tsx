"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, UserCircle, LogOut, Heart, Sparkles, Tag, X } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/provider";
import { getAuth, signOut } from "firebase/auth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { removeSession } from "@/app/auth-actions";

const navLinks = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#planos", label: "Planos" },
  { href: "/#avaliacoes", label: "Avaliações" },
  { href: "/como-funciona", label: "Como Funciona" },
];

function DiscountBanner() {
  const [visible, setVisible] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    if (month === 3 && day >= 6 && day <= 9) setShow(true);
  }, []);

  if (!show || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 overflow-hidden"
      >
        {/* shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite] bg-[length:200%_100%]" />
        <div className="relative flex items-center justify-center gap-2 py-2.5 px-4 text-center">
          <span className="text-lg">🌸</span>
          <p className="text-sm font-bold text-white">
            Dia das Mulheres — <span className="underline underline-offset-2">50% OFF</span> hoje!
          </p>
          <span className="hidden sm:inline text-white/70 text-sm">·</span>
          <p className="hidden sm:inline text-sm text-white/90">Use o cupom <span className="font-black bg-white/20 px-2 py-0.5 rounded-full text-white">MULHER50</span></p>
          <button
            onClick={() => setVisible(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Header() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const headerLogoUrl = PlaceHolderImages.find((p) => p.id === "headerLogo")?.imageUrl || "";
  const { user, isUserLoading } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      await removeSession();
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
  };

  const renderUserArea = () => {
    if (isUserLoading) return <div className="h-9 w-20 rounded-full bg-white/10 animate-pulse" />;
    if (user && user.uid) {
      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="relative h-9 w-9 rounded-full ring-2 ring-purple-500/40 ring-offset-2 ring-offset-transparent hover:ring-purple-400 transition-all duration-200 focus:outline-none">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuário"} />
                <AvatarFallback className="bg-purple-600 text-white text-sm font-semibold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle size={16} />}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl" align="end" forceMount>
            <DropdownMenuLabel className="font-normal px-3 py-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-white leading-none">Olá, {user.displayName || "Meu Perfil"} 👋</p>
                <p className="text-xs leading-none text-zinc-400 mt-1">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={() => router.push("/minhas-paginas")} className="cursor-pointer text-zinc-200 hover:text-white focus:text-white focus:bg-white/10 rounded-xl mx-1 px-3 py-2.5">
              <Heart className="mr-2 h-4 w-4 text-pink-400" /><span>Minhas Páginas</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10 rounded-xl mx-1 px-3 py-2.5 mb-1">
              <LogOut className="mr-2 h-4 w-4" /><span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <Link href="/login">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white overflow-hidden transition-all duration-200"
          style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)", boxShadow: "0 0 20px rgba(147, 51, 234, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
          <Sparkles size={14} className="opacity-80" />Minha Conta
        </motion.button>
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <DiscountBanner />
      <div className={cn("w-full transition-all duration-500", scrolled ? "bg-black/60 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_40px_rgba(0,0,0,0.6)]" : "bg-gradient-to-b from-black/40 to-transparent backdrop-blur-sm")}>
        <div className="container flex items-center justify-between h-36 px-4 md:px-6">
          <Link href="/" className="flex items-center shrink-0">
            <motion.div whileHover={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <img src={headerLogoUrl} alt="MyCupid Logo" style={{ height: "120px", width: "auto", objectFit: "contain", display: "block" }} />
            </motion.div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link, i) => (
              <motion.div key={link.href} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 + 0.1 }}>
                <Link href={link.href}>
                  <span className={cn("relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 group inline-flex items-center", pathname === link.href ? "text-white" : "text-white/60 hover:text-white/90")}>
                    {pathname === link.href && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white/10 border border-white/15" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
                    <span className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/5 transition-colors duration-200" />
                    <span className="relative">{link.label}</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center">{renderUserArea()}</div>
            <div className="md:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all duration-200">
                    <Menu className="w-4 h-4" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-zinc-950/98 backdrop-blur-2xl border-white/10 w-72">
                  <SheetHeader>
                    <SheetTitle className="flex items-center">
                      <Image src={headerLogoUrl} alt="MyCupid Logo" width={300} height={75} className="w-auto h-10 object-contain" />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col mt-8 px-1 gap-1">
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href} className={cn("flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200", pathname === link.href ? "bg-purple-600/20 text-white border border-purple-500/30" : "text-zinc-400 hover:text-white hover:bg-white/5")} onClick={() => setSheetOpen(false)}>
                        {link.label}
                      </Link>
                    ))}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      {user ? (
                        <div className="flex flex-col gap-2">
                          <Link href="/minhas-paginas" onClick={() => setSheetOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-600/20 text-white border border-purple-500/30 font-medium text-sm transition-all hover:bg-purple-600/30">
                            <Heart size={16} className="text-pink-400" />Minhas Páginas
                          </Link>
                          <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 font-medium text-sm transition-all">
                            <LogOut size={16} />Sair
                          </button>
                        </div>
                      ) : (
                        <Link href="/login" onClick={() => setSheetOpen(false)} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-white font-semibold text-sm transition-all" style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)", boxShadow: "0 0 20px rgba(147, 51, 234, 0.3)" }}>
                          <Sparkles size={14} />Minha Conta
                        </Link>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}