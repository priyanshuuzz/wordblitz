// ── Leaderboard service — client-side Firestore reads ─────────────────────
// Uses React Query for caching — never a live listener.
// Leaderboard is written by a scheduled Cloud Function every hour.

import {
  collection, query, orderBy, limit, where,
  getDocs, doc, getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export interface LeaderboardEntry {
  uid:      string;
  username: string;
  avatar:   string;
  mmr:      number;
  rank:     string;
  wins:     number;
  position: number;
}

export interface PlayerProfile {
  uid:         string;
  username:    string;
  avatar:      string;
  xp:          number;
  level:       number;
  mmr:         number;
  rank:        string;
  wins:        number;
  losses:      number;
  winStreak:   number;
  gamesPlayed: number;
}

// ── Leaderboard ────────────────────────────────────────────────────────────

/**
 * Fetch top N players from the pre-computed leaderboard collection.
 * Cached by React Query — staleTime: 5 minutes.
 */
export async function fetchLeaderboard(
  seasonId = "season1",
  topN = 50
): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, "leaderboard", seasonId, "entries"),
    orderBy("position", "asc"),
    limit(topN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as LeaderboardEntry);
}

// ── Player profile ─────────────────────────────────────────────────────────

export async function fetchPlayerProfile(uid: string): Promise<PlayerProfile | null> {
  const snap = await getDoc(doc(db, "players", uid));
  return snap.exists() ? (snap.data() as PlayerProfile) : null;
}

// ── Match history ──────────────────────────────────────────────────────────

export interface MatchSummary {
  matchId:    string;
  mode:       string;
  winnerId:   string;
  placement:  number;
  xpEarned:   number;
  durationMs: number;
  endedAt:    { seconds: number };
}

export async function fetchMatchHistory(
  uid: string,
  pageSize = 20
): Promise<MatchSummary[]> {
  const snap = await getDocs(
    query(
      collection(db, "matches"),
      where("playerIds", "array-contains", uid),
      orderBy("endedAt", "desc"),
      limit(pageSize)
    )
  );

  return snap.docs.map(d => {
    const data = d.data();
    const playerData = data.players?.[uid] ?? {};
    return {
      matchId:    d.id,
      mode:       data.mode,
      winnerId:   data.winnerId,
      placement:  playerData.placement ?? 2,
      xpEarned:   playerData.xpEarned  ?? 0,
      durationMs: data.durationMs      ?? 0,
      endedAt:    data.endedAt,
    };
  });
}
