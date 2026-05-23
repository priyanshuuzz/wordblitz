// ── Advanced Anti-Cheat Engine ────────────────────────────────────────────
// Extends the base antiCheat.ts with deeper analysis.
// Server-side only — never import in client code.

export type AdvancedSuspicionType =
  | "typing_entropy"
  | "impossible_reaction"
  | "dictionary_abuse"
  | "ai_bot_pattern"
  | "suspicion_score_high";

export interface AdvancedFlag {
  uid:       string;
  matchId:   string;
  type:      AdvancedSuspicionType;
  severity:  "low" | "medium" | "high" | "critical";
  score:     number;   // 0–100 suspicion score
  data:      Record<string, unknown>;
  timestamp: number;
}

// ── Per-player session data ────────────────────────────────────────────────
interface PlayerSession {
  uid:              string;
  matchId:          string;
  submissionTimes:  number[];   // ms timestamps
  responseTimes:    number[];   // ms from turn start to submission
  wordLengths:      number[];
  suspicionScore:   number;     // 0–100 cumulative
  wordsSeen:        Set<string>;
}

const sessions = new Map<string, PlayerSession>();
const advancedFlags: AdvancedFlag[] = [];

// ── Constants ──────────────────────────────────────────────────────────────
const IMPOSSIBLE_REACTION_MS   = 200;   // < 200ms = impossible human reaction
const BOT_PATTERN_STDDEV_MAX   = 80;    // bots have very consistent timing
const DICT_ABUSE_RARE_RATIO    = 0.6;   // > 60% rare/obscure words = suspicious
const HIGH_SCORE_THRESHOLD     = 70;

const RARE_LETTERS = new Set(["Q","X","Z","J","V","K"]);

// ── Session management ─────────────────────────────────────────────────────
export function initSession(uid: string, matchId: string): void {
  sessions.set(uid, {
    uid, matchId,
    submissionTimes: [],
    responseTimes:   [],
    wordLengths:     [],
    suspicionScore:  0,
    wordsSeen:       new Set(),
  });
}

export function clearSession(uid: string): void {
  sessions.delete(uid);
}

// ── Main analysis ──────────────────────────────────────────────────────────
export function analyzeSubmission(
  uid:          string,
  matchId:      string,
  word:         string,
  turnStartMs:  number
): AdvancedFlag[] {
  const now = Date.now();
  const responseMs = now - turnStartMs;

  let session = sessions.get(uid);
  if (!session) {
    initSession(uid, matchId);
    session = sessions.get(uid)!;
  }

  session.submissionTimes.push(now);
  session.responseTimes.push(responseMs);
  session.wordLengths.push(word.length);
  session.wordsSeen.add(word.toLowerCase());

  const newFlags: AdvancedFlag[] = [];

  // 1. Impossible reaction time
  if (responseMs < IMPOSSIBLE_REACTION_MS) {
    const flag = addFlag(session, {
      type: "impossible_reaction",
      severity: "critical",
      score: 40,
      data: { responseMs, word, threshold: IMPOSSIBLE_REACTION_MS },
    });
    newFlags.push(flag);
  }

  // 2. Typing entropy — bots have unnaturally consistent timing
  if (session.responseTimes.length >= 6) {
    const stddev = computeStdDev(session.responseTimes.slice(-10));
    if (stddev < BOT_PATTERN_STDDEV_MAX) {
      const flag = addFlag(session, {
        type: "ai_bot_pattern",
        severity: stddev < 40 ? "high" : "medium",
        score: stddev < 40 ? 25 : 12,
        data: { stddev, sampleSize: session.responseTimes.length },
      });
      newFlags.push(flag);
    }
  }

  // 3. Dictionary abuse — too many rare/obscure words
  if (session.wordsSeen.size >= 10) {
    const rareCount = [...session.wordsSeen].filter(w =>
      [...w.toUpperCase()].some(c => RARE_LETTERS.has(c))
    ).length;
    const rareRatio = rareCount / session.wordsSeen.size;
    if (rareRatio > DICT_ABUSE_RARE_RATIO) {
      const flag = addFlag(session, {
        type: "dictionary_abuse",
        severity: "medium",
        score: 15,
        data: { rareRatio: Math.round(rareRatio * 100), totalWords: session.wordsSeen.size },
      });
      newFlags.push(flag);
    }
  }

  // 4. High cumulative score alert
  if (session.suspicionScore >= HIGH_SCORE_THRESHOLD && session.suspicionScore - (newFlags[0]?.score ?? 0) < HIGH_SCORE_THRESHOLD) {
    const flag = addFlag(session, {
      type: "suspicion_score_high",
      severity: "high",
      score: 0,
      data: { totalScore: session.suspicionScore },
    });
    newFlags.push(flag);
  }

  advancedFlags.push(...newFlags);
  return newFlags;
}

// ── Drain flags (called by server to persist to Firestore) ─────────────────
export function drainAdvancedFlags(): AdvancedFlag[] {
  return advancedFlags.splice(0, advancedFlags.length);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function addFlag(
  session: PlayerSession,
  opts: Omit<AdvancedFlag, "uid" | "matchId" | "timestamp">
): AdvancedFlag {
  session.suspicionScore = Math.min(100, session.suspicionScore + opts.score);
  const flag: AdvancedFlag = {
    uid:       session.uid,
    matchId:   session.matchId,
    timestamp: Date.now(),
    ...opts,
  };
  console.warn(`[AdvancedAntiCheat] ${flag.severity.toUpperCase()} — ${flag.type} uid=${flag.uid} score=${session.suspicionScore}`, flag.data);
  return flag;
}

function computeStdDev(values: number[]): number {
  if (values.length < 2) return Infinity;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Get current suspicion score for a player (0–100) */
export function getSuspicionScore(uid: string): number {
  return sessions.get(uid)?.suspicionScore ?? 0;
}
