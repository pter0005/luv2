import type { WizardSegmentKey } from './wizard-segment-config';
import type { ChatStepKey, CupidContext } from './chat-script';

type LineFn = (ctx: CupidContext) => string;
type SegmentLines = Record<ChatStepKey, LineFn>;

const nameOr = (ctx: CupidContext, fallback: string) =>
  (ctx.recipientName && ctx.recipientName.trim()) || fallback;

// ─────────────────────────────────────────────────────────────
// PARTNER — romantic, warm, emoji-rich tone
// ─────────────────────────────────────────────────────────────
const NAMORADE_LINES_EN: SegmentLines = {
  recipient: () => 'Hey! 💘 First things first: what\'s the name of the special person you\'re surprising?',
  title: (ctx) => `Aww, ${nameOr(ctx, 'what a beautiful name')}! 🥰 Now tell me: what should the page title say? (their name, a nickname, a sweet phrase…)`,
  message: (ctx) => `Here comes the best part 💌 — write the message your heart wants to send to ${nameOr(ctx, 'them')}. Let it flow, Cupid will help you make it sweet!`,
  specialDate: () => `Yay! Tell me: how long have you been together? ⏳ (we'll show the time of your love right on the page 💖)`,
  gallery: (ctx) => `Time to pick the photos 📸 — drop your favorites of the two of you — ${nameOr(ctx, 'they')}'re gonna love reliving these!`,
  timeline: () => `Now the moments that made you 🕰️ — first date, first trip, that unforgettable day… build your story!`,
  intro: (ctx) => `Want a special little intro to surprise ${nameOr(ctx, 'them')}? ✨ We've got some really cute animations.`,
  music: (ctx) => `Got a song that's yours together? 🎶 Drop it here so it plays when ${nameOr(ctx, 'they')} open the page!`,
  voice: (ctx) => `This one's my favorite 🎤 — record a voice note for ${nameOr(ctx, 'them')} to hear. I promise it melts hearts.`,
  background: () => `Let's set the mood 💫 — which animated background looks coolest?`,
  extras: (ctx) => `Want to make it even more fun? 🎮 You can add little games for ${nameOr(ctx, 'them')} to play as they explore.`,
  plan: () => `Almost there! 🎉 Pick the plan that fits the surprise you want to deliver.`,
  payment: (ctx) => `All set! 💌 Just finish up and your surprise goes straight to ${nameOr(ctx, 'them')}.`,
};

// ─────────────────────────────────────────────────────────────
// MOM — tender, emotional, full of warmth
// ─────────────────────────────────────────────────────────────
const MAE_LINES_EN: SegmentLines = {
  recipient: () => 'Aww, a tribute to mom 💕 — tell me, what\'s her name?',
  title: (ctx) => `Oh, ${nameOr(ctx, 'what a lovely name')}! 🌷 How should we title this tribute? Maybe "Best mom in the world" or something unique just for you two.`,
  message: (ctx) => `Now the part that tugs at your heart 💞 — what have you always wanted to say to ${nameOr(ctx, 'her')}? Let it all out, it can be long!`,
  specialDate: () => `Tell me: when did your story together begin? 🌿 (your birthday works too — we'll show the time of your love on the page!)`,
  gallery: (ctx) => `Photo time 📸 — pick the ones that mean the most. ${nameOr(ctx, 'She')} is gonna cry!`,
  timeline: () => `Now let's build your special moments 🕰️ — birthdays, trips, the day that… bring it all!`,
  intro: () => `Want a special opening to surprise her? ✨ Adds a magical touch right away.`,
  music: (ctx) => `Got a song that reminds you of ${nameOr(ctx, 'her')}? 🎶 Paste it here — the right song gives chills instantly.`,
  voice: (ctx) => `This one's beautiful 🎤 — record a voice note saying what ${nameOr(ctx, 'she')} means to you. She'll keep it forever.`,
  background: () => `What vibe do you want for the tribute? 💫 Look how pretty these are:`,
  extras: () => `Want to add interactive games? 🎮 Makes the page even more special.`,
  plan: () => `Almost done! 🎉 Pick the plan that suits what you want.`,
  payment: (ctx) => `Just wrap it up and ${nameOr(ctx, 'your mom')} will get something beautiful 💐`,
};

