'use client';
/**
 * BunnyLoveIntro — "Voce me ama?" interactive intro.
 * Inspired by the kawaii cat "Do you love me?" meme.
 *
 * Coelhinho kawaii pergunta "Voce me ama?".
 * YES e NAO lado a lado. NAO encolhe, SIM cresce.
 * SIM → skeptic flow → celebração com coelhinho beijando coração.
 */

import React, { useState, useCallback, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Bunny SVG Component ─────────────────────────────────────────────────────
// A kawaii bunny with swappable eyes, mouth, and expression extras
function BunnySVG({
  eyeHtml, mouthHtml, showSweat, showSteam, showAnger, showTears, idPrefix = '',
}: {
  eyeHtml: string; mouthHtml: string;
  showSweat: boolean; showSteam: boolean; showAnger: boolean; showTears: boolean;
  idPrefix?: string;
}) {
  const p = idPrefix;
  const fixRefs = (html: string) =>
    p ? html.replace(/url\(#(headG|bodyG|cheekG|earPinkL|noseG|padG|tailG)\)/g, `url(#${p}$1)`) : html;

  return (
    <svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id={`${p}headG`} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fff"/>
          <stop offset="100%" stopColor="#f0e8ef"/>
        </radialGradient>
        <radialGradient id={`${p}bodyG`} cx="40%" cy="30%">
          <stop offset="0%" stopColor="#fff"/>
          <stop offset="100%" stopColor="#f0e6ee"/>
        </radialGradient>
        <radialGradient id={`${p}cheekG`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(255,120,160,0.7)"/>
          <stop offset="100%" stopColor="rgba(255,160,185,0)"/>
        </radialGradient>
        <linearGradient id={`${p}earPinkL`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc8e0"/>
          <stop offset="50%" stopColor="#ffaed0"/>
          <stop offset="100%" stopColor="#ff96be"/>
        </linearGradient>
        <radialGradient id={`${p}noseG`} cx="35%" cy="35%">
          <stop offset="0%" stopColor="#ffbed0"/>
          <stop offset="100%" stopColor="#ff90ac"/>
        </radialGradient>
        <radialGradient id={`${p}padG`} cx="35%" cy="35%">
          <stop offset="0%" stopColor="#ffb8c8"/>
          <stop offset="100%" stopColor="#ff9eb8"/>
        </radialGradient>
        <radialGradient id={`${p}tailG`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#fff"/>
          <stop offset="100%" stopColor="#ebe0e8"/>
        </radialGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="100" cy="215" rx="35" ry="6" fill="rgba(0,0,0,0.08)"/>
      {/* Tail */}
      <circle cx="52" cy="160" r="12" fill={`url(#${p}tailG)`} stroke="#d4b0c4" strokeWidth="1.8"/>
      {/* Body */}
      <ellipse cx="100" cy="165" rx="45" ry="33" fill={`url(#${p}bodyG)`} stroke="#d4b0c4" strokeWidth="2.2"/>
      <ellipse cx="100" cy="168" rx="22" ry="18" fill="rgba(255,240,248,0.3)"/>
      {/* Paws */}
      <g>
        <ellipse cx="78" cy="198" rx="16" ry="10" fill={`url(#${p}bodyG)`} stroke="#d4b0c4" strokeWidth="2" transform="rotate(-6,78,198)"/>
        <circle cx="74" cy="197" r="3" fill={`url(#${p}padG)`}/>
        <circle cx="82" cy="197" r="3" fill={`url(#${p}padG)`}/>
        <circle cx="78" cy="201" r="2.5" fill={`url(#${p}padG)`}/>
      </g>
      <g>
        <ellipse cx="122" cy="198" rx="16" ry="10" fill={`url(#${p}bodyG)`} stroke="#d4b0c4" strokeWidth="2" transform="rotate(6,122,198)"/>
        <circle cx="118" cy="197" r="3" fill={`url(#${p}padG)`}/>
        <circle cx="126" cy="197" r="3" fill={`url(#${p}padG)`}/>
        <circle cx="122" cy="201" r="2.5" fill={`url(#${p}padG)`}/>
      </g>

      {/* Left ear */}
      <g style={{ transformOrigin: '72px 82px', animation: 'earWiggle 3s ease-in-out infinite' }}>
        <path d="M72 82 C60 78,54 40,64 15 C68 6,78 5,82 15 C90 38,88 78,72 82Z" fill={`url(#${p}headG)`} stroke="#d4b0c4" strokeWidth="2"/>
        <path d="M74 72 C66 70,62 45,67 26 C70 19,76 19,79 26 C83 43,82 70,74 72Z" fill={`url(#${p}earPinkL)`}/>
      </g>
      {/* Right ear */}
      <g style={{ transformOrigin: '128px 82px', animation: 'earWiggle 3s ease-in-out infinite', animationDelay: '-1s' }}>
        <path d="M128 82 C140 78,146 40,136 15 C132 6,122 5,118 15 C110 38,112 78,128 82Z" fill={`url(#${p}headG)`} stroke="#d4b0c4" strokeWidth="2"/>
        <path d="M126 72 C134 70,138 45,133 26 C130 19,124 19,121 26 C117 43,118 70,126 72Z" fill={`url(#${p}earPinkL)`}/>
      </g>

      {/* Head */}
      <ellipse cx="100" cy="105" rx="58" ry="52" fill={`url(#${p}headG)`} stroke="#d4b0c4" strokeWidth="2.2"/>
      <ellipse cx="90" cy="72" rx="26" ry="14" fill="rgba(255,255,255,0.45)" transform="rotate(-8,90,72)"/>

      {/* Eyes — injected per stage */}
      <g dangerouslySetInnerHTML={{ __html: fixRefs(eyeHtml) }}/>

      {/* Cheeks */}
      <ellipse cx="62" cy="115" rx="16" ry="10" fill={`url(#${p}cheekG)`}/>
      <ellipse cx="138" cy="115" rx="16" ry="10" fill={`url(#${p}cheekG)`}/>

      {/* Nose */}
      <ellipse cx="100" cy="112" rx="5.5" ry="3.8" fill={`url(#${p}noseG)`}/>
      <ellipse cx="98.5" cy="111" rx="1.8" ry="1.1" fill="rgba(255,255,255,0.7)" transform="rotate(-15,98.5,111)"/>

      {/* Mouth — injected per stage */}
      <g dangerouslySetInnerHTML={{ __html: fixRefs(mouthHtml) }}/>

      {/* Extras */}
      {showSweat && (
        <g transform="translate(148,78)">
          <path d="M0 0 Q6 8,0 14 Q-6 8,0 0Z" fill="rgba(130,200,255,0.5)"/>
          <ellipse cx="-1" cy="4" rx="1.5" ry="1" fill="rgba(255,255,255,0.4)"/>
        </g>
      )}
      {showSteam && (
        <g transform="translate(145,70)">
          <path d="M0 8 Q3 4,-3 0" stroke="rgba(255,140,165,0.5)" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M8 8 Q11 4,6 0" stroke="rgba(255,140,165,0.4)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </g>
      )}
      {showAnger && (
        <g transform="translate(150,72)">
          <path d="M-4 -4 L0 0 L4 -4 M-4 4 L0 0 L4 4" stroke="#e05070" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </g>
      )}
      {showTears && (
        <g>
          <path d="M75 110 Q77 118,75 125 Q73 118,75 110Z" fill="rgba(100,180,255,0.45)" style={{ animation: 'tearFall 0.8s ease-in-out infinite' }}/>
          <path d="M125 110 Q127 118,125 125 Q123 118,125 110Z" fill="rgba(100,180,255,0.45)" style={{ animation: 'tearFall 0.8s ease-in-out infinite' }}/>
        </g>
      )}
    </svg>
  );
}

// ─── Bunny holding heart SVG (final celebration) ─────────────────────────────
function BunnyKissSVG({ idPrefix = '' }: { idPrefix?: string }) {
  const p = idPrefix;
  return (
    <svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id={`${p}kHeadG`} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fff"/>
          <stop offset="100%" stopColor="#f0e8ef"/>
        </radialGradient>
        <radialGradient id={`${p}kBodyG`} cx="40%" cy="30%">
          <stop offset="0%" stopColor="#fff"/>
          <stop offset="100%" stopColor="#f0e6ee"/>
        </radialGradient>
        <radialGradient id={`${p}kCheekG`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(255,120,160,0.7)"/>
          <stop offset="100%" stopColor="rgba(255,160,185,0)"/>
        </radialGradient>
        <linearGradient id={`${p}kEarPinkL`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc8e0"/>
          <stop offset="50%" stopColor="#ffaed0"/>
          <stop offset="100%" stopColor="#ff96be"/>
        </linearGradient>
        <radialGradient id={`${p}kNoseG`} cx="35%" cy="35%">
          <stop offset="0%" stopColor="#ffbed0"/>
          <stop offset="100%" stopColor="#ff90ac"/>
        </radialGradient>
        <radialGradient id={`${p}kHeartG`} cx="40%" cy="30%">
          <stop offset="0%" stopColor="#ff8aab"/>
          <stop offset="100%" stopColor="#ff4d78"/>
        </radialGradient>
      </defs>

      {/* Big heart — bunny is hugging it */}
      <g transform="translate(148,65)">
        <path d="M0 40 C-50 -5,-30-45,0-15 C30-45,50-5,0 40Z" fill={`url(#${p}kHeartG)`} stroke="#e04070" strokeWidth="2"/>
        {/* Heart shine */}
        <ellipse cx="-12" cy="-8" rx="8" ry="5" fill="rgba(255,255,255,0.35)" transform="rotate(-25,-12,-8)"/>
      </g>

      {/* Shadow */}
      <ellipse cx="100" cy="188" rx="45" ry="6" fill="rgba(0,0,0,0.06)"/>

      {/* Body — slightly tilted toward heart */}
      <ellipse cx="95" cy="145" rx="40" ry="30" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="2" transform="rotate(5,95,145)"/>
      <ellipse cx="95" cy="148" rx="20" ry="15" fill="rgba(255,240,248,0.3)"/>

      {/* Paws */}
      <ellipse cx="72" cy="172" rx="14" ry="9" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.8" transform="rotate(-5,72,172)"/>
      <ellipse cx="118" cy="172" rx="14" ry="9" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.8" transform="rotate(5,118,172)"/>

      {/* Left arm — reaching toward heart */}
      <path d="M60 130 Q45 110,55 95 Q60 88,65 93 Q72 100,68 115Z" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.8"/>
      {/* Right arm — hugging the heart */}
      <path d="M130 125 Q145 105,155 85 Q160 78,163 83 Q168 95,148 115Z" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.8"/>
      {/* Right hand/paw on heart */}
      <circle cx="158" cy="82" r="7" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.5"/>

      {/* Left ear */}
      <g style={{ transformOrigin: '70px 68px', animation: 'earWiggle 3s ease-in-out infinite' }}>
        <path d="M70 68 C58 64,52 30,62 8 C65 0,75-1,78 8 C85 28,84 64,70 68Z" fill={`url(#${p}kHeadG)`} stroke="#d4b0c4" strokeWidth="2"/>
        <path d="M72 58 C65 56,61 35,65 19 C67 13,73 13,75 19 C79 34,78 56,72 58Z" fill={`url(#${p}kEarPinkL)`}/>
      </g>
      {/* Right ear */}
      <g style={{ transformOrigin: '120px 68px', animation: 'earWiggle 3s ease-in-out infinite', animationDelay: '-1s' }}>
        <path d="M120 68 C132 64,138 30,128 8 C125 0,115-1,112 8 C105 28,106 64,120 68Z" fill={`url(#${p}kHeadG)`} stroke="#d4b0c4" strokeWidth="2"/>
        <path d="M118 58 C125 56,129 35,125 19 C123 13,117 13,115 19 C111 34,112 56,118 58Z" fill={`url(#${p}kEarPinkL)`}/>
      </g>

      {/* Head */}
      <ellipse cx="95" cy="88" rx="50" ry="45" fill={`url(#${p}kHeadG)`} stroke="#d4b0c4" strokeWidth="2.2"/>
      <ellipse cx="85" cy="60" rx="22" ry="12" fill="rgba(255,255,255,0.45)" transform="rotate(-8,85,60)"/>

      {/* Eyes — closed happy */}
      <path d="M72 88 Q80 78,88 88" stroke="#1a1018" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M102 88 Q110 78,118 88" stroke="#1a1018" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* Cheeks */}
      <ellipse cx="60" cy="98" rx="13" ry="8" fill={`url(#${p}kCheekG)`}/>
      <ellipse cx="128" cy="98" rx="13" ry="8" fill={`url(#${p}kCheekG)`}/>

      {/* Nose */}
      <ellipse cx="95" cy="95" rx="4.5" ry="3" fill={`url(#${p}kNoseG)`}/>

      {/* Kiss mouth — puckered toward heart side */}
      <ellipse cx="103" cy="102" rx="5" ry="3.5" fill="#e06080" stroke="#c04868" strokeWidth="1"/>
      <ellipse cx="102" cy="101" rx="1.8" ry="1" fill="rgba(255,255,255,0.45)" transform="rotate(-20,102,101)"/>

      {/* Little kiss marks near heart */}
      <g opacity="0.7">
        <text x="135" y="60" fontSize="12" fill="#ff6b8a">💋</text>
      </g>
    </svg>
  );
}

// ─── SVG Eye templates ───────────────────────────────────────────────────────
const EYES: Record<string, string> = {
  normal: `<circle cx="80" cy="102" r="8.5" fill="#1a1018"/>
    <ellipse cx="76.5" cy="99" rx="4" ry="3.6" fill="#fff" transform="rotate(-20,76.5,99)"/>
    <circle cx="83" cy="105" r="1.8" fill="rgba(255,255,255,0.6)"/>
    <circle cx="120" cy="102" r="8.5" fill="#1a1018"/>
    <ellipse cx="116.5" cy="99" rx="4" ry="3.6" fill="#fff" transform="rotate(-20,116.5,99)"/>
    <circle cx="123" cy="105" r="1.8" fill="rgba(255,255,255,0.6)"/>`,

  half: `<ellipse cx="80" cy="104" rx="8" ry="5" fill="#1a1018"/>
    <ellipse cx="77" cy="103" rx="3" ry="2" fill="#fff"/>
    <path d="M70 100 Q80 94,90 100" fill="url(#headG)" stroke="#1a1018" stroke-width="1.5"/>
    <ellipse cx="120" cy="104" rx="8" ry="5" fill="#1a1018"/>
    <ellipse cx="117" cy="103" rx="3" ry="2" fill="#fff"/>
    <path d="M110 100 Q120 94,130 100" fill="url(#headG)" stroke="#1a1018" stroke-width="1.5"/>`,

  squint: `<path d="M72 105 Q80 95,88 105" stroke="#1a1018" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M112 105 Q120 95,128 105" stroke="#1a1018" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  side: `<circle cx="80" cy="102" r="8.5" fill="#1a1018"/>
    <ellipse cx="85" cy="100" rx="3.2" ry="3" fill="#fff"/>
    <circle cx="86" cy="102" r="1" fill="rgba(255,255,255,0.5)"/>
    <circle cx="120" cy="102" r="8.5" fill="#1a1018"/>
    <ellipse cx="125" cy="100" rx="3.2" ry="3" fill="#fff"/>
    <circle cx="126" cy="102" r="1" fill="rgba(255,255,255,0.5)"/>`,

  angry: `<circle cx="80" cy="104" r="7" fill="#1a1018"/>
    <ellipse cx="78" cy="103" rx="2.5" ry="2" fill="#fff"/>
    <line x1="68" y1="89" x2="92" y2="96" stroke="#1a1018" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="120" cy="104" r="7" fill="#1a1018"/>
    <ellipse cx="118" cy="103" rx="2.5" ry="2" fill="#fff"/>
    <line x1="132" y1="89" x2="108" y2="96" stroke="#1a1018" stroke-width="3.5" stroke-linecap="round"/>`,

  closed: `<path d="M72 102 Q80 112,88 102" stroke="#1a1018" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M112 102 Q120 112,128 102" stroke="#1a1018" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  cry: `<path d="M72 102 Q80 112,88 102" stroke="#1a1018" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M112 102 Q120 112,128 102" stroke="#1a1018" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M74 108 Q72 118,74 126" stroke="rgba(100,180,255,0.6)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M126 108 Q128 118,126 126" stroke="rgba(100,180,255,0.6)" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,

  hearteye: `<g transform="translate(80,102) scale(0.72)">
    <path d="M0 6 C-14 -2,-8-14,0-5 C8-14,14-2,0 6Z" fill="#ff4d78"/>
    <ellipse cx="-3.5" cy="-4" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.55)" transform="rotate(-30,-3.5,-4)"/>
  </g>
  <g transform="translate(120,102) scale(0.72)">
    <path d="M0 6 C-14 -2,-8-14,0-5 C8-14,14-2,0 6Z" fill="#ff4d78"/>
    <ellipse cx="-3.5" cy="-4" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.55)" transform="rotate(-30,-3.5,-4)"/>
  </g>`,

  happy: `<circle cx="80" cy="102" r="9.5" fill="#1a1018"/>
    <ellipse cx="76" cy="98" rx="4.5" ry="4" fill="#fff" transform="rotate(-15,76,98)"/>
    <circle cx="84" cy="105" r="2.2" fill="#fff"/>
    <circle cx="120" cy="102" r="9.5" fill="#1a1018"/>
    <ellipse cx="116" cy="98" rx="4.5" ry="4" fill="#fff" transform="rotate(-15,116,98)"/>
    <circle cx="124" cy="105" r="2.2" fill="#fff"/>`,

  suspicious: `<circle cx="80" cy="102" r="8.5" fill="#1a1018"/>
    <ellipse cx="76.5" cy="99" rx="4" ry="3.6" fill="#fff" transform="rotate(-20,76.5,99)"/>
    <circle cx="83" cy="105" r="1.8" fill="rgba(255,255,255,0.6)"/>
    <line x1="68" y1="96" x2="92" y2="93" stroke="#1a1018" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="120" cy="102" r="8.5" fill="#1a1018"/>
    <ellipse cx="116.5" cy="99" rx="4" ry="3.6" fill="#fff" transform="rotate(-20,116.5,99)"/>
    <circle cx="123" cy="105" r="1.8" fill="rgba(255,255,255,0.6)"/>
    <line x1="108" y1="93" x2="132" y2="96" stroke="#1a1018" stroke-width="2.5" stroke-linecap="round"/>`,

  wideEye: `<circle cx="80" cy="102" r="11" fill="#1a1018"/>
    <ellipse cx="76" cy="98" rx="5" ry="4.5" fill="#fff" transform="rotate(-15,76,98)"/>
    <circle cx="83" cy="104" r="2" fill="rgba(255,255,255,0.6)"/>
    <circle cx="120" cy="102" r="11" fill="#1a1018"/>
    <ellipse cx="116" cy="98" rx="5" ry="4.5" fill="#fff" transform="rotate(-15,116,98)"/>
    <circle cx="123" cy="104" r="2" fill="rgba(255,255,255,0.6)"/>`,
};

// ─── SVG Mouth templates ─────────────────────────────────────────────────────
const MOUTHS: Record<string, string> = {
  smile: `<path d="M93 119 Q100 127,107 119" stroke="#b07888" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  pout: `<path d="M91 119 Q95 123,100 120 Q105 123,109 119" stroke="#b07888" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  wavy: `<path d="M90 121 Q93 117,97 121 Q100 125,103 121 Q107 117,110 121" stroke="#b07888" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  frown: `<path d="M92 124 Q100 116,108 124" stroke="#b07888" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  open: `<ellipse cx="100" cy="122" rx="8" ry="7" fill="#3a1020"/>
    <ellipse cx="100" cy="126" rx="5" ry="3.5" fill="#ff7a9a"/>`,
  kiss: `<ellipse cx="108" cy="120" rx="5.5" ry="4" fill="#e06080" stroke="#c04868" stroke-width="1.2"/>
    <ellipse cx="107" cy="118.5" rx="2" ry="1.1" fill="rgba(255,255,255,0.5)" transform="rotate(-20,107,118.5)"/>`,
  bigSmile: `<path d="M86 118 Q100 135,114 118" stroke="#b07888" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M90 119 Q100 131,110 119" fill="rgba(60,15,30,0.25)"/>`,
};

// ─── Expression emojis that float outside the bunny ──────────────────────────
const STAGE_EMOJIS: Record<number, string[]> = {
  0: [],
  1: ['❓'],
  2: ['❓', '❓'],
  3: ['😰'],
  4: ['😥', '💔'],
  5: ['😢', '💧'],
  6: ['😤', '💢'],
  7: ['😭', '💧', '💧'],
  8: ['😭', '😭'],
  9: ['😭', '🥺', '💔'],
};

// ─── Stage config ─────────────────────────────────────────────────────────────
interface Stage {
  ey: string; mo: string; an: string;
  sw: boolean; st: boolean; ag: boolean; te: boolean;
  tx: string; yT: string; nT: string;
  // Percentage-based widths for side-by-side layout
  yW: number; nW: number; nO: number;
}

const STAGES: Stage[] = [
  { ey:'normal', mo:'smile',  an:'bounce', sw:false, st:false, ag:false, te:false,
    tx:'Voce me ama? ❤️',           yT:'SIM',           nT:'NAO.',   yW:45, nW:45, nO:1 },
  { ey:'half',   mo:'pout',   an:'shake',  sw:false, st:false, ag:false, te:false,
    tx:'espera... tem certeza? 🥺',  yT:'SIM',           nT:'NAO.',   yW:48, nW:42, nO:.95 },
  { ey:'squint', mo:'wavy',   an:'bounce', sw:false, st:false, ag:false, te:false,
    tx:'pensa direito...',           yT:'SIM',           nT:'nao',    yW:52, nW:38, nO:.85 },
  { ey:'side',   mo:'frown',  an:'shake',  sw:true,  st:false, ag:false, te:false,
    tx:'ta brincando ne...? 😰',     yT:'SIM!',          nT:'nao..',  yW:58, nW:32, nO:.7 },
  { ey:'half',   mo:'pout',   an:'sad',    sw:false, st:false, ag:false, te:false,
    tx:'nao ta certo isso...',       yT:'SIM!!',         nT:'nao..',  yW:62, nW:28, nO:.55 },
  { ey:'cry',    mo:'frown',  an:'cry',    sw:false, st:false, ag:false, te:true,
    tx:'voce nao me ama...? 😢',     yT:'EU TE AMO',     nT:'n...',   yW:68, nW:22, nO:.4 },
  { ey:'angry',  mo:'open',   an:'angry',  sw:false, st:true,  ag:true,  te:false,
    tx:'tenta de novo 🤨',           yT:'SIMM!!!',       nT:'n.',     yW:74, nW:18, nO:.3 },
  { ey:'cry',    mo:'pout',   an:'cry',    sw:true,  st:false, ag:false, te:true,
    tx:'fala serio...',              yT:'POR FAVOR SIM',  nT:'..',    yW:78, nW:14, nO:.2 },
  { ey:'closed', mo:'frown',  an:'cry',    sw:false, st:false, ag:false, te:true,
    tx:'ta me zoando... 😭',         yT:'SIM SIM SIM',   nT:'.',      yW:84, nW:10, nO:.15 },
  { ey:'cry',    mo:'wavy',   an:'cry',    sw:false, st:false, ag:false, te:true,
    tx:'ultima chance...',           yT:'DIGA SIM!!',    nT:'.',      yW:90, nW:6,  nO:.15 },
];

// ─── SIM skeptic stages ─────────────────────────────────────────────────────
interface SimStage {
  ey: string; mo: string; an: string;
  tx: string; btnText: string;
}

const SIM_STAGES: SimStage[] = [
  { ey: 'wideEye',    mo: 'open',     an: 'shake',  tx: 'espera... serio?! 😳',        btnText: 'SIM!' },
  { ey: 'suspicious', mo: 'pout',     an: 'bounce', tx: 'hmmm tem certeza mesmo?',      btnText: 'TENHO!' },
  { ey: 'squint',     mo: 'wavy',     an: 'shake',  tx: 'ce acha que me ama mais? 🤔',  btnText: 'COM CERTEZA' },
  { ey: 'side',       mo: 'smile',    an: 'bounce', tx: 'promete que e pra sempre?',     btnText: 'PROMETO!' },
  { ey: 'happy',      mo: 'bigSmile', an: 'happy',  tx: 'AAAA EU SABIAAAA!!! 🥹',       btnText: '❤️ SIM PRA SEMPRE ❤️' },
];

// ─── Floating heart ──────────────────────────────────────────────────────────
interface FloatingHeart { id: number; x: number; emoji: string; duration: number; size: number }

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
interface Props { onReveal: () => void }

export default function BunnyLoveIntro({ onReveal }: Props) {
  const [stageIdx, setStageIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [simFlow, setSimFlow] = useState(false);
  const [simStageIdx, setSimStageIdx] = useState(0);
  const lockRef = useRef(false);
  const heartIdRef = useRef(0);

  const svgId = useId().replace(/:/g, '');
  const stage = STAGES[Math.min(stageIdx, STAGES.length - 1)];
  const simStage = SIM_STAGES[Math.min(simStageIdx, SIM_STAGES.length - 1)];

  const vib = (ms: number | number[]) => {
    try { navigator?.vibrate?.(ms); } catch {}
  };

  // launch floating hearts
  const launchHearts = useCallback((count: number, container: HTMLElement) => {
    const emojis = ['❤️','💕','💖','💗','💝'];
    let added = 0;
    const interval = setInterval(() => {
      if (added >= count) { clearInterval(interval); return; }
      const newHeart: FloatingHeart = {
        id: heartIdRef.current++,
        x: 10 + Math.random() * 80,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        duration: 3 + Math.random() * 3,
        size: 14 + Math.random() * 16,
      };
      setHearts(prev => [...prev, newHeart]);
      added++;
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, (newHeart.duration + 0.5) * 1000);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleNo = useCallback(() => {
    if (lockRef.current || done) return;
    lockRef.current = true;
    vib(50);
    setStageIdx(prev => Math.min(prev + 1, STAGES.length - 1));
    setTimeout(() => { lockRef.current = false; }, 150);
  }, [done]);

  const triggerCelebration = useCallback(() => {
    setDone(true);
    setCelebrating(true);
    vib([100, 50, 100, 50, 200]);
    setTimeout(() => {
      setShowFinal(true);
      const container = document.getElementById('bunny-love-container');
      if (container) launchHearts(30, container);
      setTimeout(() => onReveal(), 2800);
    }, 500);
  }, [launchHearts, onReveal]);

  const handleYes = useCallback(() => {
    if (done || lockRef.current) return;
    lockRef.current = true;
    vib(50);

    if (!simFlow) {
      setSimFlow(true);
      setSimStageIdx(0);
    } else if (simStageIdx < SIM_STAGES.length - 1) {
      setSimStageIdx(prev => prev + 1);
    } else {
      triggerCelebration();
    }
    setTimeout(() => { lockRef.current = false; }, 150);
  }, [done, simFlow, simStageIdx, triggerCelebration]);

  const bunnyAnim = {
    bounce: { y: [0, -6, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const } },
    shake: { rotate: [0, -4, 4, -3, 3, 0], transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' as const } },
    sad: { y: [0, 3, 0], rotate: [0, -2, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const } },
    angry: { x: [0, -3, 3, -2, 2, 0], transition: { duration: 0.4, repeat: Infinity, ease: 'easeInOut' as const } },
    cry: { y: [0, 3, 2, 0], rotate: [0, -2, 2, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const } },
    happy: { y: [0, -8, 0], scale: [1, 1.05, 1], transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' as const } },
  };

  const activeAn = simFlow ? simStage.an : stage.an;
  const currentAnim = celebrating ? bunnyAnim.happy : bunnyAnim[activeAn as keyof typeof bunnyAnim] || bunnyAnim.bounce;
  const activeEy = celebrating ? EYES.hearteye : simFlow ? (EYES[simStage.ey] || EYES.normal) : (EYES[stage.ey] || EYES.normal);
  const activeMo = celebrating ? MOUTHS.kiss : simFlow ? (MOUTHS[simStage.mo] || MOUTHS.smile) : (MOUTHS[stage.mo] || MOUTHS.smile);
  const activeTx = celebrating ? 'EU SABIA!!!' : simFlow ? simStage.tx : stage.tx;

  // Expression emojis around the bunny
  const currentEmojis = !simFlow && !celebrating ? (STAGE_EMOJIS[stageIdx] || []) : [];

  return (
    <>
      <style>{`
        @keyframes earWiggle { 0%,100%{transform:rotate(0)} 50%{transform:rotate(3deg)} }
        @keyframes tearFall { 0%,100%{transform:translateY(0);opacity:.7} 50%{transform:translateY(5px);opacity:.4} }
        @keyframes floatUp { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-400px) scale(0.5) rotate(15deg);opacity:0} }
        @keyframes emojiFloat { 0%{opacity:0;transform:translateY(5px) scale(0.5)} 30%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-15px) scale(0.8)} }
      `}</style>

      <div
        id="bunny-love-container"
        style={{
          position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden',
          borderRadius: 'inherit', touchAction: 'manipulation',
          background: '#f8e8ee',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px 20px',
          gap: 6,
          userSelect: 'none',
        }}
      >
        {/* Floating hearts (celebration) */}
        {hearts.map(h => (
          <div key={h.id} style={{
            position: 'absolute', left: `${h.x}%`, bottom: -30,
            fontSize: h.size, pointerEvents: 'none', zIndex: 100,
            animation: `floatUp ${h.duration}s linear forwards`,
          }}>{h.emoji}</div>
        ))}

        {/* Main game UI */}
        <AnimatePresence mode="popLayout">
          {!showFinal ? (
            <motion.div
              key="game"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}
            >
              {/* Bunny + floating expression emojis */}
              <div style={{ position: 'relative', width: 160, height: 175 }}>
                <motion.div
                  key={`bunny-${stageIdx}-${simStageIdx}-${simFlow}`}
                  animate={currentAnim}
                  style={{ width: '100%', height: '100%' }}
                >
                  <BunnySVG
                    eyeHtml={activeEy}
                    mouthHtml={activeMo}
                    showSweat={!simFlow && stage.sw && !celebrating}
                    showSteam={!simFlow && stage.st && !celebrating}
                    showAnger={!simFlow && stage.ag && !celebrating}
                    showTears={!simFlow && stage.te && !celebrating}
                    idPrefix={svgId}
                  />
                </motion.div>

                {/* Expression emojis floating around bunny */}
                {currentEmojis.map((emoji, i) => {
                  const positions = [
                    { x: -18, y: 10 },
                    { x: 155, y: 15 },
                    { x: -15, y: 60 },
                    { x: 158, y: 55 },
                  ];
                  const pos = positions[i % positions.length];
                  return (
                    <motion.div
                      key={`expr-${stageIdx}-${i}`}
                      initial={{ opacity: 0, scale: 0.5, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      style={{
                        position: 'absolute', left: pos.x, top: pos.y,
                        fontSize: 18, pointerEvents: 'none',
                      }}
                    >
                      {emoji}
                    </motion.div>
                  );
                })}
              </div>

              {/* Text — no animation, instant */}
              <p style={{
                color: celebrating ? '#5ee8b5' : simFlow ? '#e8456a' : '#e8456a',
                fontWeight: 800, fontSize: 17, textAlign: 'center',
                padding: '0 12px', minHeight: 24,
              }}>
                {activeTx}
              </p>

              {/* Buttons — YES and NO side by side */}
              {!celebrating && !simFlow && (
                <div style={{
                  width: '100%', display: 'flex', flexDirection: 'row',
                  justifyContent: 'center', gap: 12, marginTop: 8, padding: '0 12px',
                }}>
                  {/* YES button — grows */}
                  <motion.button
                    onClick={handleYes}
                    animate={{ flex: `0 0 ${stage.yW}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    whileTap={{ scale: 0.93 }}
                    style={{
                      background: '#5ee8b5',
                      border: 'none', color: '#fff', fontWeight: 900,
                      borderRadius: 12, cursor: 'pointer', letterSpacing: 1,
                      padding: '12px 8px',
                      fontSize: 16 + Math.min(stageIdx * 2, 18),
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {stage.yT}
                  </motion.button>

                  {/* NO button — shrinks */}
                  <motion.button
                    onClick={handleNo}
                    animate={{
                      flex: `0 0 ${stage.nW}%`,
                      opacity: stage.nO,
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    whileTap={{ scale: 0.88 }}
                    style={{
                      background: '#f087a0',
                      border: 'none', color: '#fff', fontWeight: 900,
                      borderRadius: 12, cursor: 'pointer', letterSpacing: 1,
                      padding: '12px 8px',
                      fontSize: Math.max(10, 16 - stageIdx * 1),
                      WebkitTapHighlightColor: 'transparent',
                      overflow: 'hidden', whiteSpace: 'nowrap',
                    }}
                  >
                    {stage.nT}
                  </motion.button>
                </div>
              )}

              {/* SIM skeptic flow — single button */}
              {!celebrating && simFlow && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 8, padding: '0 12px' }}>
                  <motion.button
                    key={`sim-btn-${simStageIdx}`}
                    onClick={handleYes}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{
                      background: simStageIdx >= SIM_STAGES.length - 1
                        ? 'linear-gradient(180deg,#ff8aab,#ff5e8a)'
                        : '#5ee8b5',
                      border: 'none', color: '#fff', fontWeight: 900,
                      borderRadius: 12, cursor: 'pointer', letterSpacing: 1,
                      padding: `${12 + simStageIdx}px 24px`,
                      fontSize: 16 + simStageIdx * 2,
                      width: `${55 + simStageIdx * 8}%`,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {simStage.btnText}
                  </motion.button>
                </div>
              )}

              {/* Celebrating state */}
              {celebrating && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    background: 'linear-gradient(180deg,#ff8aab,#ff5e8a)',
                    color: '#fff', fontWeight: 900,
                    borderRadius: 12, letterSpacing: 1, padding: '12px 24px',
                    fontSize: 18, textAlign: 'center',
                  }}
                >
                  ❤️ SIM!!! ❤️
                </motion.div>
              )}
            </motion.div>
          ) : (
            // ── Final overlay — bunny kissing/holding heart ──
            <motion.div
              key="final"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 8, width: '100%',
              }}
            >
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                style={{
                  color: '#e8456a', fontWeight: 900, fontSize: 19, textAlign: 'center',
                  padding: '0 16px',
                }}
              >
                eu sabia que vc ia dizer sim 💕
              </motion.p>

              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.15 }}
                style={{ width: 200, height: 170 }}
              >
                <motion.div
                  animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <BunnyKissSVG idPrefix={`${svgId}k`} />
                </motion.div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 1, 0.5] }}
                transition={{ delay: 0.5, duration: 1.5, repeat: Infinity }}
                style={{
                  color: 'rgba(180,80,120,0.5)', fontSize: 11, letterSpacing: 2,
                  textTransform: 'uppercase', fontWeight: 600,
                }}
              >
                revelando sua surpresa...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
