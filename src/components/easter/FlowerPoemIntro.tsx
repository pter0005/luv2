'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface Layer {
  name: string; x: number; y: number; w: number; h: number;
  scale: number; rotation: number; opacity: number; flipX: boolean;
  imageW: number; imageH: number; src: string;
  bbox?: { nMinX: number; nMinY: number; nMaxX: number; nMaxY: number };
  visibleCX?: number; visibleCY?: number; visibleW?: number; visibleH?: number;
}
interface Scene {
  id: string; primary: number; others: number[]; duration: number;
  primaryBehavior: string; othersBehavior: string; fem: string; mas: string;
}
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; kind: string; twinkle: number; }
interface Petal { spriteIdx: number; x: number; y: number; vy: number; vx: number; rot: number; vrot: number; size: number; alpha: number; phase: number; sway: number; life: number; maxLife: number; }
interface Orb { x: number; y: number; r: number; hue: number; sat: number; lit: number; vx: number; vy: number; phase: number; }
interface Star { x: number; y: number; r: number; phase: number; speed: number; }
interface FlourishAnchor { x: number; y: number; s: number; phase: number; }

interface FlowerPoemIntroProps {
  onReveal: () => void;
  gender?: 'fem' | 'mas';
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const STAGE_W = 375;
const STAGE_H = 812;

const INITIAL_LAYERS: Layer[] = [
  { name: "SACOLA", x: -241.9, y: 127.2, w: 1080, h: 1350, scale: 0.557, rotation: 0, opacity: 1, flipX: false, imageW: 400, imageH: 500, src: "/poema-assets/flowers/bouquet-bag.webp" },
  { name: "filler1", x: -249.7, y: 91.6, w: 1080, h: 1350, scale: 0.348, rotation: -38.8, opacity: 1, flipX: false, imageW: 400, imageH: 500, src: "/poema-assets/flowers/bouquet-filler-1.webp" },
  { name: "filler2", x: -3.6, y: 145.4, w: 1080, h: 1350, scale: 0.316, rotation: 48.4, opacity: 1, flipX: false, imageW: 400, imageH: 500, src: "/poema-assets/flowers/bouquet-filler-2.webp" },
  { name: "orquidea", x: 12, y: 149.7, w: 1080, h: 1350, scale: 0.239, rotation: 10.5, opacity: 1, flipX: false, imageW: 400, imageH: 500, src: "/poema-assets/flowers/orchid.webp" },
  { name: "rosa", x: 123.3, y: 228.5, w: 1080, h: 1350, scale: 0.187, rotation: 27.7, opacity: 1, flipX: false, imageW: 400, imageH: 500, src: "/poema-assets/flowers/rose.webp" },
  { name: "violeta", x: -159, y: 182, w: 1080, h: 1350, scale: 0.21, rotation: -20.1, opacity: 1, flipX: false, imageW: 400, imageH: 500, src: "/poema-assets/flowers/violet.webp" },
  { name: "jasmim", x: -105.6, y: 145.9, w: 1080, h: 1350, scale: 0.28, rotation: 0, opacity: 1, flipX: false, imageW: 400, imageH: 500, src: "/poema-assets/flowers/jasmin.webp" },
  { name: "girassol", x: -193.2, y: 234.4, w: 1080, h: 1350, scale: 0.159, rotation: 20.8, opacity: 1, flipX: true, imageW: 400, imageH: 500, src: "/poema-assets/flowers/sunflower.webp" },
];

const SCENES: Scene[] = [
  { id: 'rosa', primary: 4, others: [], duration: 3800, primaryBehavior: 'hero', othersBehavior: 'fadeLate', fem: 'Você é tão {linda}\nquanto uma [rosa]', mas: 'Você é tão {lindo}\nquanto uma [rosa]' },
  { id: 'jasmim', primary: 6, others: [], duration: 3700, primaryBehavior: 'hero', othersBehavior: 'fadeLate', fem: 'Tão {doce}\nquanto um [jasmim]', mas: 'Tão {doce}\nquanto um [jasmim]' },
  { id: 'violeta', primary: 5, others: [], duration: 3700, primaryBehavior: 'hero', othersBehavior: 'fadeLate', fem: 'Tão {rara}\nquanto a [violeta]', mas: 'Tão {raro}\nquanto a [violeta]' },
  { id: 'girassol', primary: 7, others: [], duration: 3700, primaryBehavior: 'hero', othersBehavior: 'fadeLate', fem: 'Tão {única}\nquanto o [girassol]', mas: 'Tão {único}\nquanto o [girassol]' },
  { id: 'orquidea', primary: 3, others: [], duration: 3700, primaryBehavior: 'hero', othersBehavior: 'fadeLate', fem: 'Tão {especial}\nquanto a [orquídea]', mas: 'Tão {especial}\nquanto a [orquídea]' },
  { id: 'finale', primary: 0, others: [1, 2], duration: 7500, primaryBehavior: 'fromBelow', othersBehavior: 'fadeLate', fem: 'você é o presente\nmais lindo que\na vida me deu.', mas: 'você é o presente\nmais lindo que\na vida me deu.' },
];
const TOTAL_DURATION = SCENES.reduce((s, sc) => s + sc.duration, 0);

const FLOURISH_ANCHORS: FlourishAnchor[] = [
  { x: 0.18, y: 0.38, s: 0.55, phase: 0.0 },
  { x: 0.32, y: 0.33, s: 0.70, phase: 1.1 },
  { x: 0.50, y: 0.30, s: 0.85, phase: 2.4 },
  { x: 0.70, y: 0.33, s: 0.65, phase: 3.6 },
  { x: 0.84, y: 0.39, s: 0.55, phase: 4.8 },
  { x: 0.12, y: 0.52, s: 0.55, phase: 0.7 },
  { x: 0.90, y: 0.54, s: 0.55, phase: 2.1 },
];

const PETAL_PALETTE = [
  { r: 255, g: 130, b: 170 },
  { r: 255, g: 190, b: 210 },
  { r: 255, g: 220, b: 140 },
  { r: 220, g: 160, b: 255 },
  { r: 255, g: 100, b: 180 },
];
const PETAL_SPRITE_SIZE = 56;
const PETAL_BASE_SIZE = 14;

// ═══════════════════════════════════════════════════════════════════════════
// EASING
// ═══════════════════════════════════════════════════════════════════════════
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t: number) => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

// ═══════════════════════════════════════════════════════════════════════════
// FONT LOADING
// ═══════════════════════════════════════════════════════════════════════════
const BODY_FONT = { family: "'Cormorant Garamond', serif", style: 'italic', weight: '500' };

async function loadFonts(): Promise<void> {
  const urls = [
    'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap',
    'https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap',
  ];
  for (const href of urls) {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }
  await document.fonts.ready;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE LOADING + BBOX + LAYOUT
// ═══════════════════════════════════════════════════════════════════════════
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('img load failed: ' + src));
    img.src = src;
  });
}

async function loadAllImages(layers: Layer[]): Promise<HTMLImageElement[]> {
  return Promise.all(layers.map(l => loadImage(l.src)));
}