// ─────────────────────────────────────────────────────────────
// SPOUSE — mature, romantic, deep companionship
// ─────────────────────────────────────────────────────────────
const ESPOUSE_LINES_EN: SegmentLines = {
  recipient: () => 'How lovely! 💍 First — what\'s your love\'s name?',
  title: (ctx) => `${nameOr(ctx, 'Aww')}… beautiful name 🥹 How should we title this page? Could be a line that sums up you two.`,
  message: (ctx) => `Now the message 💌 — what does your heart want to tell ${nameOr(ctx, 'them')}? Open up, it\'s safe here!`,
  specialDate: () => `Tell me: how long have you been building this life together? 💞 (wedding, dating since — whichever fits most)`,
  gallery: () => `Let's see your photos 📸 — pick the ones that tell your story.`,
  timeline: () => `Now your milestones 🕰️ — the day you met, the "yes", trips, every moment counts.`,
  intro: (ctx) => `Want a special opener to surprise ${nameOr(ctx, 'them')}? ✨`,
  music: () => `Your song together, which one? 🎶 Paste it here so it plays on the opener.`,
  voice: (ctx) => `Record a voice note for ${nameOr(ctx, 'them')} 🎤 — promise, it'll give chills.`,
  background: () => `Let's set a special vibe 💫 — which background matches you two best?`,
  extras: () => `Want to add little games for fun? 🎮 Makes it even more memorable.`,
  plan: () => `Almost there! 🎉 Pick the plan that fits your surprise.`,
  payment: (ctx) => `Just finish up and the surprise is on its way to ${nameOr(ctx, 'them')} 💌`,
};

// ─────────────────────────────────────────────────────────────
// FRIEND — light, playful, chosen family
// ─────────────────────────────────────────────────────────────
const AMIGE_LINES_EN: SegmentLines = {
  recipient: () => 'Best-friends-are-family energy 🫶 — tell me, what\'s their name?',
  title: (ctx) => `${nameOr(ctx, 'That person')} is SO lucky! 🌟 How should we title the page? An inside joke, a phrase, anything goes.`,
  message: (ctx) => `Write it out, no shame 💌 — what have you always wanted to tell ${nameOr(ctx, 'them')}? Laugh, cry, whatever feels right.`,
  specialDate: () => `How long have you two been friends? ⏳ (since school? college? yesterday?)`,
  gallery: () => `Best photos time 📸 — the funny ones, the cute ones, the ones nobody\'s supposed to see…`,
  timeline: () => `Let's map your story 🕰️ — iconic nights out, trips, chaos, all of it counts!`,
  intro: () => `Want a special opener to go out with a bang? ✨`,
  music: () => `Got a song that\'s basically your anthem? 🎶 Drop it here!`,
  voice: (ctx) => `Record a voice note for ${nameOr(ctx, 'them')} 🎤 — it's gonna be unique, promise.`,
  background: () => `Which of these backgrounds matches your vibe? 💫`,
  extras: () => `Want to add games? 🎮 So much fun.`,
  plan: () => `Almost done! 🎉 Pick the plan.`,
  payment: (ctx) => `Go for it 💌 — ${nameOr(ctx, 'they')} have no idea what\'s coming!`,
};

