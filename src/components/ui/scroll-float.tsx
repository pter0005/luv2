"use client";
import React, { useEffect, useRef, ReactNode, RefObject } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

interface ScrollFloatProps {
  children: ReactNode;
}

export const ScrollFloat: React.FC<ScrollFloatProps> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [15, -15]);
  const scale = useTransform(scrollYProgress, [0.5, 1], [1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        scale,
        opacity,
        transformPerspective: "1000px",
      }}
    >
      {children}
    </motion.div>
  );
};
