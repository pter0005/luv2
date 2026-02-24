"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const FloatingHeart = ({ className, delay }: { className?: string; delay: number }) => {
  return (
    <motion.div
      className={cn("absolute text-purple-500/40 pointer-events-none z-20", className)} // z-20 fica entre os celulares de trás (z-10) e o da frente (z-30)
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: -20 }}
      transition={{
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror", // Efeito de subida e descida
        delay,
      }}
    >
      <Heart fill="currentColor" strokeWidth={0} className="w-16 h-16 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
    </motion.div>
  );
};

export default FloatingHeart;
