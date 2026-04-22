"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCcw, Clock, CheckCircle2, XCircle, Mail } from 'lucide-react';

const Section = ({ title, icon: Icon, children }: { title: string, icon: React.FC<any>, children: React.ReactNode }) => (
  <section className="space-y-4 scroll-mt-24">
    <h2 className="flex items-center gap-3 text-2xl font-bold font-headline text-primary border-b border-primary/20 pb-2">
      <Icon className="w-6 h-6" />
      <span>{title}</span>
    </h2>
    <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

export default function RefundsPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container py-16 md:py-24 max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to home</Link>
        </Button>
        <div className="mb-12 text-center">
          <RefreshCcw className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-foreground">Refund Policy</h1>
          <p className="mt-3 text-muted-foreground">7-day money-back guarantee</p>
        </div>

        <div className="space-y-10">
          <Section title="Our promise" icon={CheckCircle2}>
            <p>We want you to love the page you create. If you are not satisfied, you can request a full refund within 7 days of purchase — no questions asked — as long as the page has not yet been shared with the recipient.</p>
          </Section>

          <Section title="Eligibility" icon={Clock}>
            <p>You are eligible for a refund if: (a) the request is made within 7 days of purchase; (b) the page has not been opened more than once by the recipient; (c) the purchase was not a gift already accepted by the recipient.</p>
          </Section>

          <Section title="Exceptions" icon={XCircle}>
            <p>Refunds are not available for: (a) pages that have been shared and opened multiple times; (b) requests submitted more than 7 days after purchase; (c) chargebacks initiated without contacting us first (we may dispute them).</p>
          </Section>

          <Section title="How to request" icon={Mail}>
            <p>Email <a href="mailto:refunds@mycupid.net" className="text-primary underline">refunds@mycupid.net</a> with your order email and reason. We respond within 48 business hours and issue approved refunds to your original payment method within 5–10 business days.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
