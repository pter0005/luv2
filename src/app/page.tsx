"use client";

import { useRef } from 'react';
import { motion, useInView } from "framer-motion";
import HeroSection from '@/components/layout/HeroSection';
import HowItWorksSection from '@/components/layout/HowItWorksSection';
import FeaturesSection from '@/components/layout/FeaturesSection';
import TestimonialsSection from '@/components/layout/TestimonialsSection';
import PlansSection from '@/components/layout/PlansSection';
import DemoSection from '@/components/layout/DemoSection';

const AnimatedSection = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    return (
        <section ref={ref} id={id} className={className}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="will-change-[opacity,transform]"
            >
                {children}
            </motion.div>
        </section>
    );
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <AnimatedSection id="how-it-works-simple" className="section-padding bg-transparent">
        <HowItWorksSection />
      </AnimatedSection>
      <AnimatedSection className="section-padding bg-transparent">
        <FeaturesSection />
      </AnimatedSection>
      <AnimatedSection id="demo-section" className="section-padding bg-transparent">
        <DemoSection />
      </AnimatedSection>
      <AnimatedSection id="avaliacoes" className="py-16 md:py-24 bg-transparent relative">
        <TestimonialsSection />
      </AnimatedSection>
      <AnimatedSection id="planos" className="section-padding bg-transparent">
        <PlansSection />
      </AnimatedSection>
    </>
  );
}
