// ── Dynamic Match Modifier Engine ────────────────────────────────────────
// Modifiers change the rules mid-match to prevent repetitive gameplay.
// Server applies modifiers; client receives them via socket events.

export type ModifierId =
  | "no_vowels"
  | "reverse_mode"
  | "sudden_death"
  | "long_words_only"
  | "blitz_mode"
  | "category_swap";

export interface ModifierDef {
  id:          ModifierId;
  name:        string;
  description: string;
  icon:        string;
  color:       string;
  durationMs:  number | null;   // null = lasts entire match
}

export interface ActiveModifier {
  id:        ModifierId;
  startedAt: number;
  expiresAt: number | null;
}

// ── Definitions ────────────────────────────────────────────────────────────
export const MODIFIERS: Record<ModifierId, ModifierDef> = {
  no_vowels: {
    id:          "no_vowels",
    name:        "No Vowels",
    description: "Words must not contain A, E, I, O, U",
    icon:        "🔇",
    color:       "#ff5c3a",
    durationMs:  30_000,
  },
  reverse_mode: {
    id:          "reverse_mode",
    name:        "Reverse Mode",
    description: "Words must start with the FIRST letter of the previous word",
    icon:        "🔄",
    color:       "#ff51fa",
    durationMs:  20_000,
  },
  sudden_death: {
    id:          "sudden_death",
    name:        "Sudden Death",
    description: "One wrong word = instant elimination",
    icon:        "💀",
    color:       "#ff2200",
    durationMs:  null,
  },
  long_words_only: {
    id:          "long_words_only",
    name:        "Long Words Only",
    description: "Words must be 5+ letters",
    icon:        "📏",
    color:       "#cafd00",
    durationMs:  30_000,
  },
  blitz_mode: {
    id:          "blitz_mode",
    name:        "Blitz Mode",
    description: "Turn timer reduced to 5 seconds",
    icon:        "⚡",
    color:       "#ffd166",
    durationMs:  20_000,
  },
  category_swap: {
    id:          "category_swap",
    name:        "Category Swap",
    description: "Random category applied for next 3 turns",
    icon:        "🔀",
    color:       "#8a8a8a",
    durationMs:  null,
  },
};

// ── Validation with active modifiers ──────────────────────────────────────
export function validateWithModifiers(
  word: string,
  activeModifiers: ActiveModifier[]
): { valid: boolean; reason?: string } {
  const upper = word.toUpperCase();
  const now   = Date.now();

  for (const am of activeModifiers) {
    // Skip expired
    if (am.expiresAt !== null && now > am.expiresAt) continue;

    switch (am.id) {
      case "no_vowels": {
        if (/[AEIOU]/.test(upper)) {
          return { valid: false, reason: "No vowels allowed!" };
        }
        break;
      }
      case "long_words_only": {
        if (upper.length < 5) {
          return { valid: false, reason: "Must be 5+ letters!" };
        }
        break;
      }
    }
  }

  return { valid: true };
}

// ── Modifier selection (server-side logic, mirrored here for display) ──────
const RANDOM_POOL: ModifierId[] = [
  "no_vowels",
  "long_words_only",
  "blitz_mode",
  "reverse_mode",
];

export function pickRandomModifier(): ModifierId {
  return RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
}

export function isModifierActive(
  id: ModifierId,
  activeModifiers: ActiveModifier[]
): boolean {
  const now = Date.now();
  return activeModifiers.some(
    am => am.id === id && (am.expiresAt === null || now < am.expiresAt)
  );
}
