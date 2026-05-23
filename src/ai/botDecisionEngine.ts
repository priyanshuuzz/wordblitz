// ── Bot Decision Engine ───────────────────────────────────────────────────
// Drives bot word selection with personality-based behaviour.
// Used by GameBoard for local/offline bots.

import { getAIWordHints } from "../lib/ai";
import type { BotProfile } from "./botProfiles";

const RARE_LETTERS = new Set(["Q", "X", "Z", "J"]);

// Per-letter fallback dictionary (used when API is unavailable)
const LOCAL_DICT: Record<string, string[]> = {
  A: ["apple","anchor","arrow","azure","abyss","acute","agile","ample"],
  B: ["brave","blade","blast","bloom","bound","brisk","blaze","brief"],
  C: ["chain","charm","chase","clear","climb","craft","crisp","crown"],
  D: ["dawn","dock","draft","drive","dune","depth","delta","dense"],
  E: ["eagle","earth","elder","elite","enter","epoch","evoke","exact"],
  F: ["flame","flash","fleet","float","forge","frost","flair","flint"],
  G: ["gold","gate","glow","grace","grand","grind","grove","guile"],
  H: ["horse","heart","hill","honor","heavy","haste","haven","hinge"],
  I: ["image","index","inner","issue","ideal","ivory","infer","inlet"],
  J: ["judge","juice","jewel","joint","joker","jumbo","jazzy","joist"],
  K: ["king","keen","karma","knife","knock","knack","kneel","kudos"],
  L: ["light","lance","level","learn","laser","latch","lofty","lunar"],
  M: ["moon","mist","mind","mode","magic","marsh","merit","might"],
  N: ["noble","nerve","night","north","novel","nexus","niche","nimble"],
  O: ["ocean","order","orbit","olive","onset","optic","ozone","outdo"],
  P: ["pulse","phase","prime","power","paint","pivot","plume","prism"],
  Q: ["quest","quick","quote","queen","quota","quill","quirk","quaff"],
  R: ["river","rope","rise","realm","rapid","ridge","rivet","roast"],
  S: ["spark","stone","surge","smart","scale","swift","stern","stead"],
  T: ["tower","trace","trust","trail","theme","thorn","titan","torch"],
  U: ["under","union","ultra","unite","upper","usher","utter","unify"],
  V: ["voice","vivid","vapor","valid","verse","valor","vault","venom"],
  W: ["wave","wind","world","watch","water","wield","wrath","weave"],
  X: ["xenon","xray"],
  Y: ["yield","young","yacht","yearn","youth","yodel","yummy"],
  Z: ["zebra","zone","zenith","zeal","zest","zilch","zippy","zonal"],
};

// Datamuse cache
const apiCache: Record<string, string[]> = {};

export interface BotDecision {
  word:      string | null;   // null = bot fails (gets eliminated)
  delayMs:   number;
  isMistake: boolean;
}

/**
 * Decide what word the bot plays next.
 * Returns a promise that resolves after the bot's "thinking" delay.
 */
export async function decideBotWord(
  profile:    BotProfile,
  lastWord:   string,
  usedWords:  string[],
  category:   string | null,
  opponentAvgMs: number   // average response time of human player (for adaptive)
): Promise<BotDecision> {
  const lc = lastWord.slice(-1).toUpperCase();

  // Compute delay
  let delayMs = profile.minDelayMs + Math.random() * (profile.maxDelayMs - profile.minDelayMs);

  // Adaptive: if opponent is fast, bot speeds up
  if (profile.adaptiveDiff && opponentAvgMs > 0) {
    delayMs = Math.min(delayMs, opponentAvgMs * 0.85 + Math.random() * 400);
    delayMs = Math.max(delayMs, profile.minDelayMs);
  }

  // Troll: sometimes waits until last second
  if (profile.personality === "troll" && Math.random() < 0.2) {
    delayMs = Math.random() * 7000 + 1000;
  }

  // Mistake: bot submits a wrong word on purpose
  if (Math.random() < profile.mistakeRate) {
    return { word: null, delayMs, isMistake: true };
  }

  // Gather candidates
  let candidates: string[] = [];

  // 1. Try AI (OpenRouter)
  try {
    const ai = await getAIWordHints(lc, usedWords, category ?? undefined);
    if (ai.words.length > 0) candidates = ai.words;
  } catch {}

  // 2. Datamuse fallback
  if (!candidates.length) {
    try {
      if (apiCache[lc]) {
        candidates = apiCache[lc];
      } else {
        const r = await fetch(`https://api.datamuse.com/words?sp=${lc.toLowerCase()}*&max=100`);
        if (r.ok) {
          const d = await r.json() as { word: string }[];
          candidates = d.map(x => x.word.toUpperCase());
          apiCache[lc] = candidates;
        }
      }
    } catch {}
  }

  // 3. Local dict fallback
  if (!candidates.length) {
    candidates = (LOCAL_DICT[lc] ?? []).map(w => w.toUpperCase());
  }

  const used = new Set(usedWords.map(w => w.toUpperCase()));
  let valid = candidates.filter(w =>
    w.startsWith(lc) && !used.has(w) && w.length >= 3 && /^[A-Z]+$/.test(w)
  );

  if (!valid.length) return { word: null, delayMs, isMistake: false };

  // Apply personality preferences
  if (profile.prefersRare) {
    const rare = valid.filter(w => [...w].some(c => RARE_LETTERS.has(c)));
    if (rare.length) valid = rare;
  }
  if (profile.prefersLong) {
    const long = valid.filter(w => w.length >= 7);
    if (long.length) valid = long;
  }
  if (profile.prefersShort) {
    const short = valid.filter(w => w.length <= 5);
    if (short.length) valid = short;
  }

  // Pick from top candidates (randomised within top 8)
  const pool = valid.slice(0, 8);
  const word = pool[Math.floor(Math.random() * pool.length)];

  return { word, delayMs, isMistake: false };
}

/** Taunt messages by personality */
export const TAUNTS: Record<string, string[]> = {
  aggressive: ["Too slow!", "Is that all you got?", "GG EZ"],
  troll:      ["lol", "try harder", "😂", "skill issue"],
  grinder:    ["Interesting choice.", "I've seen better."],
  fast_typer: ["Speed is key.", "Blink and you miss it."],
  default:    ["Nice word!", "Good game so far."],
};

export function getBotTaunt(personality: string): string {
  const list = TAUNTS[personality] ?? TAUNTS.default;
  return list[Math.floor(Math.random() * list.length)];
}
