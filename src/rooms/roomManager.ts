// ── Room Manager ───────────────────────────────────────────────────────────
// Single source of truth for all active rooms.
// All game state lives here in memory — zero DB reads during gameplay.

import type { Server } from "socket.io";
import type {
  RoomState, RoomPlayer, RoomSnapshot, SerializedPlayer,
  GameMode, QueueEntry,
} from "../types/game.js";
import { validateWord } from "../engine/wordValidator.js";
import { checkSubmission, clearPlayer } from "../engine/antiCheat.js";

const GRACE_PERIOD_MS  = 10_000;  // 10s to reconnect before elimination
const COUNTDOWN_MS     = 3_000;   // 3s countdown before game starts
const CLEANUP_AFTER_MS = 60_000;  // delete finished rooms after 60s

// ── Room registry ──────────────────────────────────────────────────────────
const rooms = new Map<string, RoomState>();
const timers = new Map<string, NodeJS.Timeout>();

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ── Serialization ──────────────────────────────────────────────────────────
export function serializeRoom(room: RoomState): RoomSnapshot {
  const players: SerializedPlayer[] = Array.from(room.players.values()).map(p => ({
    id:        p.id,
    uid:       p.uid,
    username:  p.username,
    avatar:    p.avatar,
    status:    p.status,
    lives:     p.lives,
    connected: p.disconnectedAt === null,
  }));

  return {
    id:            room.id,
    mode:          room.mode,
    status:        room.status,
    players,
    currentTurnId: room.currentTurnSocketId,
    turnDeadline:  room.turnDeadline,
    lastWord:      room.lastWord,
    usedWords:     Array.from(room.usedWords),
    turnDuration:  room.turnDuration,
  };
}

// ── Room creation ──────────────────────────────────────────────────────────
export function createRoom(
  entries: QueueEntry[],
  mode: GameMode,
  turnDurationMs: number,
  io: Server,
  onFinish: (room: RoomState) => void
): RoomState {
  const roomId = generateRoomId();
  const players = new Map<string, RoomPlayer>();
  const playerOrder: string[] = [];

  for (const entry of entries) {
    const player: RoomPlayer = {
      id:             entry.socketId,
      uid:            entry.uid,
      username:       entry.username,
      avatar:         entry.avatar,
      status:         "active",
      lives:          3,
      mmr:            entry.mmr,
      connectedAt:    Date.now(),
      disconnectedAt: null,
      graceExpiry:    null,
    };
    players.set(entry.socketId, player);
    playerOrder.push(entry.socketId);
  }

  const room: RoomState = {
    id:                   roomId,
    mode,
    status:               "countdown",
    players,
    playerOrder,
    currentTurnSocketId:  playerOrder[0],
    turnDeadline:         Date.now() + COUNTDOWN_MS + turnDurationMs,
    turnDuration:         turnDurationMs,
    lastWord:             "",
    usedWords:            new Set(),
    createdAt:            Date.now(),
    startedAt:            null,
    finishedAt:           null,
    winnerId:             null,
    winnerUid:            null,
    eventLog:             [],
  };

  rooms.set(roomId, room);

  // Join all sockets to the room
  for (const entry of entries) {
    const socket = io.sockets.sockets.get(entry.socketId);
    socket?.join(roomId);
    if (socket) socket.data.roomId = roomId;
  }

  // Notify players
  io.to(roomId).emit("match_found", {
    roomId,
    players: Array.from(players.values()).map(p => ({
      id: p.id, uid: p.uid, username: p.username, avatar: p.avatar,
      status: p.status, lives: p.lives,
    })),
  });

  // Start countdown then activate
  const countdownTimer = setTimeout(() => {
    room.status = "active";
    room.startedAt = Date.now();
    room.turnDeadline = Date.now() + turnDurationMs;

    room.eventLog.push({ type: "game_started", socketId: "", uid: "", data: {}, serverTs: Date.now() });

    io.to(roomId).emit("game_start", {
      currentTurnId: room.currentTurnSocketId,
      turnDeadline:  room.turnDeadline,
      lastWord:      room.lastWord,
    });

    startTurnTimer(room, io, onFinish);
  }, COUNTDOWN_MS);

  timers.set(`countdown:${roomId}`, countdownTimer);

  console.log(`[Room] Created ${roomId} mode=${mode} players=${entries.length}`);
  return room;
}

// ── Turn timer ─────────────────────────────────────────────────────────────
function startTurnTimer(
  room: RoomState,
  io: Server,
  onFinish: (room: RoomState) => void
): void {
  clearTurnTimer(room.id);

  const remaining = room.turnDeadline - Date.now();
  if (remaining <= 0) { handleTimeout(room, io, onFinish); return; }

  const t = setTimeout(() => handleTimeout(room, io, onFinish), remaining);
  timers.set(`turn:${room.id}`, t);
}

