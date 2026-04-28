/**
 * Unified scarcity/urgency numbers.
 *
 * All urgency components (DiscountBanner, ScarcityIndicator, BuyerCount)
 * derive their numbers from the same seed so "X bought today" and
 * "Y spots remaining" are always consistent (buyers + remaining ≈ total).
 *
 * The seed is deterministic per calendar day + 2-hour block, so numbers
 * shift naturally throughout the day without contradicting each other.
 */

const TOTAL_DAILY_SPOTS = 150;

/** Simple deterministic hash from a numeric seed. */
function seededRandom(seed: number): number {
  // mulberry32
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function getDaySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function getHourBlock(): number {
  return Math.floor(new Date().getHours() / 2); // 0-11, changes every 2h
}

/**
 * Returns the base buyer count for right now.
 * Range: 80–130, shifts with 2-hour blocks throughout the day.
 */
export function getBuyersToday(): number {
  const seed = getDaySeed() * 13 + getHourBlock() * 7;
  // 80-130 range
  return 80 + Math.floor(seededRandom(seed) * 51);
}

/**
 * Returns the remaining discount spots for right now.
 * Always equals TOTAL_DAILY_SPOTS - buyersToday, so 20-70.
 */
export function getRemainingSpots(): number {
  return TOTAL_DAILY_SPOTS - getBuyersToday();
}
