// ── Daily & Weekly Missions ───────────────────────────────────────────────
// Definitions, progress tracking, and localStorage persistence.

export type MissionId =
  | "daily_win_1"
  | "daily_win_3"
  | "daily_words_20"
  | "daily_long_word"
  | "daily_rare_letter"
  | "daily_speed_3"
  | "daily_category_win"
  | "weekly_wins_10"
  | "weekly_words_100"
  | "weekly_streak_5"
  | "weekly_play_friends"
  | "weekly_tournament";

export type MissionFrequency = "daily" | "weekly";

export interface MissionDef {
  id:          MissionId;
  title:       string;
  description: string;
  frequency:   MissionFrequency;
  target:      number;
  rewardXp:    number;
  rewardCoins: number;
  icon:        string;
}

export interface MissionProgress {
  id:          MissionId;
  progress:    number;
  completed:   boolean;
  claimedAt:   number | null;
  resetDate:   string;   // ISO date YYYY-MM-DD (daily) or YYYY-WW (weekly)
}

// ── Definitions ────────────────────────────────────────────────────────────
export const MISSIONS: Record<MissionId, MissionDef> = {
  daily_win_1:        { id: "daily_win_1",        title: "First Win",         description: "Win 1 match today",                  frequency: "daily",  target: 1,   rewardXp: 50,  rewardCoins: 20,  icon: "🏆" },
  daily_win_3:        { id: "daily_win_3",         title: "Hat Trick",         description: "Win 3 matches today",                frequency: "daily",  target: 3,   rewardXp: 150, rewardCoins: 60,  icon: "🎯" },
  daily_words_20:     { id: "daily_words_20",      title: "Word Machine",      description: "Submit 20 valid words today",         frequency: "daily",  target: 20,  rewardXp: 80,  rewardCoins: 30,  icon: "📝" },
  daily_long_word:    { id: "daily_long_word",     title: "Big Vocabulary",    description: "Submit a word with 8+ letters",       frequency: "daily",  target: 1,   rewardXp: 60,  rewardCoins: 25,  icon: "📏" },
  daily_rare_letter:  { id: "daily_rare_letter",   title: "Rare Find",         description: "Use a word with Q, X, Z or J",        frequency: "daily",  target: 1,   rewardXp: 75,  rewardCoins: 30,  icon: "💎" },
  daily_speed_3:      { id: "daily_speed_3",       title: "Speed Demon",       description: "Submit 3 words in under 3 seconds",   frequency: "daily",  target: 3,   rewardXp: 100, rewardCoins: 40,  icon: "⚡" },
  daily_category_win: { id: "daily_category_win",  title: "Category King",     description: "Win a category mode match",           frequency: "daily",  target: 1,   rewardXp: 120, rewardCoins: 50,  icon: "🏷️" },
  weekly_wins_10:     { id: "weekly_wins_10",      title: "Grinder",           description: "Win 10 matches this week",            frequency: "weekly", target: 10,  rewardXp: 500, rewardCoins: 200, icon: "💪" },
  weekly_words_100:   { id: "weekly_words_100",    title: "Lexicon",           description: "Submit 100 valid words this week",    frequency: "weekly", target: 100, rewardXp: 300, rewardCoins: 120, icon: "📚" },
  weekly_streak_5:    { id: "weekly_streak_5",     title: "On Fire",           description: "Reach a 5-win streak this week",      frequency: "weekly", target: 5,   rewardXp: 400, rewardCoins: 150, icon: "🔥" },
  weekly_play_friends:{ id: "weekly_play_friends", title: "Social Butterfly",  description: "Play 3 matches with friends",         frequency: "weekly", target: 3,   rewardXp: 250, rewardCoins: 100, icon: "👥" },
  weekly_tournament:  { id: "weekly_tournament",   title: "Competitor",        description: "Enter a tournament this week",        frequency: "weekly", target: 1,   rewardXp: 350, rewardCoins: 140, icon: "🏟️" },
};