function clearTurnTimer(roomId: string): void {
  const t = timers.get(`turn:${roomId}`);
  if (t) { clearTimeout(t); timers.delete(`turn:${roomId}`); }
}

function handleTimeout(
  room: RoomState,
  io: Server,
  onFinish: (room: RoomState) => void
): void {
  if (room.status !== "active") return;

  const eliminated = room.players.get(room.currentTurnSocketId);
  if (!eliminated) return;

  eliminated.status = "eliminated";
  room.eventLog.push({
    type: "turn_timeout", socketId: eliminated.id, uid: eliminated.uid,
    data: { word: room.lastWord }, serverTs: Date.now(),
  });

  io.to(room.id).emit("player_eliminated", {
    playerId: eliminated.id,
    reason:   "timeout",
    players:  serializeRoom(room).players,
  });

  const active = getActivePlayers(room);
  if (active.length <= 1) {
    finishGame(room, active[0]?.id ?? null, io, onFinish);
  } else {
    advanceTurn(room);
    room.turnDeadline = Date.now() + room.turnDuration;
    io.to(room.id).emit("turn_changed", {
      nextTurnId:   room.currentTurnSocketId,
      turnDeadline: room.turnDeadline,
    });
    startTurnTimer(room, io, onFinish);
  }
}

// ── Word submission ────────────────────────────────────────────────────────
export function handleWordSubmit(
  socketId: string,
  roomId: string,
  word: string,
  io: Server,
  onFinish: (room: RoomState) => void
): void {
  const room = rooms.get(roomId);
  if (!room || room.status !== "active") return;

  const player = room.players.get(socketId);
  if (!player || player.status !== "active") return;
  if (room.currentTurnSocketId !== socketId) {
    io.to(socketId).emit("word_rejected", { reason: "Not your turn" });
    return;
  }
  if (Date.now() > room.turnDeadline) {
    io.to(socketId).emit("word_rejected", { reason: "Time expired" });
    return;
  }

  const normalized = word.toLowerCase().trim();

  // Anti-cheat check (non-blocking — just flags)
  const turnStartMs = room.turnDeadline - room.turnDuration;
  checkSubmission(player.uid, roomId, normalized, turnStartMs);

  // Validate word
  const result = validateWord(normalized, room.lastWord, room.usedWords);
  if (!result.valid) {
    io.to(socketId).emit("word_rejected", { reason: result.reason });
    room.eventLog.push({
      type: "word_rejected", socketId, uid: player.uid,
      data: { word: normalized, reason: result.reason }, serverTs: Date.now(),
    });
    return;
  }

  // Accept word
  clearTurnTimer(room.id);
  room.usedWords.add(normalized);
  room.lastWord = normalized;
  room.eventLog.push({
    type: "word_submitted", socketId, uid: player.uid,
    data: { word: normalized }, serverTs: Date.now(),
  });

  advanceTurn(room);
  room.turnDeadline = Date.now() + room.turnDuration;

  io.to(room.id).emit("word_accepted", {
    word:         normalized,
    nextTurnId:   room.currentTurnSocketId,
    turnDeadline: room.turnDeadline,
    usedWords:    Array.from(room.usedWords),
  });

  startTurnTimer(room, io, onFinish);
}

// ── Disconnect / Reconnect ─────────────────────────────────────────────────
export function handleDisconnect(
  socketId: string,
  io: Server,
  onFinish: (room: RoomState) => void
): void {
  for (const room of rooms.values()) {
    const player = room.players.get(socketId);
    if (!player || room.status === "finished") continue;

    player.disconnectedAt = Date.now();
    player.graceExpiry    = Date.now() + GRACE_PERIOD_MS;

    room.eventLog.push({
      type: "player_disconnected", socketId, uid: player.uid,
      data: { graceExpiry: player.graceExpiry }, serverTs: Date.now(),
    });

    io.to(room.id).emit("player_disconnected", {
      playerId:    socketId,
      graceExpiry: player.graceExpiry,
    });

    // Schedule grace expiry
    const graceTimer = setTimeout(() => {
      const r = rooms.get(room.id);
      if (!r) return;
      const p = r.players.get(socketId);
      if (!p || p.disconnectedAt === null) return; // reconnected

      p.status = "eliminated";
      io.to(r.id).emit("player_eliminated", { playerId: socketId, reason: "disconnect" });

      const active = getActivePlayers(r);
      if (active.length <= 1) {
        finishGame(r, active[0]?.id ?? null, io, onFinish);
      } else if (r.currentTurnSocketId === socketId) {
        advanceTurn(r);
        r.turnDeadline = Date.now() + r.turnDuration;
        io.to(r.id).emit("turn_changed", { nextTurnId: r.currentTurnSocketId, turnDeadline: r.turnDeadline });
        startTurnTimer(r, io, onFinish);
      }
    }, GRACE_PERIOD_MS);

    timers.set(`grace:${socketId}`, graceTimer);
    break;
  }
}