function computeBboxes(layers: Layer[], images: HTMLImageElement[]) {
  const tmp = document.createElement('canvas');
  const tctx = tmp.getContext('2d', { willReadFrequently: true })!;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const layer = layers[i];
    tmp.width = img.width;
    tmp.height = img.height;
    tctx.clearRect(0, 0, img.width, img.height);
    tctx.drawImage(img, 0, 0);
    const data = tctx.getImageData(0, 0, img.width, img.height).data;
    let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
    const STEP = 2, THRESH = 16;
    for (let y = 0; y < img.height; y += STEP) {
      for (let x = 0; x < img.width; x += STEP) {
        const alpha = data[(y * img.width + x) * 4 + 3];
        if (alpha > THRESH) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) { minX = 0; minY = 0; maxX = img.width - 1; maxY = img.height - 1; }
    layer.bbox = { nMinX: minX / img.width, nMinY: minY / img.height, nMaxX: maxX / img.width, nMaxY: maxY / img.height };
    layer.visibleCX = (layer.bbox.nMinX + layer.bbox.nMaxX) / 2;
    layer.visibleCY = (layer.bbox.nMinY + layer.bbox.nMaxY) / 2;
    layer.visibleW = (layer.bbox.nMaxX - layer.bbox.nMinX) * layer.w;
    layer.visibleH = (layer.bbox.nMaxY - layer.bbox.nMinY) * layer.h;
  }
}

function applyLayout(layers: Layer[]) {
  const TARGET_Y0 = STAGE_H * 0.42, TARGET_Y1 = STAGE_H * 0.955;
  const TARGET_X0 = 18, TARGET_X1 = STAGE_W - 18;
  const TARGET_W = TARGET_X1 - TARGET_X0, TARGET_H = TARGET_Y1 - TARGET_Y0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const L of layers) {
    const b = L.bbox!;
    const dispW = L.w * L.scale, dispH = L.h * L.scale;
    const vx0 = L.x + b.nMinX * dispW, vy0 = L.y + b.nMinY * dispH;
    const vx1 = L.x + b.nMaxX * dispW, vy1 = L.y + b.nMaxY * dispH;
    if (vx0 < minX) minX = vx0; if (vy0 < minY) minY = vy0;
    if (vx1 > maxX) maxX = vx1; if (vy1 > maxY) maxY = vy1;
  }
  const srcW = maxX - minX, srcH = maxY - minY;
  const srcCX = (minX + maxX) / 2, srcCY = (minY + maxY) / 2;
  const S = Math.min(TARGET_W / srcW, TARGET_H / srcH) * 0.94;
  const tgtCX = (TARGET_X0 + TARGET_X1) / 2, tgtCY = (TARGET_Y0 + TARGET_Y1) / 2;
  for (const L of layers) {
    const dispW = L.w * L.scale, dispH = L.h * L.scale;
    const cx = L.x + dispW / 2, cy = L.y + dispH / 2;
    const ncx = tgtCX + (cx - srcCX) * S, ncy = tgtCY + (cy - srcCY) * S;
    L.scale *= S;
    L.x = ncx - (L.w * L.scale) / 2;
    L.y = ncy - (L.h * L.scale) / 2;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function resolveScene(t: number) {
  if (t >= TOTAL_DURATION) {
    const last = SCENES.length - 1;
    return { index: last, scene: SCENES[last], sceneTime: SCENES[last].duration, sceneStart: TOTAL_DURATION - SCENES[last].duration };
  }
  let elapsed = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (t < elapsed + SCENES[i].duration) return { index: i, scene: SCENES[i], sceneTime: t - elapsed, sceneStart: elapsed };
    elapsed += SCENES[i].duration;
  }
  return { index: 0, scene: SCENES[0], sceneTime: 0, sceneStart: 0 };
}

function findLayerScene(layerIdx: number) {
  let sceneStart = 0;
  for (let i = 0; i < SCENES.length; i++) {
    const sc = SCENES[i];
    if (sc.primary === layerIdx || sc.others.indexOf(layerIdx) !== -1)
      return { sceneIdx: i, sceneStart, isPrimary: sc.primary === layerIdx };
    sceneStart += sc.duration;
  }
  return null;
}

function getFinalState(layer: Layer) {
  return { x: layer.x, y: layer.y, scale: layer.scale, rotation: layer.rotation, flipX: layer.flipX };
}

function getHeroState(layer: Layer) {
  const targetPx = Math.min(STAGE_W, STAGE_H) * 0.62;
  const visW = layer.visibleW || layer.w;
  const visH = layer.visibleH || layer.h;
  const fitScale = targetPx / Math.max(visW, visH);
  const heroScale = clamp(Math.max(layer.scale * 1.7, fitScale), layer.scale * 1.4, 0.65);
  const w = layer.w * heroScale, h = layer.h * heroScale;
  const vcX = layer.visibleCX !== undefined ? layer.visibleCX : 0.5;
  const vcY = layer.visibleCY !== undefined ? layer.visibleCY : 0.5;
  const heroCenterX = STAGE_W / 2, heroCenterY = STAGE_H * 0.62;
  const x = layer.flipX ? heroCenterX - (1 - vcX) * w : heroCenterX - vcX * w;
  const y = heroCenterY - vcY * h;
  return { x, y, scale: heroScale, rotation: 0, flipX: layer.flipX };
}

function getBouquetFloat(t: number) {
  const base = Math.sin(t * 0.00090) * 4.5;
  const info = resolveScene(t);
  if (info.index === SCENES.length - 1 && info.sceneTime > 2800) {
    const ramp = clamp((info.sceneTime - 2800) / 1500, 0, 1);
    const local = info.sceneTime - 2800;
    const phase = local * 0.00048 + Math.PI;
    return base + Math.sin(phase) * 12 * ramp;
  }
  return base;
}

function getCurrentHeroLayer(t: number) {
  const info = resolveScene(t);
  const sc = info.scene;
  if (sc.primaryBehavior !== 'hero') return -1;
  if (info.sceneTime < 260 || info.sceneTime >= 2150) return -1;
  return sc.primary;
}

