"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, User, CreditCard, Scale, RefreshCcw, Lock, Copyright, XCircle, Edit3, Gavel, Mail, Info } from 'lucide-react';

const Section = ({ title, icon: Icon, children }: { title: string, icon: React.FC<any>, children: React.ReactNode }) => (
  <section className="space-y-4 scroll-mt-24">
    <h2 className="flex items-center gap-3 text-2xl font-bold font-headline text-primary border-b border-primary/20 pb-2">
      <Icon className="w-6 h-6" />
      <span>{title}</span>
    </h2>
    <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container py-16 md:py-24 max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to home</Link>
        </Button>
        <div className="mb-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-foreground">Terms of Service</h1>
          <p className="mt-3 text-muted-foreground">Last updated: January 2026</p>
        </div>

        <div className="space-y-10">
          <Section title="1. Acceptance" icon={Info}>
            <p>By accessing or using MyCupid ("Service", "we", "us"), you agree to these Terms of Service. If you do not agree, please do not use the Service. These Terms form a binding agreement between you and MyCupid.</p>
          </Section>

          <Section title="2. The Service" icon={FileText}>
            <p>MyCupid lets you create personalized digital love pages with photos, videos, music, countdowns and custom messages. Pages are hosted on our platform and accessible via a unique link and optional QR code.</p>
          </Section>

          <Section title="3. Your Account" icon={User}>
            <p>You are responsible for keeping your account credentials confidential and for all activity under your account. You must be at least 18 years old to purchase. If you create content on behalf of a minor, you confirm that you have the authority to do so.</p>
          </Section>

          <Section title="4. Payments & Pricing" icon={CreditCard}>
            <p>All prices are displayed in USD and processed securely via Stripe. Charges are one-time (not recurring) unless explicitly stated. You authorize us to charge the payment method you provide for the plan and add-ons you select. Applicable sales taxes may be collected at checkout.</p>
          </Section>

          <Section title="5. Refund Policy" icon={RefreshCcw}>
            <p>We offer a 7-day money-back guarantee from the date of purchase, provided the page has not been delivered or shared. Because the Service delivers a digital product tied to personal content you create, refunds for already-shared pages are handled case-by-case. See our <Link href="/refunds" className="text-primary underline">Refund Policy</Link> for full details.</p>
          </Section>

          <Section title="6. Your Content" icon={Copyright}>
            <p>You retain ownership of all photos, videos, music references, messages and other content you upload ("Your Content"). You grant MyCupid a limited, non-exclusive license to host, display and deliver Your Content solely to operate the Service. We do not sell, sublicense or use Your Content for any other purpose.</p>
            <p>You are solely responsible for Your Content and must have the right to upload it. You agree not to upload content that infringes intellectual property rights, violates privacy, contains hate speech, sexual content involving minors, or violates any law.</p>
          </Section>

          <Section title="7. Acceptable Use" icon={Scale}>
            <p>You agree not to: (a) use the Service to harass, threaten or impersonate others; (b) upload malware or attempt to compromise the Service; (c) resell, reverse-engineer, or scrape the Service; (d) use the Service for unlawful purposes.</p>
          </Section>

          <Section title="8. Privacy" icon={Lock}>
            <p>Our use of personal information is described in our <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>. By using the Service, you consent to that policy.</p>
          </Section>

          <Section title="9. Termination" icon={XCircle}>
            <p>We may suspend or terminate your access if you breach these Terms or if required by law. You may stop using the Service at any time. Upon termination, created pages may become inaccessible; we will provide reasonable notice when possible.</p>
          </Section>

          <Section title="10. Changes" icon={Edit3}>
            <p>We may update these Terms occasionally. Material changes will be announced on this page with an updated "Last updated" date. Continued use after changes means you accept them.</p>
          </Section>

          <Section title="11. Governing Law" icon={Gavel}>
            <p>These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-law rules. Disputes will be resolved in the state or federal courts located in Delaware.</p>
          </Section>

          <Section title="12. Contact" icon={Mail}>
            <p>For questions about these Terms, contact us at <a href="mailto:support@mycupid.net" className="text-primary underline">support@mycupid.net</a>.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
