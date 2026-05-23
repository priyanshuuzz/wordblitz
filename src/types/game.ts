// ── Shared game types used by both server and client ──────────────────────

export type PlayerStatus = "active" | "eliminated" | "forfeited" | "disconnected";
export type RoomStatus   = "waiting" | "countdown" | "active" | "finished";
export type GameMode     = "ranked" | "casual" | "private" | "category";

export interface RoomPlayer {
  id: string;           // socket.id during match, uid for Firebase
  uid: string;          // Firebase Auth UID
  username: string;
  avatar: string;
  status: PlayerStatus;
  lives: number;
  mmr: number;
  connectedAt: number;
  disconnectedAt: number | null;
  graceExpiry: number | null;  // ms timestamp — null if connected
}

export interface RoomState {
  id: string;
  mode: GameMode;
  status: RoomStatus;
  players: Map<string, RoomPlayer>;  // key: socket.id
  playerOrder: string[];             // socket.id order for turn rotation
  currentTurnSocketId: string;
  turnDeadline: number;              // absolute Unix ms — client computes remaining
  turnDuration: number;              // ms per turn
  lastWord: string;
  usedWords: Set<string>;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  winnerId: string | null;           // socket.id of winner
  winnerUid: string | null;          // Firebase UID of winner
  eventLog: GameEvent[];
  maxPlayers?: number;               // private rooms only
  hostSocketId?: string;             // private rooms only
}

export interface GameEvent {
  type:
    | "word_submitted"
    | "word_rejected"
    | "player_eliminated"
    | "turn_timeout"
    | "player_disconnected"
    | "player_reconnected"
    | "game_started"
    | "game_finished";
  socketId: string;
  uid: string;
  data: Record<string, unknown>;
  serverTs: number;
}

// ── Socket event payloads ──────────────────────────────────────────────────

export interface JoinMatchmakingPayload {
  username: string;
  avatar: string;
  uid: string;
  mmr?: number;
  region?: string;
  mode?: GameMode;
}

export interface SubmitWordPayload {
  roomId: string;
  word: string;
}

export interface RejoinPayload {
  roomId: string;
  uid: string;
}

// ── Serialized room (sent to clients — no Map/Set) ─────────────────────────

export interface SerializedPlayer {
  id: string;
  uid: string;
  username: string;
  avatar: string;
  status: PlayerStatus;
  lives: number;
  connected: boolean;
}

export interface RoomSnapshot {
  id: string;
  mode: GameMode;
  status: RoomStatus;
  players: SerializedPlayer[];
  currentTurnId: string;
  turnDeadline: number;
  lastWord: string;
  usedWords: string[];
  turnDuration: number;
}

// ── Matchmaking ────────────────────────────────────────────────────────────

export interface QueueEntry {
  socketId: string;
  uid: string;
  username: string;
  avatar: string;
  mmr: number;
  region: string;
  mode: GameMode;
  joinedAt: number;
  currentRange: number;
}
