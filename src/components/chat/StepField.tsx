'use client';

import React from 'react';
import type { ChatStepKey } from '@/lib/chat-script';
import TitleField from './fields/TitleField';
import MessageField from './fields/MessageField';
import DateField from './fields/DateField';
import GalleryField from './fields/GalleryField';
import TimelineField from './fields/TimelineField';
import IntroField from './fields/IntroField';
import MusicField from './fields/MusicField';
import VoiceField from './fields/VoiceField';
import BackgroundField from './fields/BackgroundField';
import ExtrasField from './fields/ExtrasField';
import PlanField from './fields/PlanField';
import PaymentField from './fields/PaymentField';

interface StepFieldProps {
  step: ChatStepKey;
  titlePlaceholder?: string;
  messagePlaceholder?: string;
}

export default function StepField({ step, titlePlaceholder, messagePlaceholder }: StepFieldProps) {
  switch (step) {
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
    case 'title':
      return ['title'];
    case 'message':
      return ['message'];
    case 'specialDate':
      return ['specialDate'];
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
