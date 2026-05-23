// ── Achievement System ────────────────────────────────────────────────────
// Definitions, unlock logic, and localStorage persistence.
// No external dependencies — works offline.

export type AchievementId =
  | "first_win"
  | "wins_10"
  | "wins_50"
  | "wins_100"
  | "streak_3"
  | "streak_5"
  | "streak_10"
  | "words_50"
  | "words_200"
  | "words_1000"
  | "long_word_8"
  | "long_word_12"
  | "rare_letter"
  | "speed_demon"
  | "survivor"
  | "category_win"
  | "daily_complete"
  | "daily_streak_7"
  | "combo_x3"
  | "combo_x5"
  | "tournament_enter"
  | "tournament_win";

export interface AchievementDef {
  id:          AchievementId;
  title:       string;
  description: string;
  xp:          number;
  icon:        string;   // emoji
  rarity:      "common" | "rare" | "epic" | "legendary";
}

export interface UnlockedAchievement {
  id:         AchievementId;
  unlockedAt: number;  // Unix ms
}

// ── Definitions ────────────────────────────────────────────────────────────
export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  first_win:        { id: "first_win",        title: "First Blood",        description: "Win your first match",                  xp: 100,  icon: "🏆", rarity: "common"    },
  wins_10:          { id: "wins_10",           title: "On a Roll",          description: "Win 10 matches",                        xp: 200,  icon: "🎯", rarity: "common"    },
  wins_50:          { id: "wins_50",           title: "Veteran",            description: "Win 50 matches",                        xp: 500,  icon: "⚔️", rarity: "rare"      },
  wins_100:         { id: "wins_100",          title: "Century",            description: "Win 100 matches",                       xp: 1000, icon: "💯", rarity: "epic"      },
  streak_3:         { id: "streak_3",          title: "Hot Streak",         description: "Win 3 matches in a row",                xp: 150,  icon: "🔥", rarity: "common"    },
  streak_5:         { id: "streak_5",          title: "Unstoppable",        description: "Win 5 matches in a row",                xp: 300,  icon: "⚡", rarity: "rare"      },
  streak_10:        { id: "streak_10",         title: "Legendary Streak",   description: "Win 10 matches in a row",               xp: 750,  icon: "👑", rarity: "legendary" },
  words_50:         { id: "words_50",          title: "Wordsmith",          description: "Submit 50 valid words total",           xp: 100,  icon: "📝", rarity: "common"    },
  words_200:        { id: "words_200",         title: "Lexicon",            description: "Submit 200 valid words total",          xp: 250,  icon: "📚", rarity: "rare"      },
  words_1000:       { id: "words_1000",        title: "Dictionary",         description: "Submit 1000 valid words total",         xp: 1000, icon: "🗂️", rarity: "legendary" },
  long_word_8:      { id: "long_word_8",       title: "Big Brain",          description: "Submit a word with 8+ letters",         xp: 75,   icon: "🧠", rarity: "common"    },
  long_word_12:     { id: "long_word_12",      title: "Scrabble Master",    description: "Submit a word with 12+ letters",        xp: 300,  icon: "🎓", rarity: "epic"      },
  rare_letter:      { id: "rare_letter",       title: "Rare Find",          description: "Submit a word containing Q, X, Z or J", xp: 100,  icon: "💎", rarity: "rare"      },
  speed_demon:      { id: "speed_demon",       title: "Speed Demon",        description: "Submit a word in under 2 seconds",      xp: 150,  icon: "⚡", rarity: "rare"      },
  survivor:         { id: "survivor",          title: "Last Standing",      description: "Win a 4-player match",                  xp: 200,  icon: "🛡️", rarity: "rare"      },
  category_win:     { id: "category_win",      title: "Category King",      description: "Win a category mode match",             xp: 150,  icon: "🏷️", rarity: "common"    },
  daily_complete:   { id: "daily_complete",    title: "Daily Grinder",      description: "Complete a daily challenge",            xp: 100,  icon: "📅", rarity: "common"    },
  daily_streak_7:   { id: "daily_streak_7",    title: "Week Warrior",       description: "Complete 7 daily challenges in a row",  xp: 500,  icon: "🗓️", rarity: "epic"      },
  combo_x3:         { id: "combo_x3",          title: "Combo Starter",      description: "Reach a x3 combo multiplier",           xp: 100,  icon: "🔗", rarity: "common"    },
  combo_x5:         { id: "combo_x5",          title: "Combo King",         description: "Reach a x5 combo streak",               xp: 300,  icon: "💥", rarity: "rare"      },
  tournament_enter: { id: "tournament_enter",  title: "Competitor",         description: "Enter your first tournament",           xp: 100,  icon: "🏟️", rarity: "common"    },
  tournament_win:   { id: "tournament_win",    title: "Champion",           description: "Win a tournament",                      xp: 2000, icon: "🥇", rarity: "legendary" },
};

