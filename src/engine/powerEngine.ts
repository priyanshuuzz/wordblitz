// ── Power Engine (Server-side) ────────────────────────────────────────────
// Validates and applies power ability effects during a match.
// Import only in server.ts / roomManager.ts — never in client code.

import type { RoomState } from "../types/game.js";
import type { Server }    from "socket.io";

export type PowerId =
  | "freeze"
  | "reverse"
  | "shield"
  | "double_xp"
  | "letter_ban"
  | "word_steal"
  | "category_switch";

export interface UsePowerPayload {
  roomId:   string;
  powerId:  PowerId;
  targetId: string | null;   // socket.id of target (null for self-targeting)
}

export interface ActivePowerEffect {
  powerId:   PowerId;
  sourceId:  string;   // socket.id who used it
  targetId:  string;   // socket.id affected
  expiresAt: number;   // Unix ms
}

// Per-room active effects
const roomEffects = new Map<string, ActivePowerEffect[]>();

// Per-player cooldowns: Map<socketId, Map<powerId, expiresAt>>
const cooldowns = new Map<string, Map<PowerId, number>>();

const POWER_DURATIONS: Record<PowerId, number> = {
  freeze:          5_000,
  reverse:         15_000,
  shield:          60_000,
  double_xp:       30_000,
  letter_ban:      20_000,
  word_steal:      0,       // instant
  category_switch: 0,       // instant
};

const POWER_COOLDOWNS: Record<PowerId, number> = {
  freeze:          30_000,
  reverse:         45_000,
  shield:          60_000,
  double_xp:       20_000,
  letter_ban:      40_000,
  word_steal:      90_000,
  category_switch: 60_000,
};

// ── Public API ─────────────────────────────────────────────────────────────

export function handleUsePower(
  socketId: string,
  payload:  UsePowerPayload,
  room:     RoomState,
  io:       Server
): { success: boolean; reason?: string } {
  // Must be active player
  const player = room.players.get(socketId);
  if (!player || player.status !== "active") {
    return { success: false, reason: "Not an active player" };
  }

  // Cooldown check
  const playerCooldowns = cooldowns.get(socketId) ?? new Map<PowerId, number>();
  const cdExpiry = playerCooldowns.get(payload.powerId) ?? 0;
  if (Date.now() < cdExpiry) {
    return { success: false, reason: "Power on cooldown" };
  }

  // Resolve target
  const targetId = resolveTarget(payload.powerId, socketId, payload.targetId, room);
  if (!targetId) {
    return { success: false, reason: "Invalid target" };
  }

  // Apply effect
  applyEffect(payload.powerId, socketId, targetId, room, io);

  // Set cooldown
  playerCooldowns.set(payload.powerId, Date.now() + POWER_COOLDOWNS[payload.powerId]);
  cooldowns.set(socketId, playerCooldowns);

  // Broadcast
  io.to(room.id).emit("power_used", {
    powerId:  payload.powerId,
    sourceId: socketId,
    targetId,
    sourceUsername: player.username,
  });

  return { success: true };
}

export function getActiveEffects(roomId: string): ActivePowerEffect[] {
  const now = Date.now();
  const effects = (roomEffects.get(roomId) ?? []).filter(e => e.expiresAt > now);
  roomEffects.set(roomId, effects);
  return effects;
}

export function hasEffect(roomId: string, targetId: string, powerId: PowerId): boolean {
  return getActiveEffects(roomId).some(e => e.targetId === targetId && e.powerId === powerId);
}

export function cleanupRoom(roomId: string): void {
  roomEffects.delete(roomId);
}

// ── Internal ───────────────────────────────────────────────────────────────

function resolveTarget(
  powerId:    PowerId,
  sourceId:   string,
  requestedTarget: string | null,
  room:       RoomState
): string | null {
  const selfTargeting: PowerId[] = ["shield", "double_xp"];

  if (selfTargeting.includes(powerId)) return sourceId;

  if (powerId === "word_steal" || powerId === "freeze" || powerId === "letter_ban" || powerId === "reverse") {
    // Must target an active opponent
    if (!requestedTarget) return null;
    const target = room.players.get(requestedTarget);
    if (!target || target.status !== "active" || requestedTarget === sourceId) return null;
    return requestedTarget;
  }

  if (powerId === "category_switch") return sourceId; // affects whole room

  return requestedTarget;
}

function applyEffect(
  powerId:  PowerId,
  sourceId: string,
  targetId: string,
  room:     RoomState,
  io:       Server
): void {
  const duration = POWER_DURATIONS[powerId];
  const expiresAt = duration > 0 ? Date.now() + duration : Date.now() + 1;

  const effects = roomEffects.get(room.id) ?? [];

  switch (powerId) {
    case "freeze": {
      // Extend target's turn deadline by 5s (they lose time)
      if (room.currentTurnSocketId === targetId) {
        room.turnDeadline = Math.max(room.turnDeadline - 5_000, Date.now() + 1_000);
        io.to(room.id).emit("turn_changed", {
          nextTurnId:   room.currentTurnSocketId,
          turnDeadline: room.turnDeadline,
        });
      }
      effects.push({ powerId, sourceId, targetId, expiresAt });
      break;
    }

    case "shield": {
      effects.push({ powerId, sourceId, targetId, expiresAt });
      break;
    }

    case "double_xp": {
      effects.push({ powerId, sourceId, targetId, expiresAt });
      break;
    }

    case "letter_ban": {
      // Pick a random common letter to ban
      const bannable = ["S","T","R","N","L","E","A","O","I"];
      const banned = bannable[Math.floor(Math.random() * bannable.length)];
      effects.push({ powerId, sourceId, targetId, expiresAt: Date.now() + 20_000 });
      io.to(room.id).emit("letter_banned", { letter: banned, expiresAt: Date.now() + 20_000 });
      break;
    }

    case "word_steal": {
      // Steal last word — next word must start with same letter as stolen word's last char
      // (handled by room logic — just notify)
      io.to(room.id).emit("word_stolen", { by: sourceId, word: room.lastWord });
      break;
    }

    case "reverse": {
      effects.push({ powerId, sourceId, targetId: room.id, expiresAt });
      io.to(room.id).emit("chain_reversed", { expiresAt });
      break;
    }

    case "category_switch": {
      const categories = ["anime","countries","tech","movies","sports","food","science","music"];
      const newCat = categories[Math.floor(Math.random() * categories.length)];
      io.to(room.id).emit("category_switched", { category: newCat });
      break;
    }
  }

  roomEffects.set(room.id, effects);
}
