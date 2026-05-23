import { create } from "zustand";

export interface Player {
  id: string;
  uid: string;
  username: string;
  avatar: string;
  status: "active" | "eliminated" | "forfeited" | "disconnected";
  lives: number;
  connected?: boolean;
}

interface GameState {
  // ── Navigation ────────────────────────────────────────────────────────────
  status: "landing" | "login" | "register" | "lobby" | "matchmaking" | "playing" | "finished" | "private_room" | "daily_challenge" | "category_selection";
  activeTab: "home" | "rankings" | "social" | "store" | "tournaments" | "achievements" | "missions" | "replays" | "stats";

  // ── Match state ───────────────────────────────────────────────────────────
  roomId: string | null;
  players: Player[];
  currentTurnId: string | null;
  lastWord: string;
  usedWords: string[];

  // ── Timer — server sends absolute deadline, client computes remaining ─────
  turnDeadline: number;   // Unix ms timestamp from server
  turnDuration: number;   // ms per turn (for display / local games)

  // ── Result ────────────────────────────────────────────────────────────────
  winnerId: string | null;
  lastMatchXp: number;
  lastMatchMmrDelta: number;
  lastRejectionReason: string | null;

  // ── Auth / Profile ────────────────────────────────────────────────────────
  username: string;
  avatar: string;
  uid: string;
  mmr: number;

  // ── Connection ────────────────────────────────────────────────────────────
  isReconnecting: boolean;
  queueLength: number;

  // ── Settings ─────────────────────────────────────────────────────────────
  sfxVolume: number;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;

  // ── Gameplay flags ────────────────────────────────────────────────────────
  isPaused: boolean;
  isSpectating: boolean;
  selectedCategory: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  setGameState: (state: Partial<GameState>) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  status:               "landing",
  activeTab:            "home",

  roomId:               null,
  players:              [],
  currentTurnId:        null,
  lastWord:             "",
  usedWords:            [],
  turnDeadline:         0,
  turnDuration:         10_000,
  winnerId:             null,
  lastMatchXp:          0,
  lastMatchMmrDelta:    0,
  lastRejectionReason:  null,

  username:             `Player_${Math.floor(Math.random() * 1000)}`,
  avatar:               `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
  uid:                  "",
  mmr:                  1000,

  isReconnecting:       false,
  queueLength:          0,

  sfxVolume:            0.5,
  musicEnabled:         true,
  notificationsEnabled: true,
  language:             "English",

  isPaused:             false,
  isSpectating:         false,
  selectedCategory:     null,

  setGameState: (state) => set((prev) => ({ ...prev, ...state })),

  resetGame: () => set({
    status:              "lobby",
    roomId:              null,
    players:             [],
    currentTurnId:       null,
    lastWord:            "",
    usedWords:           [],
    turnDeadline:        0,
    winnerId:            null,
    lastMatchXp:         0,
    lastMatchMmrDelta:   0,
    lastRejectionReason: null,
    isReconnecting:      false,
    isPaused:            false,
    isSpectating:        false,
    selectedCategory:    null,
  }),
}));