export function handleReconnect(
  socketId: string,
  uid: string,
  roomId: string,
  io: Server
): boolean {
  const room = rooms.get(roomId);
  if (!room || room.status === "finished") return false;

  // Find player by uid (socket.id changes on reconnect)
  let found: RoomPlayer | null = null;
  let oldSocketId = "";

  for (const [sid, p] of room.players) {
    if (p.uid === uid && p.disconnectedAt !== null) {
      found = p; oldSocketId = sid; break;
    }
  }

  if (!found) return false;
  if (found.graceExpiry && Date.now() > found.graceExpiry) return false;

  // Clear grace timer
  const graceTimer = timers.get(`grace:${oldSocketId}`);
  if (graceTimer) { clearTimeout(graceTimer); timers.delete(`grace:${oldSocketId}`); }

  // Remap player to new socket
  room.players.delete(oldSocketId);
  found.id             = socketId;
  found.disconnectedAt = null;
  found.graceExpiry    = null;
  room.players.set(socketId, found);

  // Update turn if it was their turn
  if (room.currentTurnSocketId === oldSocketId) {
    room.currentTurnSocketId = socketId;
  }
  const orderIdx = room.playerOrder.indexOf(oldSocketId);
  if (orderIdx !== -1) room.playerOrder[orderIdx] = socketId;

  const socket = io.sockets.sockets.get(socketId);
  socket?.join(roomId);
  if (socket) socket.data.roomId = roomId;

  room.eventLog.push({
    type: "player_reconnected", socketId, uid: found.uid,
    data: {}, serverTs: Date.now(),
  });

  // Send full snapshot to reconnected player
  io.to(socketId).emit("room_snapshot", serializeRoom(room));
  socket?.to(roomId).emit("player_reconnected", { playerId: socketId, uid });

  return true;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getActivePlayers(room: RoomState): RoomPlayer[] {
  return Array.from(room.players.values()).filter(p => p.status === "active");
}

function advanceTurn(room: RoomState): void {
  const active = getActivePlayers(room);
  if (!active.length) return;

  const currentIdx = room.playerOrder.indexOf(room.currentTurnSocketId);
  let nextIdx = (currentIdx + 1) % room.playerOrder.length;
  let attempts = 0;

  while (attempts < room.playerOrder.length) {
    const candidate = room.players.get(room.playerOrder[nextIdx]);
    if (candidate?.status === "active") {
      room.currentTurnSocketId = room.playerOrder[nextIdx];
      return;
    }
    nextIdx = (nextIdx + 1) % room.playerOrder.length;
    attempts++;
  }
}

function finishGame(
  room: RoomState,
  winnerSocketId: string | null,
  io: Server,
  onFinish: (room: RoomState) => void
): void {
  // Clear ALL timers for this room
  clearTurnTimer(room.id);
  const countdownTimer = timers.get(`countdown:${room.id}`);
  if (countdownTimer) { clearTimeout(countdownTimer); timers.delete(`countdown:${room.id}`); }

  if (room.status === "finished") return; // already finished — guard against double-call

  room.status     = "finished";
  room.finishedAt = Date.now();
  room.winnerId   = winnerSocketId;

  if (winnerSocketId) {
    const winner = room.players.get(winnerSocketId);
    room.winnerUid = winner?.uid ?? null;
  }

  room.eventLog.push({
    type: "game_finished", socketId: winnerSocketId ?? "", uid: room.winnerUid ?? "",
    data: { durationMs: Date.now() - (room.startedAt ?? Date.now()) }, serverTs: Date.now(),
  });

  io.to(room.id).emit("game_over", {
    winnerId: winnerSocketId,
    xpEarned: winnerSocketId ? 100 : 25,
    mmrDelta:  winnerSocketId ? 18  : -18,
  });

  onFinish(room);

  // Schedule room cleanup — store handle so we could cancel on shutdown
  const cleanupTimer = setTimeout(() => {
    // Clean up all grace timers for players in this room
    for (const player of room.players.values()) {
      const gt = timers.get(`grace:${player.id}`);
      if (gt) { clearTimeout(gt); timers.delete(`grace:${player.id}`); }
    }
    rooms.delete(room.id);
    console.log(`[Room] Cleaned up ${room.id}`);
  }, CLEANUP_AFTER_MS);
  timers.set(`cleanup:${room.id}`, cleanupTimer);
}

// ── Public getters ─────────────────────────────────────────────────────────
export function getRoom(roomId: string): RoomState | undefined {
  return rooms.get(roomId);
}

export function getRoomByUid(uid: string): RoomState | undefined {
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      if (player.uid === uid) return room;
    }
  }
  return undefined;
}

export function getActiveRoomCount(): number {
  return Array.from(rooms.values()).filter(r => r.status === "active").length;
}
