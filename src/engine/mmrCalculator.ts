// ── ELO-based MMR calculator ───────────────────────────────────────────────

export const DEFAULT_MMR = 1000;

export const RANK_THRESHOLDS = [
  { rank: "grandmaster", min: 2000 },
  { rank: "master",      min: 1800 },
  { rank: "diamond",     min: 1600 },
  { rank: "platinum",    min: 1400 },
  { rank: "gold",        min: 1200 },
  { rank: "silver",      min: 1000 },
  { rank: "bronze",      min: 0    },
] as const;

export type Rank = typeof RANK_THRESHOLDS[number]["rank"];

/** K-factor decreases as player plays more games (more stable MMR over time) */
function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < 10)  return 40;
  if (gamesPlayed < 30)  return 32;
  if (gamesPlayed < 100) return 24;
  return 16;
}

/** Expected score for player A against player B */
function expectedScore(mmrA: number, mmrB: number): number {
  return 1 / (1 + Math.pow(10, (mmrB - mmrA) / 400));
}

export interface MMRResult {
  winnerId: string;
  loserId: string;
  winnerDelta: number;
  loserDelta: number;
  winnerNewMmr: number;
  loserNewMmr: number;
}

export function calculateMMR(
  winnerId: string,
  winnerMmr: number,
  winnerGames: number,
  loserId: string,
  loserMmr: number,
  loserGames: number
): MMRResult {
  const K = Math.min(getKFactor(winnerGames), getKFactor(loserGames));
  const expected = expectedScore(winnerMmr, loserMmr);

  // Winner scored 1, loser scored 0
  const winnerDelta = Math.round(K * (1 - expected));
  const loserDelta  = Math.round(K * (0 - (1 - expected)));

  return {
    winnerId,
    loserId,
    winnerDelta,
    loserDelta: loserDelta,  // negative number
    winnerNewMmr: Math.max(0, winnerMmr + winnerDelta),
    loserNewMmr:  Math.max(0, loserMmr  + loserDelta),
  };
}

export function getRank(mmr: number): Rank {
  for (const { rank, min } of RANK_THRESHOLDS) {
    if (mmr >= min) return rank;
  }
  return "bronze";
}

export function calculateXP(won: boolean, winStreak: number, avgWordLength: number): number {
  let xp = won ? 100 : 25;

  // Streak bonus
  if (won && winStreak >= 10) xp += 50;
  else if (won && winStreak >= 5) xp += 30;
  else if (won && winStreak >= 3) xp += 15;

  // Speed/skill bonus (longer words = more XP)
  if (avgWordLength >= 8) xp += 20;
  else if (avgWordLength >= 6) xp += 10;

  return xp;
}