// ── Date helpers ───────────────────────────────────────────────────────────
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekKey(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function resetKeyFor(freq: MissionFrequency): string {
  return freq === "daily" ? todayKey() : weekKey();
}

// ── Persistence ────────────────────────────────────────────────────────────
const STORAGE_KEY = "wb_missions";

function loadAll(): MissionProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MissionProgress[]) : [];
  } catch {
    return [];
  }
}

function saveAll(list: MissionProgress[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

/** Get progress for a mission, auto-resetting if the period has rolled over */
export function getMissionProgress(id: MissionId): MissionProgress {
  const def = MISSIONS[id];
  const resetKey = resetKeyFor(def.frequency);
  const all = loadAll();
  const existing = all.find(m => m.id === id);

  if (!existing || existing.resetDate !== resetKey) {
    // New period — reset
    const fresh: MissionProgress = {
      id, progress: 0, completed: false, claimedAt: null, resetDate: resetKey,
    };
    const updated = all.filter(m => m.id !== id);
    updated.push(fresh);
    saveAll(updated);
    return fresh;
  }
  return existing;
}

export function getAllMissions(): { def: MissionDef; progress: MissionProgress }[] {
  return (Object.values(MISSIONS) as MissionDef[]).map(def => ({
    def,
    progress: getMissionProgress(def.id),
  }));
}

export function getDailyMissions() {
  return getAllMissions().filter(m => m.def.frequency === "daily");
}

export function getWeeklyMissions() {
  return getAllMissions().filter(m => m.def.frequency === "weekly");
}

/** Increment progress for a mission. Returns true if newly completed. */
export function incrementMission(id: MissionId, amount = 1): boolean {
  const def = MISSIONS[id];
  const prog = getMissionProgress(id);
  if (prog.completed) return false;

  prog.progress = Math.min(def.target, prog.progress + amount);
  const justCompleted = prog.progress >= def.target;
  if (justCompleted) prog.completed = true;

  const all = loadAll();
  const idx = all.findIndex(m => m.id === id && m.resetDate === prog.resetDate);
  if (idx >= 0) all[idx] = prog; else all.push(prog);
  saveAll(all);

  return justCompleted;
}

/** Claim reward for a completed mission. Returns reward or null if already claimed. */
export function claimMission(id: MissionId): { xp: number; coins: number } | null {
  const prog = getMissionProgress(id);
  if (!prog.completed || prog.claimedAt !== null) return null;

  prog.claimedAt = Date.now();
  const all = loadAll();
  const idx = all.findIndex(m => m.id === id && m.resetDate === prog.resetDate);
  if (idx >= 0) all[idx] = prog; else all.push(prog);
  saveAll(all);

  const def = MISSIONS[id];
  return { xp: def.rewardXp, coins: def.rewardCoins };
}

/** Call after every match to auto-update relevant missions */
export function updateMissionsAfterMatch(opts: {
  won:          boolean;
  wordCount:    number;
  longestWord:  string;
  speedWords:   number;   // words submitted in < 3s
  isCategory:   boolean;
  withFriend:   boolean;
  winStreak:    number;
}): MissionId[] {
  const completed: MissionId[] = [];

  const tryInc = (id: MissionId, amount = 1) => {
    if (incrementMission(id, amount)) completed.push(id);
  };

  if (opts.won) {
    tryInc("daily_win_1");
    tryInc("daily_win_3");
    tryInc("weekly_wins_10");
    if (opts.isCategory) tryInc("daily_category_win");
    if (opts.winStreak >= 5) tryInc("weekly_streak_5");
  }

  tryInc("daily_words_20", opts.wordCount);
  tryInc("weekly_words_100", opts.wordCount);

  if (opts.longestWord.length >= 8) tryInc("daily_long_word");

  const RARE = new Set(["Q","X","Z","J"]);
  if ([...opts.longestWord.toUpperCase()].some(c => RARE.has(c))) tryInc("daily_rare_letter");

  if (opts.speedWords >= 3) tryInc("daily_speed_3");
  if (opts.withFriend) tryInc("weekly_play_friends");

  return completed;
}