// ═══════════════════════════════════════════════════════════════════════════
// PER-LAYER STATE AT TIME t
// ═══════════════════════════════════════════════════════════════════════════
function computeLayerState(layers: Layer[], layerIdx: number, t: number) {
  const info = findLayerScene(layerIdx);
  if (!info) return null;
  const sc = SCENES[info.sceneIdx];
  const localT = t - info.sceneStart;
  if (localT < 0) return null;
  const layer = layers[layerIdx];
  const final = getFinalState(layer);
  const behavior = info.isPrimary ? sc.primaryBehavior : sc.othersBehavior;
  const floatDy = getBouquetFloat(t);

  if (localT >= sc.duration) {
    const b = Math.sin(t * 0.0012 + layerIdx * 0.7) * 0.0025;
    return { state: { x: final.x, y: final.y + floatDy, scale: final.scale * (1 + b), rotation: final.rotation, flipX: final.flipX }, alpha: 1 };
  }

  if (behavior === 'hero') {
    const hero = getHeroState(layer);
    const T_ENTRY_A = 260, T_ENTRY_B = 1000, T_HOLD_B = 2150, T_TRANS_B = 3100;
    if (localT < T_ENTRY_A) return null;
    if (localT < T_ENTRY_B) {
      const p = (localT - T_ENTRY_A) / (T_ENTRY_B - T_ENTRY_A);
      const e = easeOutBack(p);
      const s = Math.max(0, hero.scale * e);
      const w = layer.w * s, h = layer.h * s;
      const vcX = layer.visibleCX !== undefined ? layer.visibleCX : 0.5;
      const vcY = layer.visibleCY !== undefined ? layer.visibleCY : 0.5;
      const drop = (1 - easeOutQuart(p)) * 36;
      const cx = STAGE_W / 2, cy = STAGE_H * 0.62 + drop;
      const x = hero.flipX ? cx - (1 - vcX) * w : cx - vcX * w;
      const y = cy - vcY * h;
      return { state: { x, y, scale: s, rotation: 0, flipX: hero.flipX }, alpha: easeOutCubic(p) };
    }
    if (localT < T_HOLD_B) {
      const holdLocal = localT - T_ENTRY_B;
      const wobble = Math.sin(holdLocal * 0.0018) * 1.2;
      const breath = Math.sin(holdLocal * 0.0024) * 0.004;
      return { state: { x: hero.x, y: hero.y, scale: hero.scale * (1 + breath), rotation: wobble, flipX: hero.flipX }, alpha: 1 };
    }
    if (localT < T_TRANS_B) {
      const p = (localT - T_HOLD_B) / (T_TRANS_B - T_HOLD_B);
      const e = easeInOutCubic(p);
      return { state: { x: lerp(hero.x, final.x, e), y: lerp(hero.y, final.y + floatDy * e, e), scale: lerp(hero.scale, final.scale, e), rotation: lerp(0, final.rotation, e), flipX: hero.flipX }, alpha: 1 };
    }
    const b = Math.sin((localT - T_TRANS_B) * 0.0015) * 0.003;
    return { state: { x: final.x, y: final.y + floatDy, scale: final.scale * (1 + b), rotation: final.rotation, flipX: final.flipX }, alpha: 1 };
  }

  if (behavior === 'fadeLate') {
    const T_IN_A = 2200, T_IN_B = 3000;
    if (localT < T_IN_A) return null;
    const p = clamp((localT - T_IN_A) / (T_IN_B - T_IN_A), 0, 1);
    const e = easeOutCubic(p);
    return { state: { x: final.x, y: final.y + floatDy * e + (1 - e) * 18, scale: final.scale * (0.92 + 0.08 * e), rotation: final.rotation, flipX: final.flipX }, alpha: e };
  }

  if (behavior === 'fromBelow') {
    const T_IN_A = 740, T_IN_B = 1850;
    if (localT < T_IN_A) return null;
    const p = clamp((localT - T_IN_A) / (T_IN_B - T_IN_A), 0, 1);
    const e = easeOutQuart(p);
    return { state: { x: final.x, y: final.y + (1 - e) * 160 + floatDy * e, scale: final.scale, rotation: final.rotation, flipX: final.flipX }, alpha: easeOutCubic(e) };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOW
// ═══════════════════════════════════════════════════════════════════════════
function computeLayerGlow(layerIdx: number, t: number) {
  const sInfo = resolveScene(t);
  const sc = sInfo.scene;
  const localT = sInfo.sceneTime;
  const isFinale = sInfo.index === SCENES.length - 1;
  if (isFinale) {
    if (layerIdx < 3) return 0;
    const base = 0.05 + Math.sin(t * 0.0012 + layerIdx * 0.4) * 0.018;
    const settle = clamp((localT - 2200) / 1400, 0, 1) * 0.03;
    return base + settle;
  }
  if (sc.primary === layerIdx && localT > 260 && localT < 2050) {
    const inRamp = clamp((localT - 260) / 700, 0, 1);
    const outRamp = 1 - clamp((localT - 1850) / 200, 0, 1);
    const heroPulse = 0.10 + Math.sin(t * 0.0018) * 0.035;
    return heroPulse * inRamp * outRamp;
  }
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS (scoped with .poema- prefix)
// ═══════════════════════════════════════════════════════════════════════════
function buildCSS() {
  const bodyFont = BODY_FONT;
  return `
.poema-root{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,#1a0a22 0%,#0a0510 55%,#050008 100%);overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;z-index:0}
.poema-wrap{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;container-type:inline-size;container-name:stage}
.poema-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.poema-text{
  position:absolute;left:3.5%;right:3.5%;top:4.8%;text-align:center;
  font-family:${bodyFont.family};font-style:${bodyFont.style};font-weight:${bodyFont.weight};
  color:#fff;font-size:clamp(42px,11cqw,68px);line-height:1.14;letter-spacing:.006em;
  pointer-events:none;text-shadow:0 0 12px rgba(200,150,230,.45);opacity:1;z-index:5;will-change:transform,opacity;
}
.poema-text .word{display:inline-block;opacity:0;transform:translateY(-20px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1);margin:0 .14em;will-change:transform,opacity}
.poema-text .word.in{opacity:1;transform:translateY(0)}
.poema-text.out .word{opacity:0!important;transform:translateY(18px)!important;transition:opacity .5s ease,transform .5s ease}
.poema-text .word.em{font-family:${bodyFont.family};font-style:${bodyFont.style};font-weight:600;font-size:1.3em;letter-spacing:.01em;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;padding:0 .04em}
.poema-text .word.em.f-rosa{background:linear-gradient(178deg,#fff0f3 0%,#ff9ab0 24%,#ff3a5f 58%,#c60036 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 7px rgba(180,100,220,.42))}
.poema-text .word.em.f-jasmim{background:linear-gradient(178deg,#fffef6 0%,#fff3d0 26%,#ffe089 58%,#ffb63a 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 7px rgba(220,130,200,.42))}
.poema-text .word.em.f-violeta{background:linear-gradient(178deg,#f7e7ff 0%,#d8a6ff 26%,#9a4ff0 58%,#4a1090 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 7px rgba(255,170,100,.42))}
.poema-text .word.em.f-girassol{background:linear-gradient(178deg,#fffadb 0%,#ffe558 24%,#ffb828 58%,#e06200 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 7px rgba(170,120,240,.42))}
.poema-text .word.em.f-orquidea{background:linear-gradient(178deg,#ffe4f2 0%,#ff9ccf 26%,#e84ca3 58%,#7a1250 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 7px rgba(120,210,220,.42))}
.poema-text .word.flower{display:block;font-family:'Great Vibes',cursive;font-style:normal;font-weight:400;font-size:2.78em;line-height:.95;letter-spacing:.005em;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;padding:.12em .08em .08em;margin-top:0;transform:translateY(-20px);transition:opacity .9s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1);will-change:transform,opacity,filter}
.poema-text .word.flower.in{transform:translateY(0)}
.poema-text .word.flower.f-rosa{background:linear-gradient(178deg,#ffe4ea 0%,#ff8fa8 22%,#ff2550 52%,#c2002a 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 9px rgba(180,100,220,.42))}
.poema-text .word.flower.f-jasmim{background:linear-gradient(178deg,#fffdf0 0%,#fff1c8 25%,#ffdf80 58%,#ffae30 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 9px rgba(220,130,200,.42))}
.poema-text .word.flower.f-violeta{background:linear-gradient(178deg,#f4e1ff 0%,#d098ff 25%,#8a3dea 58%,#3e0b80 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 9px rgba(255,170,100,.42))}
.poema-text .word.flower.f-girassol{background:linear-gradient(178deg,#fff9cc 0%,#ffe24a 24%,#ffb020 58%,#d65a00 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 9px rgba(170,120,240,.42))}
.poema-text .word.flower.f-orquidea{background:linear-gradient(178deg,#ffdcee 0%,#ff8fc8 26%,#e13a9a 58%,#6e0a48 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 9px rgba(120,210,220,.42))}
.poema-text.finale{left:1%;right:1%;top:2.8%;font-family:'Playfair Display',serif;font-style:italic;font-weight:500;color:#fff;text-align:center;letter-spacing:0;line-height:1;text-shadow:none;mix-blend-mode:normal;display:flex;flex-direction:column;align-items:center;gap:0}
.poema-text.finale .fLine{display:block;line-height:1;width:100%}
.poema-text.finale .orn{font-family:'Playfair Display',serif;font-style:normal;font-weight:400;font-size:clamp(16px,4cqw,24px);color:rgba(255,220,180,.78);letter-spacing:.8em;padding-left:.8em;margin:.1em 0 .3em;text-shadow:0 0 8px rgba(200,150,230,.32)}
.poema-text.finale .ornBot{margin:.3em 0 .05em}
.poema-text.finale .fIntro{font-family:${bodyFont.family};font-style:${bodyFont.style};font-weight:400;font-size:clamp(32px,8cqw,46px);letter-spacing:.025em;color:#fff;opacity:.94;text-shadow:0 0 11px rgba(180,130,220,.42);margin-bottom:.12em}
.poema-text.finale .fMid{font-family:${bodyFont.family};font-style:${bodyFont.style};font-weight:500;font-size:clamp(38px,9.2cqw,52px);letter-spacing:.018em;color:#fff;text-shadow:0 0 12px rgba(180,130,220,.45);margin:.08em 0}
.poema-text.finale .fHero{font-family:'Great Vibes',cursive;font-style:normal;font-weight:400;font-size:clamp(100px,24.5cqw,156px);line-height:.86;letter-spacing:.002em;margin:.03em 0 .08em;padding:0 .14em;filter:drop-shadow(0 0 12px rgba(210,110,200,.5))}
.poema-text.finale .fHero .word{background:linear-gradient(178deg,#fff6df 0%,#ffe6a8 22%,#ffc25c 48%,#ff9dd4 78%,#ffc6e8 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;padding:0 .08em}
.poema-text.finale .fOutro{font-family:'Pinyon Script',cursive;font-style:normal;font-weight:400;font-size:clamp(36px,8.8cqw,54px);line-height:1.05;letter-spacing:.01em;color:#fff;text-shadow:0 0 10px rgba(255,170,110,.38);margin-top:.08em}
.poema-text.finale .word,.poema-text.finale .orn,.poema-text.finale .fLine{display:inline-block}
.poema-text.finale .fLine{display:block}
.poema-text.finale .orn.word,.poema-text.finale .fHero .word{margin:0}
@container stage (max-width:374px){
  .poema-text{top:2.4%;font-size:clamp(31px,9.6cqw,34px)}
  .poema-text .word{margin:0 .08em}
  .poema-text .word.em{font-size:1.16em;letter-spacing:.008em}
  .poema-text.finale{top:.3%}
  .poema-text.finale .orn{font-size:clamp(12px,3.4cqw,16px);margin:.02em 0 .12em}
  .poema-text.finale .ornBot{margin:.12em 0 .02em}
  .poema-text.finale .fIntro{font-size:clamp(25px,7.8cqw,28px);margin-bottom:.06em}
  .poema-text.finale .fMid{font-size:clamp(27px,8.4cqw,30px);letter-spacing:.01em;margin:.04em 0}
  .poema-text.finale .fMid .word{margin:0 .06em}
  .poema-text.finale .fHero{font-size:clamp(82px,25cqw,92px);padding:0 .12em;margin:.02em 0 .04em}
}
.poema-readyScreen{
  position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;
  opacity:0;animation:poemaReadyIn 1.4s cubic-bezier(.22,1,.36,1) .2s forwards;
}
@keyframes poemaReadyIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.poema-ringWrap{
  position:relative;padding:2.5px;border-radius:999px;
  animation:poemaBreathe 3.5s ease-in-out infinite;
}
.poema-ringWrap::before{
  content:"";position:absolute;inset:-1px;border-radius:999px;
  background:conic-gradient(from 0deg,rgba(255,120,200,0.05),rgba(200,100,255,0.55),rgba(255,190,230,0.8),rgba(180,80,255,0.55),rgba(255,120,200,0.05));
  animation:poemaRingSpin 4s linear infinite;z-index:-1;
  filter:blur(0.5px);
}
@keyframes poemaRingSpin{to{transform:rotate(360deg)}}
@keyframes poemaBreathe{0%,100%{transform:scale(1);filter:drop-shadow(0 0 18px rgba(200,100,255,.22))}50%{transform:scale(1.025);filter:drop-shadow(0 0 28px rgba(200,100,255,.38))}}
.poema-startBtn{
  position:relative;display:flex;flex-direction:column;align-items:center;gap:clamp(3px,1.2cqw,7px);
  padding:clamp(16px,4.8cqw,24px) clamp(34px,14cqw,58px) clamp(18px,5.2cqw,26px);
  white-space:nowrap;
  background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.18) 0%,rgba(255,255,255,0) 50%),linear-gradient(180deg,rgba(50,12,70,.88) 0%,rgba(28,6,45,.94) 100%);
  border:none;color:#fff;border-radius:999px;cursor:pointer;
  -webkit-backdrop-filter:blur(22px) saturate(160%);backdrop-filter:blur(22px) saturate(160%);
  box-shadow:0 1px 0 rgba(255,255,255,.30) inset,0 -1px 0 rgba(255,255,255,.06) inset;
  overflow:hidden;isolation:isolate;transition:transform .25s ease;
}
.poema-startBtn::before{content:"";position:absolute;inset:0;border-radius:999px;pointer-events:none;background:linear-gradient(115deg,transparent 18%,rgba(255,255,255,.30) 38%,rgba(255,255,255,.06) 50%,transparent 63%);mix-blend-mode:screen;opacity:.75;animation:poemaGlassSweep 6s ease-in-out infinite}
.poema-startBtn::after{content:"";position:absolute;left:15%;right:15%;bottom:-1px;height:42%;border-radius:50%;background:radial-gradient(ellipse at 50% 100%,rgba(255,120,200,.40) 0%,rgba(255,120,200,0) 70%);pointer-events:none;filter:blur(7px);opacity:.7}
@keyframes poemaGlassSweep{0%,100%{transform:translateX(-28%)}50%{transform:translateX(28%)}}
.poema-startBtn:active{transform:scale(.97)}
.poema-btnLabel{
  font-family:'Playfair Display',serif;font-style:italic;font-weight:400;
  font-size:clamp(9px,2.8cqw,13px);letter-spacing:.18em;text-transform:uppercase;
  color:rgba(255,200,230,.55);
}
.poema-btnText{
  font-family:'Playfair Display',serif;font-style:italic;font-weight:500;
  font-size:clamp(17px,5.5cqw,23px);letter-spacing:.02em;
  text-shadow:0 1px 2px rgba(60,10,80,.45),0 0 16px rgba(255,200,230,.30);
}
.poema-startBtn .heart{
  display:inline-block;margin-left:.35em;color:#ffc6df;
  text-shadow:0 0 10px rgba(255,180,220,.85);
  animation:poemaHeartbeat 1.6s ease-in-out infinite;
}
@keyframes poemaHeartbeat{0%,100%{transform:scale(1)}12%{transform:scale(1.22)}24%{transform:scale(1)}38%{transform:scale(1.16)}50%{transform:scale(1)}}
.poema-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:rgba(255,255,255,.55);font-family:'Playfair Display',serif;font-style:italic;font-size:17px;z-index:100;background:#0a0510}
.poema-loading::after{content:"";display:inline-block;width:14px;height:14px;margin-left:10px;border:2px solid rgba(255,255,255,.2);border-top-color:#ff80c0;border-radius:50%;animation:poemaSpin 1s linear infinite}
@keyframes poemaSpin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.poema-text .word{transition:opacity .4s ease;transform:none!important}.poema-readyScreen{animation:none;opacity:1}.poema-ringWrap{animation:none}.poema-ringWrap::before{animation:none}.poema-startBtn .heart{animation:none}}
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function FlowerPoemIntro({ onReveal, gender = 'fem' }: FlowerPoemIntroProps) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'playing' | 'done'>('loading');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // All mutable animation state lives here to avoid re-renders
  const A = useRef<{
    layers: Layer[];
    images: HTMLImageElement[];
    ctx: CanvasRenderingContext2D | null;
    started: boolean;
    startTime: number;
    lastFrame: number;
    currentSceneIdx: number;
    textVisible: boolean;
    animationDone: boolean;
    particles: Particle[];
    petals: Petal[];
    orbs: Orb[];
    stars: Star[];
    textTimers: ReturnType<typeof setTimeout>[];
    bgCanvas: HTMLCanvasElement | null;
    bgCtx: CanvasRenderingContext2D | null;
    bgLastRender: number;
    grainCanvas: HTMLCanvasElement | null;
    grainPattern: CanvasPattern | null;
    grainTick: number;
    effectiveDPR: number;
    petalSprites: HTMLCanvasElement[];
    rafId: number;
    cancelled: boolean;
    isMobile: boolean;
    maxPetals: number;
    orbCount: number;
    starCount: number;
    grainTickMod: number;
    flourishMax: number;
  }>({
    layers: [], images: [], ctx: null,
    started: false, startTime: 0, lastFrame: 0, currentSceneIdx: -1,
    textVisible: false, animationDone: false,
    particles: [], petals: [], orbs: [], stars: [],
    textTimers: [],
    bgCanvas: null, bgCtx: null, bgLastRender: -9999,
    grainCanvas: null, grainPattern: null, grainTick: 0,
    effectiveDPR: 1, petalSprites: [], rafId: 0, cancelled: false,
    isMobile: false, maxPetals: 14, orbCount: 9, starCount: 75, grainTickMod: 3, flourishMax: 7,
  });

  // ─── DRAW FUNCTIONS (closures over A.current) ─────────────────────
  const drawLayer = useCallback((layerIdx: number, state: any, alpha: number, glowAmt: number) => {
    const a = A.current;
    const layer = a.layers[layerIdx];
    const img = a.images[layerIdx];
    const ctx = a.ctx!;
    if (!img || alpha <= 0.001) return;
    const w = layer.w * state.scale, h = layer.h * state.scale;
    const cx = state.x + w / 2, cy = state.y + h / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    if (state.flipX) ctx.scale(-1, 1);
    ctx.rotate(state.rotation * Math.PI / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    if (glowAmt > 0.001) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = alpha * glowAmt;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }, []);

  // ─── INIT HELPERS ──────────────────────────────────────────────────
  const initBackground = useCallback(() => {
    const a = A.current;
    for (let i = 0; i < a.orbCount; i++) {
      a.orbs.push({ x: Math.random() * STAGE_W, y: Math.random() * STAGE_H, r: 80 + Math.random() * 150, hue: 270 + Math.random() * 60, sat: 70 + Math.random() * 15, lit: 24 + Math.random() * 12, vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22, phase: Math.random() * Math.PI * 2 });
    }
    for (let i = 0; i < a.starCount; i++) {
      a.stars.push({ x: Math.random() * STAGE_W, y: Math.random() * STAGE_H, r: 0.4 + Math.random() * 1.6, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 1.6 });
    }
    a.bgCanvas = document.createElement('canvas');
    a.bgCanvas.width = STAGE_W;
    a.bgCanvas.height = STAGE_H;
    a.bgCtx = a.bgCanvas.getContext('2d');
  }, []);

  const initGrain = useCallback(() => {
    const a = A.current;
    a.grainCanvas = document.createElement('canvas');
    a.grainCanvas.width = 160;
    a.grainCanvas.height = 160;
    const gctx = a.grainCanvas.getContext('2d')!;
    const id = gctx.createImageData(160, 160);
    for (let i = 0; i < id.data.length; i += 4) {
      const n = ((Math.random() + Math.random()) * 128) | 0;
      id.data[i] = n; id.data[i + 1] = n; id.data[i + 2] = n; id.data[i + 3] = 255;
    }
    gctx.putImageData(id, 0, 0);
    a.grainPattern = a.ctx!.createPattern(a.grainCanvas, 'repeat');
  }, []);

  const initPetalSprites = useCallback(() => {
    const a = A.current;
    for (const c of PETAL_PALETTE) {
      const off = document.createElement('canvas');
      off.width = PETAL_SPRITE_SIZE; off.height = PETAL_SPRITE_SIZE;
      const oc = off.getContext('2d')!;
      const cx = PETAL_SPRITE_SIZE / 2, cy = PETAL_SPRITE_SIZE / 2;
      const s = PETAL_BASE_SIZE;
      const glow = oc.createRadialGradient(cx, cy, 0, cx, cy, s * 1.9);
      glow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.55)`);
      glow.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},0.22)`);
      glow.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
      oc.fillStyle = glow;
      oc.fillRect(0, 0, PETAL_SPRITE_SIZE, PETAL_SPRITE_SIZE);
      const body = oc.createRadialGradient(cx, cy - s * 0.2, 0, cx, cy, s * 1.2);
      body.addColorStop(0, `rgba(${Math.min(255, c.r + 25)},${Math.min(255, c.g + 25)},${Math.min(255, c.b + 25)},1)`);
      body.addColorStop(0.55, `rgba(${c.r},${c.g},${c.b},0.85)`);
      body.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
      oc.fillStyle = body;
      oc.beginPath();
      oc.moveTo(cx, cy - s);
      oc.bezierCurveTo(cx + s * 0.78, cy - s * 0.35, cx + s * 0.58, cy + s * 0.85, cx, cy + s * 0.95);
      oc.bezierCurveTo(cx - s * 0.58, cy + s * 0.85, cx - s * 0.78, cy - s * 0.35, cx, cy - s);
      oc.fill();
      oc.fillStyle = `rgba(255,255,255,0.55)`;
      oc.beginPath();
      oc.arc(cx - s * 0.15, cy - s * 0.35, s * 0.12, 0, Math.PI * 2);
      oc.fill();
      a.petalSprites.push(off);
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const a = A.current;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dprCap = a.isMobile ? 2 : 3;
    const dpr = clamp(window.devicePixelRatio || 1, 1, dprCap);
    a.effectiveDPR = dpr;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    // Uniform scale — container always has ~375:812 aspect ratio via parent
    const scale = (rect.width * dpr) / STAGE_W;
    a.ctx!.setTransform(scale, 0, 0, scale, 0, 0);
  }, []);

  // ─── DRAW HELPERS ──────────────────────────────────────────────────
  const updateBackground = useCallback((dt: number) => {
    const a = A.current;
    for (const o of a.orbs) {
      o.x += o.vx * dt * 0.05; o.y += o.vy * dt * 0.05; o.phase += dt * 0.0003;
      if (o.x < -o.r) o.vx = Math.abs(o.vx); if (o.x > STAGE_W + o.r) o.vx = -Math.abs(o.vx);
      if (o.y < -o.r) o.vy = Math.abs(o.vy); if (o.y > STAGE_H + o.r) o.vy = -Math.abs(o.vy);
    }
    for (const s of a.stars) s.phase += dt * 0.001 * s.speed;
  }, []);

  const renderBgOffscreen = useCallback(() => {
    const a = A.current;
    const c = a.bgCtx!;
    c.fillStyle = '#0a0510';
    c.fillRect(0, 0, STAGE_W, STAGE_H);
    for (const o of a.orbs) {
      const breathe = 1 + Math.sin(o.phase) * 0.05;
      const r = o.r * breathe;
      const g = c.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
      g.addColorStop(0, `hsla(${o.hue},${o.sat}%,${o.lit}%,.55)`);
      g.addColorStop(0.55, `hsla(${o.hue},${o.sat}%,${o.lit * .7}%,.22)`);
      g.addColorStop(1, `hsla(${o.hue},${o.sat}%,${o.lit * .5}%,0)`);
      c.fillStyle = g; c.beginPath(); c.arc(o.x, o.y, r, 0, Math.PI * 2); c.fill();
    }
    for (const s of a.stars) {
      const al = 0.3 + 0.7 * (Math.sin(s.phase) * 0.5 + 0.5);
      c.globalAlpha = al * 0.8; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(s.x, s.y, s.r, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
    const vg = c.createRadialGradient(STAGE_W / 2, STAGE_H * 0.52, STAGE_H * 0.25, STAGE_W / 2, STAGE_H * 0.52, STAGE_H * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.65)');
    c.fillStyle = vg; c.fillRect(0, 0, STAGE_W, STAGE_H);
  }, []);

  const drawBackground = useCallback((t: number) => {
    const a = A.current;
    if (!a.bgCanvas) return;
    if (t - a.bgLastRender >= 66) { renderBgOffscreen(); a.bgLastRender = t; }
    a.ctx!.drawImage(a.bgCanvas, 0, 0, STAGE_W, STAGE_H);
  }, [renderBgOffscreen]);

  const drawGrain = useCallback((t: number) => {
    const a = A.current;
    if (!a.grainPattern) return;
    a.grainTick = (a.grainTick + 1) % a.grainTickMod;
    if (a.grainTick !== 0) return;
    const ctx = a.ctx!;
    ctx.save();
    const ox = (t * 0.05) % 160 | 0;
    const oy = (t * 0.041) % 160 | 0;
    ctx.translate(ox, oy);
    ctx.globalAlpha = 0.065;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = a.grainPattern;
    ctx.fillRect(-ox - 4, -oy - 4, STAGE_W + 8, STAGE_H + 8);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  const drawCinematicVignette = useCallback((t: number) => {
    const a = A.current;
    const ctx = a.ctx!;
    const info = resolveScene(t);
    const isFinale = info.index === SCENES.length - 1;
    const localT = info.sceneTime;
    let strength = 0.26;
    if (isFinale) {
      if (localT > 2800) strength = 0.40;
      else if (localT > 900) strength = 0.26 + ((localT - 900) / 1900) * 0.14;
    } else if (localT > 1000 && localT < 2400) {
      const up = clamp((localT - 1000) / 260, 0, 1);
      const down = clamp((localT - 2150) / 250, 0, 1);
      const emph = easeOutCubic(up) * (1 - easeInCubic(down));
      strength = 0.26 + emph * 0.12;
    }
    const cx = STAGE_W / 2, cy = STAGE_H * (isFinale ? 0.58 : 0.55);
    const r0 = STAGE_W * 0.30, r1 = STAGE_W * 0.92;
    const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
    g.addColorStop(0, 'rgba(10,5,18,0)');
    g.addColorStop(0.55, `rgba(8,3,14,${strength * 0.35})`);
    g.addColorStop(1, `rgba(3,1,8,${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  }, []);

  const drawHeroGlowRing = useCallback((t: number, heroIdx: number) => {
    if (heroIdx < 0) return;
    const ctx = A.current.ctx!;
    const info = resolveScene(t);
    const localT = info.sceneTime;
    const T_START = 52, T_PEAK = 1000, T_END = 2150;
    if (localT < T_START || localT > T_END) return;
    let al: number;
    if (localT < T_PEAK) al = easeOutCubic((localT - T_START) / (T_PEAK - T_START));
    else al = 1 - easeInCubic((localT - T_PEAK) / (T_END - T_PEAK));
    al = clamp(al, 0, 1) * 0.42;
    const cx = STAGE_W / 2, cy = STAGE_H * 0.62;
    const pulse = 1 + Math.sin(t * 0.002) * 0.04;
    const r = 150 * pulse;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(255,200,230,${al * 0.35})`);
    g.addColorStop(0.4, `rgba(255,140,200,${al * 0.22})`);
    g.addColorStop(0.7, `rgba(180,90,200,${al * 0.1})`);
    g.addColorStop(1, 'rgba(120,40,160,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }, []);

  const drawLightBurst = useCallback((t: number) => {
    const ctx = A.current.ctx!;
    const info = resolveScene(t);
    if (info.index !== SCENES.length - 1) return;
    const localT = info.sceneTime;
    const T_A = 210, T_B = 780;
    if (localT < T_A || localT > T_B) return;
    const p = (localT - T_A) / (T_B - T_A);
    const al = (1 - p) * 0.72;
    const cx = STAGE_W / 2, cy = STAGE_H * 0.62;
    const r = 40 + p * 340;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(255,240,220,${al})`);
    g.addColorStop(0.3, `rgba(255,200,230,${al * 0.6})`);
    g.addColorStop(0.6, `rgba(200,130,220,${al * 0.25})`);
    g.addColorStop(1, 'rgba(100,40,160,0)');
    ctx.fillStyle = g;
    ctx.globalCompositeOperation = 'screen';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  const drawSparkGlyph = useCallback((cx: number, cy: number, size: number, alpha: number, hueMix: number) => {
    const ctx = A.current.ctx!;
    const gold = [255, 226, 140], pink = [255, 170, 220];
    const r = Math.round(lerp(gold[0], pink[0], hueMix));
    const g = Math.round(lerp(gold[1], pink[1], hueMix));
    const b = Math.round(lerp(gold[2], pink[2], hueMix));
    const col = `rgba(${r},${g},${b},${alpha})`;
    const colSoft = `rgba(${r},${g},${b},${alpha * 0.25})`;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = colSoft; ctx.shadowColor = col; ctx.shadowBlur = 14 * size;
    ctx.beginPath(); ctx.arc(0, 0, 1.8 * size, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 6 * size; ctx.fillStyle = col;
    const L = 7 * size, S = 1.4 * size;
    ctx.beginPath(); ctx.moveTo(0, -L); ctx.lineTo(S, 0); ctx.lineTo(0, L); ctx.lineTo(-S, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, S); ctx.lineTo(L, 0); ctx.lineTo(0, -S); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 2 * size; ctx.strokeStyle = col; ctx.lineWidth = 0.9 * size;
    const D = 2.8 * size;
    ctx.beginPath(); ctx.moveTo(-D, -D); ctx.lineTo(D, D); ctx.moveTo(D, -D); ctx.lineTo(-D, D); ctx.stroke();
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
  }, []);

  const drawBouquetFlourishes = useCallback((t: number) => {
    const a = A.current;
    const info = resolveScene(t);
    if (info.index !== SCENES.length - 1) return;
    const localT = info.sceneTime;
    if (localT < 1600) return;
    const al = localT < 3200 ? easeOutCubic((localT - 1600) / 1600) : 1;
    const floatDy = getBouquetFloat(t);
    const anchors = FLOURISH_ANCHORS.length > a.flourishMax ? FLOURISH_ANCHORS.slice(0, a.flourishMax) : FLOURISH_ANCHORS;
    for (const f of anchors) {
      const tw = Math.sin(t * 0.0018 + f.phase);
      const alpha = clamp(al * (0.55 + 0.45 * tw), 0, 1);
      if (alpha < 0.04) continue;
      const drift = Math.sin(t * 0.0012 + f.phase * 1.7) * 3;
      const cx = f.x * STAGE_W;
      const cy = f.y * STAGE_H + floatDy * 0.9 + drift;
      const hueMix = (Math.sin(f.phase * 2 + t * 0.0008) + 1) * 0.5;
      drawSparkGlyph(cx, cy, f.s * (0.85 + 0.25 * tw), alpha, hueMix);
    }
  }, [drawSparkGlyph]);

  // Particles
  const spawnParticle = useCallback((x: number, y: number, kind: string) => {
    A.current.particles.push({ x, y, vx: (Math.random() - 0.5) * 0.35, vy: -(0.25 + Math.random() * 0.55), life: 0, maxLife: 2600 + Math.random() * 2600, size: 0.5 + Math.random() * 1.1, kind, twinkle: Math.random() * Math.PI * 2 });
  }, []);

  const updateParticles = useCallback((dt: number) => {
    const ps = A.current.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.04; p.vy += 0.0002 * dt; p.life += dt; p.twinkle += dt * 0.008;
      if (p.life > p.maxLife) ps.splice(i, 1);
    }
  }, []);

  const drawParticlesBg = useCallback(() => {
    const ctx = A.current.ctx!;
    for (const p of A.current.particles) {
      const lr = p.life / p.maxLife;
      const rawAlpha = Math.sin(lr * Math.PI) * (0.55 + 0.45 * Math.sin(p.twinkle));
      if (rawAlpha <= 0.01) continue;
      const alpha = clamp(rawAlpha * 0.7, 0, 1);
      ctx.globalAlpha = alpha;
      const color = p.kind === 'gold' ? '#ffd866' : (p.kind === 'pink' ? '#ff9ad0' : '#ffffff');
      ctx.fillStyle = color; ctx.shadowBlur = 9; ctx.shadowColor = color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - lr * 0.3), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }, []);

  // Petals
  const spawnPetal = useCallback((fromTop: boolean) => {
    const a = A.current;
    if (a.petals.length > a.maxPetals) return;
    const idx = (Math.random() * PETAL_PALETTE.length) | 0;
    a.petals.push({ spriteIdx: idx, x: -20 + Math.random() * (STAGE_W + 40), y: fromTop ? -30 - Math.random() * 60 : Math.random() * STAGE_H * 0.3, vy: 0.012 + Math.random() * 0.022, vx: -0.008 + Math.random() * 0.016, rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 0.0009, size: 5.5 + Math.random() * 8, alpha: 0.42 + Math.random() * 0.28, phase: Math.random() * Math.PI * 2, sway: 0.12 + Math.random() * 0.1, life: 0, maxLife: 14000 + Math.random() * 5000 });
  }, []);

  const updatePetals = useCallback((dt: number) => {
    const ps = A.current.petals;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life += dt;
      const swayDX = Math.sin(p.life * 0.0015 + p.phase) * p.sway;
      p.x += (p.vx + swayDX * 0.2) * dt; p.y += p.vy * dt; p.rot += p.vrot * dt;
      if (p.y > STAGE_H + 30 || p.life > p.maxLife) ps.splice(i, 1);
    }
  }, []);

  const drawPetalsBg = useCallback(() => {
    const a = A.current;
    const ctx = a.ctx!;
    for (const p of a.petals) {
      const lr = p.life / p.maxLife;
      const fade = Math.sin(clamp(lr, 0, 1) * Math.PI);
      const al = p.alpha * fade * 0.85;
      if (al < 0.02) continue;
      const sprite = a.petalSprites[p.spriteIdx];
      if (!sprite) continue;
      const scale = p.size / PETAL_BASE_SIZE;
      const drawSize = PETAL_SPRITE_SIZE * scale;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = al;
      ctx.drawImage(sprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }, []);

  // ─── TEXT OVERLAY ──────────────────────────────────────────────────
  const clearTextTimers = useCallback(() => {
    for (const id of A.current.textTimers) clearTimeout(id);
    A.current.textTimers = [];
  }, []);

  const showText = useCallback((sceneIdx: number) => {
    const a = A.current;
    const textEl = textRef.current;
    if (!textEl) return;
    const sc = SCENES[sceneIdx];
    const isFinale = sceneIdx === SCENES.length - 1;
    clearTextTimers();
    textEl.classList.toggle('finale', isFinale);
    textEl.classList.remove('out');
    textEl.style.opacity = '1';

    if (isFinale) {
      textEl.innerHTML = [
        '<span class="fLine orn"><span class="word">&#10022;&nbsp;·&nbsp;&#10022;</span></span>',
        '<span class="fLine fIntro"><span class="word">voc&ecirc;</span> <span class="word">&eacute;</span></span>',
        '<span class="fLine fMid"><span class="word">o</span> <span class="word">mais</span> <span class="word">lindo</span></span>',
        '<span class="fLine fHero"><span class="word">presente</span></span>',
        '<span class="fLine fMid"><span class="word">que</span> <span class="word">a</span> <span class="word">vida</span> <span class="word">me</span> <span class="word">deu</span></span>',
        '<span class="fLine orn ornBot"><span class="word">&#10022;&nbsp;·&nbsp;&#10022;</span></span>',
      ].join('');
      const baseDelay = 2200;
      const timings = [
        { i: 0, t: 0 }, { i: 1, t: 220 }, { i: 2, t: 300 },
        { i: 3, t: 520 }, { i: 4, t: 600 }, { i: 5, t: 680 },
        { i: 6, t: 1000 },
        { i: 7, t: 1560 }, { i: 8, t: 1630 }, { i: 9, t: 1700 }, { i: 10, t: 1770 }, { i: 11, t: 1840 },
        { i: 12, t: 2150 },
      ];
      const words = textEl.querySelectorAll('.word');
      for (const T of timings) {
        const w = words[T.i];
        if (!w) continue;
        a.textTimers.push(setTimeout(() => w.classList.add('in'), baseDelay + T.t));
      }
    } else {
      const txt = gender === 'fem' ? sc.fem : sc.mas;
      const flowerCls = 'f-' + sc.id;
      const lines = txt.split('\n');
      const htmlLines = lines.map(line => {
        return line.split(' ').map(word => {
          let m = word.match(/^\{(.+?)\}([,.!?;:]*)$/);
          if (m) return `<span class="word em ${flowerCls}">${m[1]}</span>${m[2] ? '<span class="word punct">' + m[2] + '</span>' : ''}`;
          m = word.match(/^\[(.+?)\]([,.!?;:]*)$/);
          if (m) return `<span class="word flower ${flowerCls}">${m[1]}${m[2] || ''}</span>`;
          return `<span class="word">${word}</span>`;
        }).join(' ');
      }).join('<br>');
      textEl.innerHTML = htmlLines;
      const wordEls = Array.from(textEl.querySelectorAll('.word'));
      let delay = 110;
      const baseStagger = 58;
      const emPause = 180;
      const flowerPause = 420;
      wordEls.forEach((w) => {
        if (w.classList.contains('flower')) delay += flowerPause;
        else if (w.classList.contains('em')) delay += emPause;
        a.textTimers.push(setTimeout(() => w.classList.add('in'), delay));
        delay += baseStagger;
      });
    }
    a.textVisible = true;
  }, [gender, clearTextTimers]);

  const hideText = useCallback(() => {
    const textEl = textRef.current;
    if (!textEl) return;
    textEl.classList.add('out');
    A.current.textVisible = false;
  }, []);

  // ─── SCHEDULE FRAME (RAF with background tab fallback) ─────────────
  const scheduleFrame = useCallback((fn: (now: number) => void) => {
    if (document.hidden || document.visibilityState === 'hidden') {
      A.current.rafId = setTimeout(() => fn(performance.now()), 16) as unknown as number;
    } else {
      A.current.rafId = requestAnimationFrame(fn);
    }
  }, []);

  // ─── MAIN LOOP ────────────────────────────────────────────────────
  const frameLoop = useCallback((now: number) => {
    const a = A.current;
    if (!a.started || a.cancelled) return;
    const dt = a.lastFrame ? Math.min(50, now - a.lastFrame) : 16;
    a.lastFrame = now;
    let t = now - a.startTime;
    if (t >= TOTAL_DURATION) {
      t = TOTAL_DURATION;
      if (!a.animationDone) {
        a.animationDone = true;
        setPhase('done');
      }
    }

    const sInfo = resolveScene(t);
    if (sInfo.index !== a.currentSceneIdx) {
      a.currentSceneIdx = sInfo.index;
      showText(a.currentSceneIdx);
    }
    if (a.textVisible && sInfo.index < SCENES.length - 1) {
      const timeToEnd = sInfo.scene.duration - sInfo.sceneTime;
      if (timeToEnd < 500) hideText();
    }

    updateBackground(dt);
    updateParticles(dt);
    updatePetals(dt);

    if (Math.random() < 0.014) spawnPetal(true);
    if (sInfo.index === SCENES.length - 1 && sInfo.sceneTime > 1800 && sInfo.sceneTime < 5500) {
      if (Math.random() < 0.045) spawnPetal(true);
    }
    if (sInfo.index === SCENES.length - 1 && sInfo.sceneTime > 1250) {
      const rate = Math.min(1, (sInfo.sceneTime - 1250) / 780);
      if (Math.random() < 0.32 * rate) {
        const idx = [1, 2, 3, 5, 6, 7][Math.floor(Math.random() * 6)];
        const L = a.layers[idx];
        const px = L.x + L.w * L.scale * (0.2 + Math.random() * 0.6);
        const py = L.y + L.h * L.scale * (0.2 + Math.random() * 0.5);
        const kind = Math.random() < 0.6 ? 'gold' : (Math.random() < 0.55 ? 'pink' : 'white');
        spawnParticle(px, py, kind);
      }
    }
    const heroIdxSpawn = getCurrentHeroLayer(t);
    if (heroIdxSpawn >= 0 && sInfo.sceneTime > 1000 && sInfo.sceneTime < 2150) {
      if (Math.random() < 0.28) {
        const cx = STAGE_W / 2, cy = STAGE_H * 0.62;
        const ang = Math.random() * Math.PI * 2;
        const rad = 95 + Math.random() * 75;
        spawnParticle(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * 0.9, Math.random() < 0.75 ? 'gold' : 'pink');
      }
    }
    if (Math.random() < 0.04) {
      spawnParticle(Math.random() * STAGE_W, STAGE_H * 0.2 + Math.random() * STAGE_H * 0.75, 'white');
    }

    const ctx = a.ctx!;
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    drawBackground(t);
    const heroIdx = getCurrentHeroLayer(t);
    drawHeroGlowRing(t, heroIdx);
    drawPetalsBg();
    drawParticlesBg();
    drawBouquetFlourishes(t);

    for (let i = 0; i < a.layers.length; i++) {
      if (i === heroIdx) continue;
      const res = computeLayerState(a.layers, i, t);
      if (res) drawLayer(i, res.state, res.alpha, computeLayerGlow(i, t));
    }
    if (heroIdx >= 0) {
      const res = computeLayerState(a.layers, heroIdx, t);
      if (res) drawLayer(heroIdx, res.state, res.alpha, computeLayerGlow(heroIdx, t));
    }

    drawLightBurst(t);
    drawCinematicVignette(t);
    drawGrain(t);

    scheduleFrame(frameLoop);
  }, [showText, hideText, updateBackground, updateParticles, updatePetals, spawnPetal, spawnParticle, drawBackground, drawHeroGlowRing, drawPetalsBg, drawParticlesBg, drawBouquetFlourishes, drawLayer, drawLightBurst, drawCinematicVignette, drawGrain, scheduleFrame]);

  // ─── LOADING EFFECT ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const a = A.current;
    a.isMobile = (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) || (window.innerWidth < 640);
    a.maxPetals = a.isMobile ? 10 : 14;
    a.orbCount = a.isMobile ? 6 : 9;
    a.starCount = a.isMobile ? 50 : 75;
    a.grainTickMod = a.isMobile ? 4 : 3;
    a.flourishMax = a.isMobile ? 5 : 7;

    async function load() {
      const layers: Layer[] = JSON.parse(JSON.stringify(INITIAL_LAYERS));
      const [images] = await Promise.all([
        loadAllImages(layers),
        loadFonts(),
      ]);
      if (cancelled) return;
      computeBboxes(layers, images);
      applyLayout(layers);
      a.layers = layers;
      a.images = images;

      const canvas = canvasRef.current;
      if (!canvas) return;
      a.ctx = canvas.getContext('2d', { alpha: true })!;

      resizeCanvas();
      initBackground();
      initGrain();
      initPetalSprites();

      // Draw initial background
      a.ctx.clearRect(0, 0, STAGE_W, STAGE_H);
      renderBgOffscreen();
      a.bgLastRender = performance.now();
      a.ctx.drawImage(a.bgCanvas!, 0, 0, STAGE_W, STAGE_H);

      if (!cancelled) setPhase('ready');
    }

    load().catch((err) => {
      console.error('[FlowerPoemIntro] Load failed:', err);
      if (!cancelled) onReveal();
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── RESIZE HANDLER ────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => { if (A.current.ctx) resizeCanvas(); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [resizeCanvas]);

  // ─── START ANIMATION ───────────────────────────────────────────────
  const handleStart = useCallback(() => {
    const a = A.current;
    if (a.started) return;
    a.started = true;
    a.startTime = performance.now();
    a.lastFrame = 0;
    a.currentSceneIdx = -1;
    a.animationDone = false;
    a.particles.length = 0;
    a.petals.length = 0;
    for (let i = 0; i < 6; i++) spawnPetal(false);
    setPhase('playing');
    scheduleFrame(frameLoop);
  }, [spawnPetal, scheduleFrame, frameLoop]);

  // ─── DONE → REVEAL ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'done') return;
    const timer = setTimeout(onReveal, 1500);
    return () => clearTimeout(timer);
  }, [phase, onReveal]);

  // ─── CLEANUP ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      const a = A.current;
      a.cancelled = true;
      if (a.rafId) {
        cancelAnimationFrame(a.rafId);
        clearTimeout(a.rafId);
      }
      clearTextTimers();
    };
  }, [clearTextTimers]);

  // ─── CSS INJECTION ─────────────────────────────────────────────────
  const cssContent = buildCSS();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssContent }} />
      <div className="poema-root">
        {phase === 'loading' && (
          <div className="poema-loading">
            carregando sua página...
          </div>
        )}

        <div ref={wrapRef} className="poema-wrap">
          <canvas ref={canvasRef} className="poema-canvas" />
          <div ref={textRef} className="poema-text" />

          {phase === 'ready' && (
            <div className="poema-readyScreen">
              <div className="poema-ringWrap">
                <button className="poema-startBtn" onClick={handleStart}>
                  <span className="poema-btnLabel">toque para</span>
                  <span className="poema-btnText">revelar sua surpresa <span className="heart">&#10084;</span></span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
