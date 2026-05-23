// ── Anti-cheat engine ─────────────────────────────────────────────────────
// Runs server-side on every word submission.
// Never bans immediately — flags for review.

export type SuspicionLevel = "ok" | "suspicious" | "impossible";

export interface SuspicionEvent {
  uid: string;
  type: "speed_hack" | "win_rate_anomaly" | "impossible_word" | "rapid_fire";
  severity: SuspicionLevel;
  data: Record<string, unknown>;
  matchId: string;
  timestamp: number;
}

// In-memory suspicion log (flushed to Firestore async)
const pendingFlags: SuspicionEvent[] = [];

const MIN_HUMAN_SUBMISSION_MS = 350; // impossible to type + submit faster
const RAPID_FIRE_WINDOW_MS    = 3000;
const RAPID_FIRE_MAX_WORDS    = 5;

// Track recent submission times per player
const submissionHistory = new Map<string, number[]>();

export function checkSubmission(
  uid: string,
  matchId: string,
  word: string,
  turnStartMs: number
): SuspicionLevel {
  const elapsed = Date.now() - turnStartMs;

  // Impossible speed
  if (elapsed < MIN_HUMAN_SUBMISSION_MS) {
    flag({
      uid, matchId, type: "speed_hack", severity: "impossible",
      data: { elapsed, word, minAllowed: MIN_HUMAN_SUBMISSION_MS },
      timestamp: Date.now(),
    });
    return "impossible";
  }

  // Rapid fire detection — too many words in short window
  const history = submissionHistory.get(uid) ?? [];
  const now = Date.now();
  const recent = history.filter(t => now - t < RAPID_FIRE_WINDOW_MS);
  recent.push(now);
  submissionHistory.set(uid, recent);

  if (recent.length > RAPID_FIRE_MAX_WORDS) {
    flag({
      uid, matchId, type: "rapid_fire", severity: "suspicious",
      data: { wordsInWindow: recent.length, windowMs: RAPID_FIRE_WINDOW_MS },
      timestamp: now,
    });
    return "suspicious";
  }

  // Suspicious speed for long words (hard to type fast)
  if (elapsed < 600 && word.length > 8) {
    flag({
      uid, matchId, type: "speed_hack", severity: "suspicious",
      data: { elapsed, word, wordLength: word.length },
      timestamp: now,
    });
    return "suspicious";
  }

  return "ok";
}

function flag(event: SuspicionEvent): void {
  pendingFlags.push(event);
  console.warn(`[AntiCheat] ${event.severity.toUpperCase()} — ${event.type} uid=${event.uid} match=${event.matchId}`, event.data);
}

/** Returns and clears pending flags (called by Firebase writer) */
export function drainFlags(): SuspicionEvent[] {
  return pendingFlags.splice(0, pendingFlags.length);
}

/** Clean up history for disconnected players */
export function clearPlayer(uid: string): void {
  submissionHistory.delete(uid);
}
