
"use client";

import { useRef } from 'react';
import { motion, useInView } from "framer-motion";
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Hero is above the fold, so we can import it statically for faster LCP.
import HeroSection from '@/components/layout/HeroSection';

// A generic skeleton for loading sections
const SectionSkeleton = () => (
  <div className="container section-padding">
    <Skeleton className="h-10 w-1/2 mx-auto mb-6" />
    <Skeleton className="h-6 w-3/4 mx-auto mb-12" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  </div>
);

// Dynamically import sections that are below the fold.
// This splits the code into smaller chunks, improving initial load time.
const HowItWorksSection = dynamic(() => import('@/components/layout/HowItWorksSection'), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});
const FeaturesSection = dynamic(() => import('@/components/layout/FeaturesSection'), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});
const DemoSection = dynamic(() => import('@/components/layout/DemoSection'), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});
const TestimonialsSection = dynamic(() => import('@/components/layout/TestimonialsSection'), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});
const PlansSection = dynamic(() => import('@/components/layout/PlansSection'), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});

// This wrapper component handles the fade-in animation as sections scroll into view.
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
      <AnimatedSection>
        <HeroSection />
      </AnimatedSection>
      
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