// ── Persistence ────────────────────────────────────────────────────────────
const STORAGE_KEY = "wb_achievements";

export function loadUnlocked(): UnlockedAchievement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UnlockedAchievement[]) : [];
  } catch {
    return [];
  }
}

export function saveUnlocked(list: UnlockedAchievement[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function isUnlocked(id: AchievementId): boolean {
  return loadUnlocked().some(a => a.id === id);
}

/** Unlock an achievement. Returns the def if newly unlocked, null if already had it. */
export function unlock(id: AchievementId): AchievementDef | null {
  if (isUnlocked(id)) return null;
  const list = loadUnlocked();
  list.push({ id, unlockedAt: Date.now() });
  saveUnlocked(list);
  return ACHIEVEMENTS[id];
}

// ── Stats persistence ──────────────────────────────────────────────────────
const STATS_KEY = "wb_stats";

export interface PlayerStats {
  totalWins:       number;
  totalWords:      number;
  winStreak:       number;
  bestWinStreak:   number;
  dailyStreak:     number;
  lastDailyDate:   string;   // ISO date string YYYY-MM-DD
  gamesPlayed:     number;
}

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? (JSON.parse(raw) as PlayerStats) : defaultStats();
  } catch {
    return defaultStats();
  }
}

function defaultStats(): PlayerStats {
  return {
    totalWins:     0,
    totalWords:    0,
    winStreak:     0,
    bestWinStreak: 0,
    dailyStreak:   0,
    lastDailyDate: "",
    gamesPlayed:   0,
  };
}

export function saveStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

// ── Check achievements after a match ──────────────────────────────────────
/**
 * Call after every match. Returns array of newly unlocked achievement defs.
 */
export function checkMatchAchievements(opts: {
  won:           boolean;
  wordCount:     number;
  longestWord:   string;
  fastestWordMs: number;
  playerCount:   number;
  isCategory:    boolean;
  comboMax:      number;
}): AchievementDef[] {
  const stats = loadStats();
  const newly: AchievementDef[] = [];

  // Update stats
  stats.gamesPlayed++;
  stats.totalWords += opts.wordCount;

  if (opts.won) {
    stats.totalWins++;
    stats.winStreak++;
    stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.winStreak);
  } else {
    stats.winStreak = 0;
  }

  saveStats(stats);

  // Helper
  const tryUnlock = (id: AchievementId) => {
    const def = unlock(id);
    if (def) newly.push(def);
  };

  // Win-based
  if (opts.won) {
    if (stats.totalWins === 1)   tryUnlock("first_win");
    if (stats.totalWins >= 10)   tryUnlock("wins_10");
    if (stats.totalWins >= 50)   tryUnlock("wins_50");
    if (stats.totalWins >= 100)  tryUnlock("wins_100");
    if (stats.winStreak >= 3)    tryUnlock("streak_3");
    if (stats.winStreak >= 5)    tryUnlock("streak_5");
    if (stats.winStreak >= 10)   tryUnlock("streak_10");
    if (opts.playerCount >= 4)   tryUnlock("survivor");
    if (opts.isCategory)         tryUnlock("category_win");
  }

  // Word count
  if (stats.totalWords >= 50)   tryUnlock("words_50");
  if (stats.totalWords >= 200)  tryUnlock("words_200");
  if (stats.totalWords >= 1000) tryUnlock("words_1000");

  // Word quality
  if (opts.longestWord.length >= 8)  tryUnlock("long_word_8");
  if (opts.longestWord.length >= 12) tryUnlock("long_word_12");

  const RARE = new Set(["Q","X","Z","J"]);
  if ([...opts.longestWord.toUpperCase()].some(c => RARE.has(c))) tryUnlock("rare_letter");

  // Speed
  if (opts.fastestWordMs > 0 && opts.fastestWordMs < 2000) tryUnlock("speed_demon");

  // Combo
  if (opts.comboMax >= 3) tryUnlock("combo_x3");
  if (opts.comboMax >= 5) tryUnlock("combo_x5");

  return newly;
}

/** Call when a daily challenge is completed. */
export function checkDailyAchievements(): AchievementDef[] {
  const stats = loadStats();
  const today = new Date().toISOString().slice(0, 10);
  const newly: AchievementDef[] = [];

  const tryUnlock = (id: AchievementId) => {
    const def = unlock(id);
    if (def) newly.push(def);
  };

  // Update daily streak
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (stats.lastDailyDate === yesterday) {
    stats.dailyStreak++;
  } else if (stats.lastDailyDate !== today) {
    stats.dailyStreak = 1;
  }
  stats.lastDailyDate = today;
  saveStats(stats);

  tryUnlock("daily_complete");
  if (stats.dailyStreak >= 7) tryUnlock("daily_streak_7");

  return newly;
}
