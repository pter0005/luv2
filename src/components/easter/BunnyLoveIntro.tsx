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
// Kawaii bunny with big head, tiny body, stubby arms, and expression marks
function BunnySVG({
  eyeHtml, mouthHtml, showSweat, showSteam, showAnger, showTears,
  showShock, showQuestion, idPrefix = '',
}: {
  eyeHtml: string; mouthHtml: string;
  showSweat: boolean; showSteam: boolean; showAnger: boolean; showTears: boolean;
  showShock?: boolean; showQuestion?: boolean;
  idPrefix?: string;
}) {
  const p = idPrefix;
  const fixRefs = (html: string) =>
    p ? html.replace(/url\(#(headG|bodyG|cheekG|earPinkL|noseG|padG|tailG)\)/g, `url(#${p}$1)`) : html;

  return (
    <svg viewBox="0 0 200 210" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
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
          <stop offset="0%" stopColor="rgba(255,130,170,0.75)"/>
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
      <ellipse cx="100" cy="200" rx="30" ry="5" fill="rgba(0,0,0,0.06)"/>

      {/* Tail — fluffy round */}
      <circle cx="55" cy="162" r="10" fill={`url(#${p}tailG)`} stroke="#d4b0c4" strokeWidth="1.5"/>

      {/* Body — small and round (kawaii proportions: big head, tiny body) */}
      <ellipse cx="100" cy="162" rx="38" ry="28" fill={`url(#${p}bodyG)`} stroke="#d4b0c4" strokeWidth="2"/>
      {/* Belly highlight */}
      <ellipse cx="100" cy="165" rx="18" ry="14" fill="rgba(255,245,250,0.5)"/>

      {/* Stubby feet */}
      <ellipse cx="80" cy="188" rx="13" ry="8" fill={`url(#${p}bodyG)`} stroke="#d4b0c4" strokeWidth="1.8" transform="rotate(-4,80,188)"/>
      <ellipse cx="120" cy="188" rx="13" ry="8" fill={`url(#${p}bodyG)`} stroke="#d4b0c4" strokeWidth="1.8" transform="rotate(4,120,188)"/>
      {/* Toe pads */}
      <circle cx="76" cy="187" r="2.5" fill={`url(#${p}padG)`}/>
      <circle cx="84" cy="187" r="2.5" fill={`url(#${p}padG)`}/>
      <circle cx="116" cy="187" r="2.5" fill={`url(#${p}padG)`}/>
      <circle cx="124" cy="187" r="2.5" fill={`url(#${p}padG)`}/>

      {/* Left arm — stubby, sticking out */}
      <ellipse cx="60" cy="152" rx="11" ry="7" fill={`url(#${p}bodyG)`} stroke="#d4b0c4" strokeWidth="1.8" transform="rotate(-25,60,152)"/>
      {/* Right arm — stubby, sticking out */}
      <ellipse cx="140" cy="152" rx="11" ry="7" fill={`url(#${p}bodyG)`} stroke="#d4b0c4" strokeWidth="1.8" transform="rotate(25,140,152)"/>

      {/* Left ear */}
      <g style={{ transformOrigin: '75px 75px', animation: 'earWiggle 3s ease-in-out infinite' }}>
        <path d="M75 75 C63 71,57 38,66 14 C69 6,79 5,82 14 C89 36,88 71,75 75Z" fill={`url(#${p}headG)`} stroke="#d4b0c4" strokeWidth="2"/>
        <path d="M77 66 C69 64,65 42,69 25 C72 18,78 18,80 25 C84 40,83 64,77 66Z" fill={`url(#${p}earPinkL)`}/>
      </g>
      {/* Right ear */}
      <g style={{ transformOrigin: '125px 75px', animation: 'earWiggle 3s ease-in-out infinite', animationDelay: '-1s' }}>
        <path d="M125 75 C137 71,143 38,134 14 C131 6,121 5,118 14 C111 36,112 71,125 75Z" fill={`url(#${p}headG)`} stroke="#d4b0c4" strokeWidth="2"/>
        <path d="M123 66 C131 64,135 42,131 25 C128 18,122 18,120 25 C116 40,117 64,123 66Z" fill={`url(#${p}earPinkL)`}/>
      </g>

      {/* Head — big and round */}
      <ellipse cx="100" cy="100" rx="55" ry="50" fill={`url(#${p}headG)`} stroke="#d4b0c4" strokeWidth="2.2"/>
      {/* Head shine */}
      <ellipse cx="88" cy="68" rx="24" ry="13" fill="rgba(255,255,255,0.5)" transform="rotate(-8,88,68)"/>

      {/* Eyes — injected per stage */}
      <g dangerouslySetInnerHTML={{ __html: fixRefs(eyeHtml) }}/>

      {/* Cheeks — bigger blush circles */}
      <ellipse cx="60" cy="112" rx="14" ry="9" fill={`url(#${p}cheekG)`}/>
      <ellipse cx="140" cy="112" rx="14" ry="9" fill={`url(#${p}cheekG)`}/>
      {/* Cheek shine dots */}
      <circle cx="55" cy="109" r="1.5" fill="rgba(255,255,255,0.5)"/>
      <circle cx="145" cy="109" r="1.5" fill="rgba(255,255,255,0.5)"/>

      {/* Nose — heart-shaped */}
      <path d="M100 112 C97 108,93 109,95 112 C96 114,100 117,100 117 C100 117,104 114,105 112 C107 109,103 108,100 112Z" fill={`url(#${p}noseG)`}/>

      {/* Mouth — injected per stage */}
      <g dangerouslySetInnerHTML={{ __html: fixRefs(mouthHtml) }}/>

      {/* ── Expression marks (outside the body, manga-style) ── */}

      {/* Sweat drops */}
      {showSweat && <>
        <path d="M152 72 Q156 80,152 88 Q148 80,152 72Z" fill="rgba(130,200,255,0.55)"/>
        <ellipse cx="151" cy="77" rx="1.5" ry="1" fill="rgba(255,255,255,0.5)"/>
      </>}

      {/* Steam puffs (angry) */}
      {showSteam && <>
        <circle cx="155" cy="65" r="4" fill="rgba(255,200,200,0.3)"/>
        <circle cx="162" cy="58" r="5.5" fill="rgba(255,200,200,0.25)"/>
        <circle cx="170" cy="53" r="4" fill="rgba(255,200,200,0.2)"/>
      </>}

      {/* Anger cross mark — 💢 style */}
      {showAnger && (
        <g transform="translate(153,68)">
          <line x1="-5" y1="-5" x2="5" y2="5" stroke="#e05070" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="5" y1="-5" x2="-5" y2="5" stroke="#e05070" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="-5" y1="0" x2="5" y2="0" stroke="#e05070" strokeWidth="2" strokeLinecap="round"/>
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#e05070" strokeWidth="2" strokeLinecap="round"/>
        </g>
      )}

      {/* Tear streams */}
      {showTears && <>
        <path d="M74 110 Q72 120,74 130" stroke="rgba(100,180,255,0.5)" strokeWidth="3" fill="none" strokeLinecap="round" style={{ animation: 'tearFall 0.8s ease-in-out infinite' }}/>
        <path d="M126 110 Q128 120,126 130" stroke="rgba(100,180,255,0.5)" strokeWidth="3" fill="none" strokeLinecap="round" style={{ animation: 'tearFall 0.8s ease-in-out infinite' }}/>
        {/* Extra tear drops */}
        <path d="M70 128 Q72 132,70 136 Q68 132,70 128Z" fill="rgba(100,180,255,0.4)"/>
        <path d="M130 128 Q132 132,130 136 Q128 132,130 128Z" fill="rgba(100,180,255,0.4)"/>
      </>}

      {/* Shock lines — short manga lines radiating out */}
      {showShock && <>
        <line x1="30" y1="70" x2="22" y2="62" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
        <line x1="28" y1="90" x2="18" y2="88" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
        <line x1="32" y1="110" x2="22" y2="115" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="170" y1="70" x2="178" y2="62" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
        <line x1="172" y1="90" x2="182" y2="88" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
        <line x1="168" y1="110" x2="178" y2="115" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
      </>}

      {/* Question marks */}
      {showQuestion && <>
        <text x="155" y="55" fontSize="18" fill="#888" fontWeight="bold" fontFamily="sans-serif">?</text>
        <text x="38" y="60" fontSize="14" fill="#aaa" fontWeight="bold" fontFamily="sans-serif">?</text>
      </>}
    </svg>
  );
}

// ─── Bunny holding heart SVG (final celebration) ─────────────────────────────
// Bunny hugging a big heart with stubby arms, kiss mouth, closed happy eyes
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
          <stop offset="0%" stopColor="rgba(255,130,170,0.75)"/>
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
        <radialGradient id={`${p}kHeartG`} cx="35%" cy="25%">
          <stop offset="0%" stopColor="#ff9ebb"/>
          <stop offset="100%" stopColor="#ff4d78"/>
        </radialGradient>
      </defs>

      {/* ── Big heart the bunny is holding ── */}
      <g transform="translate(155,60)">
        <path d="M0 45 C-55 -5,-33-50,0-18 C33-50,55-5,0 45Z" fill={`url(#${p}kHeartG)`} stroke="#e04070" strokeWidth="2"/>
        {/* Heart shine */}
        <ellipse cx="-14" cy="-10" rx="9" ry="5.5" fill="rgba(255,255,255,0.35)" transform="rotate(-25,-14,-10)"/>
        <circle cx="-8" cy="-18" r="2.5" fill="rgba(255,255,255,0.25)"/>
      </g>

      {/* Shadow */}
      <ellipse cx="105" cy="190" rx="50" ry="5" fill="rgba(0,0,0,0.05)"/>

      {/* Tail */}
      <circle cx="48" cy="155" r="8" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.5"/>

      {/* Body — tilted slightly toward heart */}
      <ellipse cx="90" cy="150" rx="35" ry="26" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="2" transform="rotate(5,90,150)"/>
      {/* Belly */}
      <ellipse cx="90" cy="153" rx="16" ry="12" fill="rgba(255,245,250,0.5)"/>

      {/* Feet */}
      <ellipse cx="70" cy="174" rx="12" ry="7" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.5" transform="rotate(-5,70,174)"/>
      <ellipse cx="110" cy="174" rx="12" ry="7" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.5" transform="rotate(5,110,174)"/>
      {/* Toe pads */}
      <circle cx="66" cy="173" r="2" fill="rgba(255,180,200,0.4)"/>
      <circle cx="74" cy="173" r="2" fill="rgba(255,180,200,0.4)"/>
      <circle cx="106" cy="173" r="2" fill="rgba(255,180,200,0.4)"/>
      <circle cx="114" cy="173" r="2" fill="rgba(255,180,200,0.4)"/>

      {/* Left arm — reaching up toward heart */}
      <path d="M62 135 Q50 115,58 100 Q62 93,66 97 Q72 105,67 120Z" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.8"/>
      {/* Left paw */}
      <circle cx="61" cy="98" r="6" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.5"/>

      {/* Right arm — hugging heart */}
      <path d="M125 130 Q140 110,150 92 Q155 84,158 88 Q162 98,145 118Z" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.8"/>
      {/* Right paw on heart */}
      <circle cx="155" cy="86" r="6.5" fill={`url(#${p}kBodyG)`} stroke="#d4b0c4" strokeWidth="1.5"/>
      {/* Paw pads */}
      <circle cx="153" cy="85" r="1.5" fill="rgba(255,180,200,0.4)"/>
      <circle cx="157" cy="85" r="1.5" fill="rgba(255,180,200,0.4)"/>
      <circle cx="155" cy="89" r="1.5" fill="rgba(255,180,200,0.4)"/>

      {/* Left ear */}
      <g style={{ transformOrigin: '72px 65px', animation: 'earWiggle 3s ease-in-out infinite' }}>
        <path d="M72 65 C60 61,54 30,63 8 C66 0,76-1,79 8 C86 28,84 61,72 65Z" fill={`url(#${p}kHeadG)`} stroke="#d4b0c4" strokeWidth="2"/>
        <path d="M74 56 C67 54,63 35,67 20 C69 14,75 14,77 20 C80 33,80 54,74 56Z" fill={`url(#${p}kEarPinkL)`}/>
      </g>
      {/* Right ear */}
      <g style={{ transformOrigin: '118px 65px', animation: 'earWiggle 3s ease-in-out infinite', animationDelay: '-1s' }}>
        <path d="M118 65 C130 61,136 30,127 8 C124 0,114-1,111 8 C104 28,106 61,118 65Z" fill={`url(#${p}kHeadG)`} stroke="#d4b0c4" strokeWidth="2"/>
        <path d="M116 56 C123 54,127 35,123 20 C121 14,115 14,113 20 C110 33,110 54,116 56Z" fill={`url(#${p}kEarPinkL)`}/>
      </g>

      {/* Head — big and round */}
      <ellipse cx="95" cy="85" rx="48" ry="43" fill={`url(#${p}kHeadG)`} stroke="#d4b0c4" strokeWidth="2.2"/>
      {/* Head shine */}
      <ellipse cx="83" cy="58" rx="20" ry="11" fill="rgba(255,255,255,0.5)" transform="rotate(-8,83,58)"/>

      {/* Eyes — closed happy arcs (^  ^) */}
      <path d="M72 84 Q80 74,88 84" stroke="#1a1018" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
      <path d="M102 84 Q110 74,118 84" stroke="#1a1018" strokeWidth="2.8" fill="none" strokeLinecap="round"/>

      {/* Cheeks — big rosy blush */}
      <ellipse cx="60" cy="94" rx="12" ry="8" fill={`url(#${p}kCheekG)`}/>
      <ellipse cx="128" cy="94" rx="12" ry="8" fill={`url(#${p}kCheekG)`}/>
      <circle cx="55" cy="91" r="1.5" fill="rgba(255,255,255,0.4)"/>
      <circle cx="133" cy="91" r="1.5" fill="rgba(255,255,255,0.4)"/>

      {/* Heart-shaped nose */}
      <path d="M95 93 C93 90,89 91,91 93 C92 95,95 97,95 97 C95 97,98 95,99 93 C101 91,97 90,95 93Z" fill={`url(#${p}kNoseG)`}/>

      {/* Kiss mouth — puckered toward heart */}
      <g transform="translate(103,100)">
        <ellipse cx="0" cy="0" rx="5" ry="3.5" fill="#e06080" stroke="#c04868" strokeWidth="1"/>
        <ellipse cx="-1" cy="-1" rx="1.8" ry="1" fill="rgba(255,255,255,0.45)" transform="rotate(-20,-1,-1)"/>
      </g>

      {/* Floating mini hearts between bunny and heart */}
      <g opacity="0.6">
        <path d="M130 72 C128 69,125 70,126 72 C127 73,130 75,130 75 C130 75,133 73,134 72 C135 70,132 69,130 72Z" fill="#ff7a95"/>
        <path d="M138 55 C136.5 53,134 53.5,135 55 C135.5 56,138 58,138 58 C138 58,140.5 56,141 55 C142 53.5,139.5 53,138 55Z" fill="#ff7a95" opacity="0.5"/>
        <path d="M125 58 C124 56.5,122 57,123 58 C123.5 59,125 60,125 60 C125 60,126.5 59,127 58 C128 57,126 56.5,125 58Z" fill="#ff7a95" opacity="0.4"/>
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

// ─── Stage config ─────────────────────────────────────────────────────────────
// sw=sweat, st=steam, ag=anger cross, te=tears, sh=shock lines, qu=question marks
interface Stage {
  ey: string; mo: string; an: string;
  sw: boolean; st: boolean; ag: boolean; te: boolean; sh: boolean; qu: boolean;
  tx: string; yT: string; nT: string;
  yW: number;
}

const STAGES: Stage[] = [
  { ey:'normal', mo:'smile',  an:'bounce', sw:false, st:false, ag:false, te:false, sh:false, qu:false,
    tx:'Voce me ama? ❤️',           yT:'SIM',           nT:'NAO.',   yW:45 },
  { ey:'half',   mo:'pout',   an:'shake',  sw:false, st:false, ag:false, te:false, sh:false, qu:true,
    tx:'espera... tem certeza? 🥺',  yT:'SIM',           nT:'NAO.',   yW:48 },
  { ey:'squint', mo:'wavy',   an:'bounce', sw:false, st:false, ag:false, te:false, sh:false, qu:true,
    tx:'pensa direito...',           yT:'SIM',           nT:'nao',    yW:52 },
  { ey:'side',   mo:'frown',  an:'shake',  sw:true,  st:false, ag:false, te:false, sh:true,  qu:false,
    tx:'ta brincando ne...?',        yT:'SIM!',          nT:'nao..',  yW:56 },
  { ey:'half',   mo:'pout',   an:'sad',    sw:false, st:false, ag:false, te:false, sh:true,  qu:false,
    tx:'nao ta certo isso...',       yT:'SIM!!',         nT:'nao..',  yW:60 },
  { ey:'cry',    mo:'frown',  an:'cry',    sw:false, st:false, ag:false, te:true,  sh:false, qu:false,
    tx:'voce nao me ama...?',        yT:'EU TE AMO',     nT:'n...',   yW:64 },
  { ey:'angry',  mo:'open',   an:'angry',  sw:false, st:true,  ag:true,  te:false, sh:true,  qu:false,
    tx:'tenta de novo...',           yT:'SIMM!!!',       nT:'n.',     yW:68 },
  { ey:'cry',    mo:'pout',   an:'cry',    sw:true,  st:false, ag:false, te:true,  sh:false, qu:false,
    tx:'fala serio...',              yT:'POR FAVOR SIM',  nT:'..',    yW:72 },
  { ey:'closed', mo:'frown',  an:'cry',    sw:false, st:false, ag:false, te:true,  sh:false, qu:false,
    tx:'ta me zoando...',            yT:'SIM SIM SIM',   nT:'.',      yW:78 },
  { ey:'cry',    mo:'wavy',   an:'cry',    sw:false, st:false, ag:false, te:true,  sh:false, qu:false,
    tx:'ultima chance...',           yT:'DIGA SIM!!',    nT:'.',      yW:85 },
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
              {/* Bunny */}
              <motion.div
                key={`bunny-${stageIdx}-${simStageIdx}-${simFlow}`}
                animate={currentAnim}
                style={{ width: 160, height: 170 }}
              >
                <BunnySVG
                  eyeHtml={activeEy}
                  mouthHtml={activeMo}
                  showSweat={!simFlow && stage.sw && !celebrating}
                  showSteam={!simFlow && stage.st && !celebrating}
                  showAnger={!simFlow && stage.ag && !celebrating}
                  showTears={!simFlow && stage.te && !celebrating}
                  showShock={!simFlow && stage.sh && !celebrating}
                  showQuestion={!simFlow && stage.qu && !celebrating}
                  idPrefix={svgId}
                />
              </motion.div>

              {/* Text — no animation, instant */}
              <p style={{
                color: celebrating ? '#5ee8b5' : simFlow ? '#e8456a' : '#e8456a',
                fontWeight: 800, fontSize: 17, textAlign: 'center',
                padding: '0 12px', minHeight: 24,
              }}>
                {activeTx}
              </p>

              {/* Buttons — YES and NO side by side, NO swaps position and shrinks */}
              {!celebrating && !simFlow && (
                <div style={{
                  width: '100%', display: 'flex',
                  flexDirection: stageIdx % 2 === 0 ? 'row' : 'row-reverse',
                  justifyContent: 'center', gap: 10, marginTop: 8, padding: '0 12px',
                }}>
                  {/* YES button — grows */}
                  <motion.button
                    onClick={handleYes}
                    animate={{
                      width: `${stage.yW}%`,
                      height: Math.min(56, 42 + stageIdx * 2),
                      fontSize: 16 + Math.min(stageIdx * 2, 16),
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    whileTap={{ scale: 0.93 }}
                    style={{
                      background: '#5ee8b5',
                      border: 'none', color: '#fff', fontWeight: 900,
                      borderRadius: 12, cursor: 'pointer', letterSpacing: 1,
                      WebkitTapHighlightColor: 'transparent',
                      flexShrink: 0,
                    }}
                  >
                    {stage.yT}
                  </motion.button>

                  {/* NO button — shrinks but stays visible, swaps sides each click */}
                  <motion.button
                    onClick={handleNo}
                    layout
                    animate={{
                      width: Math.max(36, 100 - stageIdx * 9),
                      height: Math.max(32, 42 - stageIdx * 2),
                      fontSize: Math.max(10, 16 - stageIdx),
                    }}
                    transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                    whileTap={{ scale: 0.85 }}
                    style={{
                      background: '#f087a0',
                      border: 'none', color: '#fff', fontWeight: 900,
                      borderRadius: 10, cursor: 'pointer', letterSpacing: 1,
                      WebkitTapHighlightColor: 'transparent',
                      overflow: 'hidden', whiteSpace: 'nowrap',
                      flexShrink: 0,
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
