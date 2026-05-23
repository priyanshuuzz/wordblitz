// ── Power Ability System ──────────────────────────────────────────────────
// Definitions, inventory management, and effect logic.
// Server validates use; client shows UI and emits use_power.

export type PowerId =
  | "freeze"
  | "reverse"
  | "shield"
  | "double_xp"
  | "letter_ban"
  | "word_steal"
  | "category_switch";

export type PowerRarity = "common" | "rare" | "epic" | "legendary";

export interface PowerDef {
  id:          PowerId;
  name:        string;
  description: string;
  icon:        string;   // emoji
  rarity:      PowerRarity;
  color:       string;   // hex
  cooldownMs:  number;   // ms before same power can be used again
  targetsSelf: boolean;  // true = affects self, false = targets opponent
}

export interface PowerInventoryItem {
  powerId:  PowerId;
  count:    number;
}

export interface ActiveEffect {
  powerId:   PowerId;
  targetId:  string;   // socket/player id
  expiresAt: number;   // Unix ms
}

// ── Definitions ────────────────────────────────────────────────────────────
export const POWERS: Record<PowerId, PowerDef> = {
  freeze: {
    id:          "freeze",
    name:        "Freeze",
    description: "Pause opponent's timer for 5 seconds",
    icon:        "❄️",
    rarity:      "rare",
    color:       "#b9f2ff",
    cooldownMs:  30_000,
    targetsSelf: false,
  },
  reverse: {
    id:          "reverse",
    name:        "Reverse",
    description: "Reverse the word chain direction for 1 turn",
    icon:        "🔄",
    rarity:      "epic",
    color:       "#ff51fa",
    cooldownMs:  45_000,
    targetsSelf: false,
  },
  shield: {
    id:          "shield",
    name:        "Shield",
    description: "Block the next elimination attempt",
    icon:        "🛡️",
    rarity:      "rare",
    color:       "#cafd00",
    cooldownMs:  60_000,
    targetsSelf: true,
  },
  double_xp: {
    id:          "double_xp",
    name:        "Double XP",
    description: "Double XP earned this round",
    icon:        "⚡",
    rarity:      "common",
    color:       "#ffd166",
    cooldownMs:  20_000,
    targetsSelf: true,
  },
  letter_ban: {
    id:          "letter_ban",
    name:        "Letter Ban",
    description: "Ban a random letter for 2 turns",
    icon:        "🚫",
    rarity:      "epic",
    color:       "#ff5c3a",
    cooldownMs:  40_000,
    targetsSelf: false,
  },
  word_steal: {
    id:          "word_steal",
    name:        "Word Steal",
    description: "Steal the last word and replay it as your own",
    icon:        "🎯",
    rarity:      "legendary",
    color:       "#ff51fa",
    cooldownMs:  90_000,
    targetsSelf: false,
  },
  category_switch: {
    id:          "category_switch",
    name:        "Category Switch",
    description: "Force a random category change",
    icon:        "🔀",
    rarity:      "epic",
    color:       "#8a8a8a",
    cooldownMs:  60_000,
    targetsSelf: false,
  },
};

// ── Starter inventory (given to every new player) ──────────────────────────
export const STARTER_INVENTORY: PowerInventoryItem[] = [
  { powerId: "double_xp", count: 3 },
  { powerId: "shield",    count: 2 },
  { powerId: "freeze",    count: 1 },
];

// ── Inventory persistence ──────────────────────────────────────────────────
const STORAGE_KEY = "wb_power_inventory";

export function loadInventory(): PowerInventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveInventory(STARTER_INVENTORY);
      return [...STARTER_INVENTORY];
    }
    return JSON.parse(raw) as PowerInventoryItem[];
  } catch {
    return [...STARTER_INVENTORY];
  }
}

export function saveInventory(inv: PowerInventoryItem[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inv)); } catch {}
}

export function usePower(powerId: PowerId): boolean {
  const inv = loadInventory();
  const item = inv.find(i => i.powerId === powerId);
  if (!item || item.count <= 0) return false;
  item.count--;
  saveInventory(inv);
  return true;
}

export function addPower(powerId: PowerId, count = 1): void {
  const inv = loadInventory();
  const item = inv.find(i => i.powerId === powerId);
  if (item) item.count += count;
  else inv.push({ powerId, count });
  saveInventory(inv);
}

export function getCount(powerId: PowerId): number {
  return loadInventory().find(i => i.powerId === powerId)?.count ?? 0;
}

// ── Cooldown tracking ──────────────────────────────────────────────────────
const cooldowns: Partial<Record<PowerId, number>> = {};

export function isOnCooldown(powerId: PowerId): boolean {
  const exp = cooldowns[powerId];
  return exp !== undefined && Date.now() < exp;
}

export function setCooldown(powerId: PowerId): void {
  cooldowns[powerId] = Date.now() + POWERS[powerId].cooldownMs;
}

export function getCooldownRemaining(powerId: PowerId): number {
  const exp = cooldowns[powerId];
  if (!exp) return 0;
  return Math.max(0, exp - Date.now());
}
