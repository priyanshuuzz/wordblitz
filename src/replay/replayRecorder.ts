// ── Replay Recorder ───────────────────────────────────────────────────────
// Records a full match timeline client-side.
// Stored in localStorage, capped at 10 replays (oldest pruned).

export type ReplayEventType =
  | "match_start"
  | "word_submitted"
  | "word_rejected"
  | "turn_timeout"
  | "player_eliminated"
  | "player_disconnected"
  | "player_reconnected"
  | "game_over";

export interface ReplayEvent {
  type:      ReplayEventType;
  ts:        number;          // Unix ms — absolute timestamp
  playerId:  string;
  data:      Record<string, unknown>;
}

export interface ReplayPlayer {
  id:       string;
  uid:      string;
  username: string;
  avatar:   string;
}

export interface MatchReplay {
  id:          string;          // roomId or generated
  mode:        string;
  category:    string | null;
  startedAt:   number;
  endedAt:     number | null;
  durationMs:  number | null;
  players:     ReplayPlayer[];
  events:      ReplayEvent[];
  winnerId:    string | null;
  wordChain:   string[];        // final ordered word chain
  totalWords:  number;
}

// ── Storage ────────────────────────────────────────────────────────────────
const STORAGE_KEY  = "wb_replays";
const MAX_REPLAYS  = 10;

function loadAll(): MatchReplay[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MatchReplay[]) : [];
  } catch {
    return [];
  }
}

function saveAll(replays: MatchReplay[]): void {
  try {
    // Keep only the most recent MAX_REPLAYS
    const pruned = replays.slice(-MAX_REPLAYS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {}
}

// ── Active recording ───────────────────────────────────────────────────────
let active: MatchReplay | null = null;

export function startRecording(opts: {
  roomId:    string;
  mode:      string;
  category:  string | null;
  players:   ReplayPlayer[];
}): void {
  active = {
    id:         opts.roomId || `local_${Date.now()}`,
    mode:       opts.mode,
    category:   opts.category,
    startedAt:  Date.now(),
    endedAt:    null,
    durationMs: null,
    players:    opts.players,
    events:     [],
    winnerId:   null,
    wordChain:  [],
    totalWords: 0,
  };

  recordEvent("match_start", "", {});
}

export function recordEvent(
  type:     ReplayEventType,
  playerId: string,
  data:     Record<string, unknown>
): void {
  if (!active) return;
  active.events.push({ type, ts: Date.now(), playerId, data });

  // Keep word chain in sync
  if (type === "word_submitted" && typeof data.word === "string") {
    active.wordChain.push(data.word as string);
    active.totalWords++;
  }
}

export function stopRecording(winnerId: string | null): MatchReplay | null {
  if (!active) return null;

  active.endedAt    = Date.now();
  active.durationMs = active.endedAt - active.startedAt;
  active.winnerId   = winnerId;

  recordEvent("game_over", winnerId ?? "", { winnerId });

  const finished = { ...active };
  active = null;

  // Persist
  const all = loadAll();
  all.push(finished);
  saveAll(all);

  return finished;
}

export function isRecording(): boolean {
  return active !== null;
}

// ── Retrieval ──────────────────────────────────────────────────────────────
export function getAllReplays(): MatchReplay[] {
  return loadAll().reverse(); // newest first
}

export function getReplay(id: string): MatchReplay | null {
  return loadAll().find(r => r.id === id) ?? null;
}

export function deleteReplay(id: string): void {
  const all = loadAll().filter(r => r.id !== id);
  saveAll(all);
}

export function clearAllReplays(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ── Stats helpers ──────────────────────────────────────────────────────────
export function getReplayStats(replay: MatchReplay): {
  longestWord:   string;
  fastestWordMs: number;
  avgResponseMs: number;
  wordsByPlayer: Record<string, number>;
} {
  let longestWord   = "";
  let fastestWordMs = Infinity;
  const wordsByPlayer: Record<string, number> = {};
  const responseTimes: number[] = [];

  let lastTs = replay.startedAt;

  for (const ev of replay.events) {
    if (ev.type === "word_submitted") {
      const word = String(ev.data.word ?? "");
      if (word.length > longestWord.length) longestWord = word;

      const delta = ev.ts - lastTs;
      if (delta > 0 && delta < 60_000) {
        responseTimes.push(delta);
        if (delta < fastestWordMs) fastestWordMs = delta;
      }
      lastTs = ev.ts;

      wordsByPlayer[ev.playerId] = (wordsByPlayer[ev.playerId] ?? 0) + 1;
    }
  }

  const avgResponseMs = responseTimes.length
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  return {
    longestWord,
    fastestWordMs: fastestWordMs === Infinity ? 0 : fastestWordMs,
    avgResponseMs,
    wordsByPlayer,
  };
}
