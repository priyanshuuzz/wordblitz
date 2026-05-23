// ── Matchmaking Queue ──────────────────────────────────────────────────────
// In-memory queue. Runs a tick every 500ms.
// No Redis needed at Phase 1 (<10k users).

import type { Server } from "socket.io";
import type { QueueEntry, GameMode } from "../types/game.js";
import { createRoom } from "../rooms/roomManager.js";
import type { RoomState } from "../types/game.js";

const INITIAL_MMR_RANGE  = 150;
const EXPAND_INTERVAL_MS = 5_000;   // widen range every 5s
const EXPAND_AMOUNT      = 75;      // ±75 MMR per expansion
const MAX_WAIT_MS        = 30_000;  // 30s → bot fill
const DEFAULT_TURN_MS    = 10_000;  // 10s per turn

// Queue keyed by `${region}:${mode}`
const queues = new Map<string, QueueEntry[]>();

function queueKey(region: string, mode: GameMode): string {
  return `${region}:${mode}`;
}

// ── Public API ─────────────────────────────────────────────────────────────

export function enqueue(entry: QueueEntry): void {
  const key = queueKey(entry.region, entry.mode);
  if (!queues.has(key)) queues.set(key, []);

  // Prevent duplicate entries
  const q = queues.get(key)!;
  if (q.some(e => e.uid === entry.uid)) return;

  q.push(entry);
  console.log(`[Queue] ${entry.username} joined ${key} MMR=${entry.mmr} queue=${q.length}`);
}

export function dequeue(uid: string): void {
  for (const [, q] of queues) {
    const i = q.findIndex(e => e.uid === uid);
    if (i !== -1) { q.splice(i, 1); return; }
  }
}

export function isQueued(uid: string): boolean {
  for (const [, q] of queues) {
    if (q.some(e => e.uid === uid)) return true;
  }
  return false;
}

export function getQueueLength(): number {
  let total = 0;
  for (const [, q] of queues) total += q.length;
  return total;
}

// ── Tick — called every 500ms ──────────────────────────────────────────────

export function tick(
  io: Server,
  onFinish: (room: RoomState) => void
): void {
  const now = Date.now();

  for (const [key, queue] of queues) {
    if (queue.length < 2) continue;

    // Update MMR ranges for waiting players
    for (const entry of queue) {
      const waited     = now - entry.joinedAt;
      const expansions = Math.floor(waited / EXPAND_INTERVAL_MS);
      entry.currentRange = INITIAL_MMR_RANGE + expansions * EXPAND_AMOUNT;
    }

    // Find matches — O(n²), fine at <10k users
    const matched = new Set<string>();

    for (let i = 0; i < queue.length; i++) {
      if (matched.has(queue[i].uid)) continue;

      for (let j = i + 1; j < queue.length; j++) {
        if (matched.has(queue[j].uid)) continue;

        const range = Math.min(queue[i].currentRange, queue[j].currentRange);
        const mmrDiff = Math.abs(queue[i].mmr - queue[j].mmr);

        if (mmrDiff <= range) {
          matched.add(queue[i].uid);
          matched.add(queue[j].uid);

          const entries = [queue[i], queue[j]];
          const mode = queue[i].mode;

          console.log(`[Queue] Match found: ${entries[0].username} vs ${entries[1].username} MMR diff=${mmrDiff}`);
          try {
            createRoom(entries, mode, DEFAULT_TURN_MS, io, onFinish);
          } catch (err) {
            console.error("[Queue] createRoom failed:", err);
          }
          break;
        }
      }
    }

    // Remove matched players
    queues.set(key, queue.filter(e => !matched.has(e.uid)));

    // Bot fill for players waiting too long
    const remaining = queues.get(key)!;
    const timedOut = remaining.filter(e => now - e.joinedAt > MAX_WAIT_MS);

    for (const entry of timedOut) {
      console.log(`[Queue] Bot fill for ${entry.username} after ${MAX_WAIT_MS}ms wait`);
      dequeue(entry.uid);

      // Bot entry — socketId is fake, roomManager handles this gracefully
      // (bot players are driven by the GameBoard's local AI, not a real socket)
      const botEntry: QueueEntry = {
        socketId:     `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        uid:          `bot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        username:     pickBotName(),
        avatar:       `https://api.dicebear.com/7.x/avataaars/svg?seed=bot${Date.now()}`,
        mmr:          Math.max(800, entry.mmr + Math.floor(Math.random() * 100) - 50),
        region:       entry.region,
        mode:         entry.mode,
        joinedAt:     now,
        currentRange: INITIAL_MMR_RANGE,
      };

      try {
        createRoom([entry, botEntry], entry.mode, DEFAULT_TURN_MS, io, onFinish);
      } catch (err) {
        console.error("[Queue] createRoom (bot fill) failed:", err);
      }
    }
  }
}

const BOT_NAMES = ["Viper_99","SwiftKey","LexKing","ByteMe","FastFingers","WordWolf","NeonBlade","CryptoKing"];
let botNameIdx = 0;
function pickBotName(): string {
  return BOT_NAMES[botNameIdx++ % BOT_NAMES.length];
}
