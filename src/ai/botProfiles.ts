// ── Bot Personality Profiles ──────────────────────────────────────────────
// Each profile controls timing, word selection, and mistake behaviour.

export type BotPersonality =
  | "aggressive"
  | "fast_typer"
  | "rare_specialist"
  | "casual"
  | "troll"
  | "grinder";

export interface BotProfile {
  personality:    BotPersonality;
  name:           string;
  avatar:         string;
  minDelayMs:     number;   // fastest possible response
  maxDelayMs:     number;   // slowest possible response
  mistakeRate:    number;   // 0–1 probability of submitting a wrong word
  prefersRare:    boolean;  // prefers Q/X/Z/J words
  prefersLong:    boolean;  // prefers 7+ letter words
  prefersShort:   boolean;  // prefers 3–4 letter words (speed)
  adaptiveDiff:   boolean;  // adjusts speed based on opponent's pace
  tauntChance:    number;   // 0–1 probability of emitting a taunt message
}

export const BOT_PROFILES: Record<BotPersonality, BotProfile> = {
  aggressive: {
    personality:  "aggressive",
    name:         "VIPER_99",
    avatar:       "https://api.dicebear.com/7.x/avataaars/svg?seed=Viper",
    minDelayMs:   600,
    maxDelayMs:   1400,
    mistakeRate:  0.04,
    prefersRare:  false,
    prefersLong:  false,
    prefersShort: true,
    adaptiveDiff: true,
    tauntChance:  0.15,
  },
  fast_typer: {
    personality:  "fast_typer",
    name:         "SWIFTKEY",
    avatar:       "https://api.dicebear.com/7.x/avataaars/svg?seed=Swift",
    minDelayMs:   400,
    maxDelayMs:   900,
    mistakeRate:  0.08,
    prefersRare:  false,
    prefersLong:  false,
    prefersShort: true,
    adaptiveDiff: false,
    tauntChance:  0.05,
  },
  rare_specialist: {
    personality:  "rare_specialist",
    name:         "LEXIS_MAX",
    avatar:       "https://api.dicebear.com/7.x/avataaars/svg?seed=Lexis",
    minDelayMs:   1800,
    maxDelayMs:   3500,
    mistakeRate:  0.02,
    prefersRare:  true,
    prefersLong:  true,
    prefersShort: false,
    adaptiveDiff: false,
    tauntChance:  0.08,
  },
  casual: {
    personality:  "casual",
    name:         "WORD_WOLF",
    avatar:       "https://api.dicebear.com/7.x/avataaars/svg?seed=Wolf",
    minDelayMs:   2000,
    maxDelayMs:   5000,
    mistakeRate:  0.15,
    prefersRare:  false,
    prefersLong:  false,
    prefersShort: false,
    adaptiveDiff: false,
    tauntChance:  0.02,
  },
  troll: {
    personality:  "troll",
    name:         "BYTE_ME",
    avatar:       "https://api.dicebear.com/7.x/avataaars/svg?seed=Byte",
    minDelayMs:   100,
    maxDelayMs:   8000,   // wildly inconsistent
    mistakeRate:  0.25,
    prefersRare:  false,
    prefersLong:  false,
    prefersShort: false,
    adaptiveDiff: false,
    tauntChance:  0.35,
  },
  grinder: {
    personality:  "grinder",
    name:         "CRYPTIC_K",
    avatar:       "https://api.dicebear.com/7.x/avataaars/svg?seed=Cryptic",
    minDelayMs:   1200,
    maxDelayMs:   2200,
    mistakeRate:  0.01,
    prefersRare:  true,
    prefersLong:  true,
    prefersShort: false,
    adaptiveDiff: true,
    tauntChance:  0.0,
  },
};

/** Pick a random personality weighted toward casual/aggressive for variety */
export function randomPersonality(): BotPersonality {
  const pool: BotPersonality[] = [
    "aggressive", "aggressive",
    "fast_typer",
    "rare_specialist",
    "casual", "casual",
    "grinder",
    "troll",
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getProfile(p: BotPersonality): BotProfile {
  return BOT_PROFILES[p];
}
