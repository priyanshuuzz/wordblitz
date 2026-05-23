// ── Combo & Multiplier System ─────────────────────────────────────────────
// Tracks per-match combo state and computes XP multipliers.
// Pure functions — no side effects, no imports from store.

export interface ComboState {
  count:        number;   // consecutive valid words this turn streak
  multiplier:   number;   // current XP multiplier (1.0 – 4.0)
  lastWordTime: number;   // ms timestamp of last accepted word
  speedStreak:  number;   // words submitted in < SPEED_THRESHOLD_MS
}

export interface ComboResult {
  xp:          number;
  multiplier:  number;
  comboCount:  number;
  bonusType:   ComboBonus | null;
  label:       string | null;
}

export type ComboBonus =
  | "speed"        // submitted in < 3s
  | "rare_letter"  // Q, X, Z, J
  | "long_word"    // 7+ letters
  | "streak"       // 5+ consecutive
  | "survival";    // last player standing bonus

// ── Constants ──────────────────────────────────────────────────────────────
const SPEED_THRESHOLD_MS  = 3_000;   // < 3s = speed bonus
const RARE_LETTERS        = new Set(["Q","X","Z","J"]);
const LONG_WORD_MIN       = 7;
const BASE_XP_PER_LETTER  = 3;
const BASE_XP_MIN         = 5;

// ── Initial state ──────────────────────────────────────────────────────────
export function createComboState(): ComboState {
  return { count: 0, multiplier: 1.0, lastWordTime: 0, speedStreak: 0 };
}

// ── Core calculation ───────────────────────────────────────────────────────
export function processWord(
  word: string,
  state: ComboState,
  now = Date.now()
): { result: ComboResult; nextState: ComboState } {
  const upper      = word.toUpperCase();
  const timeDelta  = state.lastWordTime > 0 ? now - state.lastWordTime : Infinity;
  const isSpeed    = timeDelta < SPEED_THRESHOLD_MS;
  const isRare     = [...upper].some(c => RARE_LETTERS.has(c));
  const isLong     = upper.length >= LONG_WORD_MIN;

  // Determine active bonus (priority order)
  let bonusType: ComboBonus | null = null;
  if (isSpeed)  bonusType = "speed";
  if (isRare)   bonusType = "rare_letter";
  if (isLong)   bonusType = "long_word";

  // Advance combo count
  const newCount      = state.count + 1;
  const newSpeedStreak = isSpeed ? state.speedStreak + 1 : 0;
  if (newCount >= 5)  bonusType = "streak";

  // Multiplier ramp: 1.0 → 1.5 → 2.0 → 3.0 → 4.0
  const multiplier = computeMultiplier(newCount, bonusType);

  // Base XP
  const baseXp = Math.max(BASE_XP_MIN, upper.length * BASE_XP_PER_LETTER);
  const xp     = Math.round(baseXp * multiplier);

  // Label for UI
  const label = buildLabel(bonusType, newCount, multiplier);

  const result: ComboResult = {
    xp,
    multiplier,
    comboCount: newCount,
    bonusType,
    label,
  };

  const nextState: ComboState = {
    count:        newCount,
    multiplier,
    lastWordTime: now,
    speedStreak:  newSpeedStreak,
  };

  return { result, nextState };
}

// ── Reset on timeout / elimination ────────────────────────────────────────
export function resetCombo(state: ComboState): ComboState {
  return { ...state, count: 0, multiplier: 1.0, speedStreak: 0 };
}

// ── Survival bonus (called at game end for winner) ─────────────────────────
export function survivalBonus(wordsPlayed: number): number {
  return Math.round(50 + wordsPlayed * 5);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function computeMultiplier(count: number, bonus: ComboBonus | null): number {
  let base = 1.0;
  if (count >= 10) base = 4.0;
  else if (count >= 7) base = 3.0;
  else if (count >= 5) base = 2.0;
  else if (count >= 3) base = 1.5;

  // Bonus stacks
  if (bonus === "rare_letter") base = Math.min(4.0, base + 0.5);
  if (bonus === "long_word")   base = Math.min(4.0, base + 0.25);
  if (bonus === "speed")       base = Math.min(4.0, base + 0.25);

  return Math.round(base * 100) / 100;
}

function buildLabel(bonus: ComboBonus | null, count: number, multiplier: number): string | null {
  if (count < 2 && !bonus) return null;

  const parts: string[] = [];
  if (bonus === "speed")       parts.push("⚡ SPEED");
  if (bonus === "rare_letter") parts.push("💎 RARE");
  if (bonus === "long_word")   parts.push("📏 LONG");
  if (bonus === "streak" || count >= 5) parts.push(`🔥 x${count} STREAK`);

  if (!parts.length && count >= 2) parts.push(`x${count} COMBO`);

  return `${parts.join(" · ")} ×${multiplier}`;
}
