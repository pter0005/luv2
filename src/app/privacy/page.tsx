"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Database, Eye, Share2, Trash2, Cookie, Mail } from 'lucide-react';

const Section = ({ title, icon: Icon, children }: { title: string, icon: React.FC<any>, children: React.ReactNode }) => (
  <section className="space-y-4 scroll-mt-24">
    <h2 className="flex items-center gap-3 text-2xl font-bold font-headline text-primary border-b border-primary/20 pb-2">
      <Icon className="w-6 h-6" />
      <span>{title}</span>
    </h2>
    <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container py-16 md:py-24 max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to home</Link>
        </Button>
        <div className="mb-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-foreground">Privacy Policy</h1>
          <p className="mt-3 text-muted-foreground">Last updated: January 2026</p>
        </div>

        <div className="space-y-10">
          <Section title="Information we collect" icon={Database}>
            <p>To provide the Service we collect: (a) account info — email, display name, phone; (b) content you upload — photos, videos, audio, text; (c) payment info — handled by Stripe; we never store raw card data; (d) technical info — IP, browser, device, anonymized analytics.</p>
          </Section>

          <Section title="How we use your information" icon={Eye}>
            <p>We use your information to: create and deliver your love pages; process payments; communicate service updates and receipts; prevent fraud; improve the Service. We do not sell your personal data.</p>
          </Section>

          <Section title="How we share" icon={Share2}>
            <p>We share data only with processors that help us operate: Stripe (payments), Firebase/Google Cloud (hosting & database), Resend (transactional email), analytics providers (Meta, TikTok, Google). Each has contractual obligations to protect your data.</p>
          </Section>

          <Section title="Your rights (CCPA/CPRA)" icon={Shield}>
            <p>If you are a California resident, you have the right to: know what personal information we collect; request deletion; opt out of sale/sharing (we do not sell); correct inaccurate data; limit use of sensitive information; non-discrimination for exercising these rights.</p>
            <p>To exercise these rights, contact <a href="mailto:privacy@mycupid.net" className="text-primary underline">privacy@mycupid.net</a>. We will respond within 45 days.</p>
          </Section>

          <Section title="Data retention & deletion" icon={Trash2}>
            <p>We retain your content for as long as your account is active or as needed to provide the Service. You can request deletion at any time by emailing us. Some data may be retained for legal, accounting or fraud-prevention purposes.</p>
          </Section>

          <Section title="Cookies & tracking" icon={Cookie}>
            <p>We use cookies and similar technologies for authentication, preferences (including language) and analytics. You can manage cookies in your browser settings. Disabling cookies may limit functionality.</p>
          </Section>

          <Section title="Children" icon={Shield}>
            <p>The Service is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us data, contact us for prompt deletion.</p>
          </Section>

          <Section title="Contact" icon={Mail}>
            <p>Questions about this policy or your data? Email <a href="mailto:privacy@mycupid.net" className="text-primary underline">privacy@mycupid.net</a>.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
