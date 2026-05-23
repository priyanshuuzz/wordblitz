// ── Daily reward service — client-side callable ───────────────────────────
// Calls a Firebase Cloud Function to claim the daily reward.
// The function validates server-side — client can't fake it.

import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

interface ClaimRewardResult {
  xpEarned: number;
  streak:   number;
  reward?:  string;  // cosmetic shard ID if applicable
}

interface ClaimRewardError {
  code:    string;
  message: string;
}

let _functions: ReturnType<typeof getFunctions> | null = null;

function getFns() {
  if (!_functions) _functions = getFunctions(getApp());
  return _functions;
}

/**
 * Claim the daily login reward.
 * Returns xpEarned and current streak on success.
 * Throws if already claimed today or not authenticated.
 */
export async function claimDailyReward(): Promise<ClaimRewardResult> {
  const fn = httpsCallable<void, ClaimRewardResult>(getFns(), "claimDailyReward");
  const result = await fn();
  return result.data;
}

// ── Local streak display helper ────────────────────────────────────────────

export interface StreakReward {
  day:     number;
  xp:      number;
  special: string | null;  // null = no special reward
}

export const STREAK_REWARDS: StreakReward[] = [
  { day: 1,  xp: 50,   special: null },
  { day: 2,  xp: 50,   special: null },
  { day: 3,  xp: 150,  special: "cosmetic_shard_common" },
  { day: 4,  xp: 50,   special: null },
  { day: 5,  xp: 50,   special: null },
  { day: 6,  xp: 50,   special: null },
  { day: 7,  xp: 500,  special: "cosmetic_rare" },
  { day: 14, xp: 1000, special: "cosmetic_epic" },
  { day: 30, xp: 2500, special: "title_veteran" },
];

export function getStreakReward(streak: number): StreakReward {
  // Find the highest matching milestone
  const milestones = STREAK_REWARDS.filter(r => r.day <= streak);
  if (!milestones.length) return STREAK_REWARDS[0];
  return milestones[milestones.length - 1];
}

export function getNextMilestone(streak: number): StreakReward | null {
  return STREAK_REWARDS.find(r => r.day > streak) ?? null;
}
