'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { ChatStepKey } from '@/lib/chat-script';

interface StepFieldProps {
  step: ChatStepKey;
  titlePlaceholder?: string;
  messagePlaceholder?: string;
}

const Skeleton = () => (
  <div className="flex items-center justify-center py-8 text-muted-foreground">
    <Loader2 className="w-5 h-5 animate-spin" />
  </div>
);

const lazyField = <P,>(loader: () => Promise<{ default: React.ComponentType<P> }>) =>
  dynamic(loader, { ssr: false, loading: Skeleton });

const RecipientNameField = lazyField<{ placeholder?: string }>(() => import('./fields/RecipientNameField'));
const TitleField = lazyField<{ placeholder?: string }>(() => import('./fields/TitleField'));
const MessageField = lazyField<{ placeholder?: string }>(() => import('./fields/MessageField'));
const DateField = lazyField<{}>(() => import('./fields/DateField'));
const GalleryField = lazyField<{}>(() => import('./fields/GalleryField'));
const TimelineField = lazyField<{}>(() => import('./fields/TimelineField'));
const IntroField = lazyField<{}>(() => import('./fields/IntroField'));
const MusicField = lazyField<{}>(() => import('./fields/MusicField'));
const VoiceField = lazyField<{}>(() => import('./fields/VoiceField'));
const BackgroundField = lazyField<{}>(() => import('./fields/BackgroundField'));
const ExtrasField = lazyField<{}>(() => import('./fields/ExtrasField'));
const PlanField = lazyField<{}>(() => import('./fields/PlanField'));
const PaymentField = lazyField<{}>(() => import('./fields/PaymentField'));

export default function StepField({ step, titlePlaceholder, messagePlaceholder }: StepFieldProps) {
  switch (step) {
    case 'recipient':
      return <RecipientNameField />;
    case 'title':
      return <TitleField placeholder={titlePlaceholder} />;
    case 'message':
      return <MessageField placeholder={messagePlaceholder} />;
    case 'specialDate':
      return <DateField />;
    case 'gallery':
      return <GalleryField />;
    case 'timeline':
      return <TimelineField />;
    case 'intro':
      return <IntroField />;
    case 'music':
      return <MusicField />;
    case 'voice':
      return <VoiceField />;
    case 'background':
      return <BackgroundField />;
    case 'extras':
      return <ExtrasField />;
    case 'plan':
      return <PlanField />;
    case 'payment':
      return <PaymentField />;
    default:
      return null;
  }
}

export function getFieldsForStep(step: ChatStepKey): (keyof import('@/lib/wizard-schema').PageData)[] {
  switch (step) {
    case 'recipient':
      return ['recipientName'];
    case 'title':
      return ['title'];
    case 'message':
      return ['message'];
    case 'specialDate':
      return ['specialDate', 'countdownStyle', 'countdownColor'];
    case 'gallery':
      return ['galleryImages'];
    case 'timeline':
      return ['timelineEvents'];
    case 'intro':
      return ['introType', 'introGender'];
    case 'music':
      return ['musicOption', 'youtubeUrl'];
    case 'voice':
      return ['audioRecording'];
    case 'background':
      return ['backgroundAnimation', 'heartColor'];
    case 'extras':
      return ['enablePuzzle', 'enableMemoryGame', 'enableQuiz', 'enableWordGame'];
    case 'plan':
      return ['plan'];
    case 'payment':
      return ['payment'];
    default:
      return [];
  }
}

export function getPrefetchForStep(step: ChatStepKey): () => Promise<unknown> {
  switch (step) {
    case 'recipient': return () => import('./fields/RecipientNameField');
    case 'title': return () => import('./fields/TitleField');
    case 'message': return () => import('./fields/MessageField');
    case 'specialDate': return () => import('./fields/DateField');
    case 'gallery': return () => import('./fields/GalleryField');
    case 'timeline': return () => import('./fields/TimelineField');
    case 'intro': return () => import('./fields/IntroField');
    case 'music': return () => import('./fields/MusicField');
    case 'voice': return () => import('./fields/VoiceField');
    case 'background': return () => import('./fields/BackgroundField');
    case 'extras': return () => import('./fields/ExtrasField');
    case 'plan': return () => import('./fields/PlanField');
    case 'payment': return () => import('./fields/PaymentField');
    default: return () => Promise.resolve();
  }
}