// ─────────────────────────────────────────────────────────────
// DAD — respectful, affectionate, emotional
// ─────────────────────────────────────────────────────────────
const PAI_LINES_EN: SegmentLines = {
  recipient: () => 'A tribute to dad 💙 — that\'s beautiful. What\'s his name?',
  title: (ctx) => `${nameOr(ctx, 'Strong name')}! Now how should we title this tribute? Could be "To the best dad" or something unique.`,
  message: (ctx) => `The most special part 💌 — what do you want to tell ${nameOr(ctx, 'him')}? Let it out, he deserves to hear it.`,
  specialDate: () => `Tell me: when did your story together start? 🌿 (your birthday works — we'll show the time together on the page)`,
  gallery: () => `Let's relive these moments 📸 — pick the photos that matter most.`,
  timeline: () => `Moments that last forever 🕰️ — trips, advice, that old photo…`,
  intro: () => `Want a special opener? ✨ Makes it memorable right from the start.`,
  music: (ctx) => `Got a song that reminds you of ${nameOr(ctx, 'him')}? 🎶 Drop it here, it\'ll hit.`,
  voice: (ctx) => `Record a voice note 🎤 — ${nameOr(ctx, 'your dad')} will listen and keep it forever.`,
  background: () => `Which background fits the tribute? 💫`,
  extras: () => `Want to add games? 🎮 Adds an interactive touch.`,
  plan: () => `Almost there! 🎉 Pick the plan.`,
  payment: (ctx) => `Finish up and ${nameOr(ctx, 'he')}'ll get something unforgettable 💙`,
};

// ─────────────────────────────────────────────────────────────
// GRANDPARENT — pure tenderness, full of love
// ─────────────────────────────────────────────────────────────
const AVO_LINES_EN: SegmentLines = {
  recipient: () => 'Aww, a tribute to grandma/grandpa 🥹 — the sweetest thing. What\'s their name?',
  title: (ctx) => `${nameOr(ctx, 'Golden name')}! How should we title this tribute? Could be "My grandma" or a special nickname.`,
  message: () => `Now the sweetest part 💌 — what have you always wanted to say? Let your heart speak.`,
  specialDate: () => `Tell me: when did your love story start? 🌿 (your birth works!)`,
  gallery: () => `Old photos, recent photos, all welcome 📸 — pick the ones that mean the most.`,
  timeline: () => `The unforgettable moments 🕰️ — Sunday lunches, trips, stories…`,
  intro: () => `Want a special opener to make it even more magical? ✨`,
  music: (ctx) => `Got a song that reminds you of ${nameOr(ctx, 'them')}? 🎶`,
  voice: (ctx) => `This one melts any grandparent 🎤 — record a voice note for ${nameOr(ctx, 'them')}.`,
  background: () => `Which background fits best? 💫`,
  extras: () => `Want games? 🎮 Adds some fun.`,
  plan: () => `Almost ready! 🎉 Pick the plan.`,
  payment: (ctx) => `Just finish up and ${nameOr(ctx, 'they')}'ll get something truly unique 💕`,
};

// ─────────────────────────────────────────────────────────────
// CHILD — proud, tender, parental warmth
// ─────────────────────────────────────────────────────────────
const FILHO_LINES_EN: SegmentLines = {
  recipient: () => 'A tribute to your kid 🌱 — amazing! What\'s their name?',
  title: (ctx) => `${nameOr(ctx, 'Beautiful name')}! What should the page title be? Their name, a sweet phrase…`,
  message: (ctx) => `Now the message 💌 — what do you want ${nameOr(ctx, 'them')} to read and keep forever?`,
  specialDate: (ctx) => `How long has ${nameOr(ctx, 'your child')} been lighting up your life? 🌟 (birth date works!)`,
  gallery: () => `Let's pick the most meaningful photos 📸 — from day one to today.`,
  timeline: () => `The moments you want to keep eternal 🕰️ — first word, milestones, trips…`,
  intro: () => `Want a special opener? ✨`,
  music: () => `Got a song that\'s yours together? 🎶 Drop it here.`,
  voice: (ctx) => `Record a voice note 🎤 — ${nameOr(ctx, 'they')}'ll keep it for life.`,
  background: () => `Which background fits best? 💫`,
  extras: () => `Want games? 🎮`,
  plan: () => `Almost there! 🎉 Pick the plan.`,
  payment: (ctx) => `Finish up and ${nameOr(ctx, 'they')}'ll be in tears 🥹`,
};

export const CUPID_LINES_EN: Record<WizardSegmentKey, SegmentLines> = {
  namorade: NAMORADE_LINES_EN,
  mae: MAE_LINES_EN,
  espouse: ESPOUSE_LINES_EN,
  amige: AMIGE_LINES_EN,
  pai: PAI_LINES_EN,
  avo: AVO_LINES_EN,
  filho: FILHO_LINES_EN,
};
