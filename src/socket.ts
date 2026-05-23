// ── Socket.io client ──────────────────────────────────────────────────────
import { io } from "socket.io-client";
import { useGameStore } from "./store";
import { auth } from "./firebase";

async function getAuthToken(): Promise<string | undefined> {
  const user = auth.currentUser;
  if (!user) return undefined;
  try { return await user.getIdToken(/* forceRefresh */ false); }
  catch { return undefined; }
}

const socket = io({
  autoConnect:          false,
  reconnection:         true,
  reconnectionAttempts: 8,
  reconnectionDelay:    1000,
  reconnectionDelayMax: 8000,
  timeout:              10_000,
});

export async function connectSocket(): Promise<void> {
  if (socket.connected) return;
  // Always get a fresh token on (re)connect — tokens expire after 1 hour
  const token = await getAuthToken();
  socket.auth = token ? { token } : {};
  socket.connect();
}

// Auto-connect in dev (server allows unauthenticated)
if (import.meta.env.DEV) {
  connectSocket().catch(console.error);
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

socket.on("connect", () => {
  const { status, roomId, uid, isReconnecting } = useGameStore.getState();
  console.log("[Socket] Connected", socket.id);
  if (isReconnecting) {
    useGameStore.getState().setGameState({ isReconnecting: false });
    if (status === "playing" && roomId && uid) {
      socket.emit("rejoin_match", { roomId, uid });
    }
  }
});

socket.on("connect_error", (err) => {
  console.error("[Socket] Connection error:", err.message);
  // Don't set isReconnecting here — socket.io handles retries automatically
});

socket.on("disconnect", (reason) => {
  const { status } = useGameStore.getState();
  console.log("[Socket] Disconnected:", reason);
  if (["playing", "matchmaking", "lobby", "private_room"].includes(status)) {
    useGameStore.getState().setGameState({ isReconnecting: true });
  }
  // Only manually reconnect on server-initiated disconnect
  // For transport errors, socket.io reconnects automatically
  if (reason === "io server disconnect") {
    setTimeout(() => connectSocket().catch(console.error), 1500);
  }
});

socket.on("reconnect", () => {
  console.log("[Socket] Reconnected");
  useGameStore.getState().setGameState({ isReconnecting: false });
});

socket.on("reconnect_failed", () => {
  console.error("[Socket] All reconnect attempts failed");
  useGameStore.getState().setGameState({ isReconnecting: false, status: "lobby" });
});

// ── Matchmaking ────────────────────────────────────────────────────────────

socket.on("matchmaking_status", ({ queueLength }: { status: string; queueLength: number }) => {
  useGameStore.getState().setGameState({ queueLength: queueLength ?? 0 });
});

socket.on("match_found", ({ roomId, players }: { roomId: string; players: any[] }) => {
  useGameStore.getState().setGameState({
    status: "playing", roomId,
    players: players.map(normalizePlayer),
    usedWords: [], lastWord: "", winnerId: null,
  });
});

// ── Game lifecycle ─────────────────────────────────────────────────────────

socket.on("game_start", ({ currentTurnId, turnDeadline, lastWord }: {
  currentTurnId: string; turnDeadline: number; lastWord: string;
}) => {
  useGameStore.getState().setGameState({ currentTurnId, turnDeadline, lastWord });
});

socket.on("room_snapshot", (snapshot: any) => {
  useGameStore.getState().setGameState({
    status: "playing", roomId: snapshot.id,
    players: snapshot.players.map(normalizePlayer),
    currentTurnId: snapshot.currentTurnId,
    turnDeadline: snapshot.turnDeadline,
    lastWord: snapshot.lastWord,
    usedWords: snapshot.usedWords ?? [],
    turnDuration: snapshot.turnDuration,
    isReconnecting: false,
  });
});

// ── Turn events ────────────────────────────────────────────────────────────

socket.on("word_accepted", ({ word, nextTurnId, turnDeadline, usedWords }: {
  word: string; nextTurnId: string; turnDeadline: number; usedWords: string[];
}) => {
  useGameStore.getState().setGameState({ lastWord: word, currentTurnId: nextTurnId, turnDeadline, usedWords });
});

socket.on("turn_changed", ({ nextTurnId, turnDeadline }: { nextTurnId: string; turnDeadline: number }) => {
  useGameStore.getState().setGameState({ currentTurnId: nextTurnId, turnDeadline });
});

socket.on("word_rejected", ({ reason }: { reason: string }) => {
  useGameStore.getState().setGameState({ lastRejectionReason: reason });
  setTimeout(() => useGameStore.getState().setGameState({ lastRejectionReason: null }), 2000);
});

// ── Player events ──────────────────────────────────────────────────────────

socket.on("player_eliminated", ({ playerId, players }: { playerId: string; players?: any[] }) => {
  const store = useGameStore.getState();
  if (players) {
    store.setGameState({ players: players.map(normalizePlayer) });
  } else {
    store.setGameState({ players: store.players.map(p =>
      p.id === playerId ? { ...p, status: "eliminated" as const } : p
    )});
  }
});

socket.on("player_disconnected", ({ playerId }: { playerId: string }) => {
  const { players } = useGameStore.getState();
  useGameStore.getState().setGameState({ players: players.map(p =>
    p.id === playerId ? { ...p, connected: false, status: "disconnected" as const } : p
  )});
});

socket.on("player_reconnected", ({ playerId, uid }: { playerId: string; uid: string }) => {
  const { players } = useGameStore.getState();
  useGameStore.getState().setGameState({ players: players.map(p =>
    (p.id === playerId || p.uid === uid)
      ? { ...p, id: playerId, connected: true, status: "active" as const }
      : p
  )});
});

// ── Game over ──────────────────────────────────────────────────────────────

socket.on("game_over", ({ winnerId, xpEarned, mmrDelta }: {
  winnerId: string | null; xpEarned?: number; mmrDelta?: number;
}) => {
  const isWinner = winnerId !== null && winnerId === socket.id;
  useGameStore.getState().setGameState({
    status:   "finished",
    winnerId: isWinner ? "me" : (winnerId ?? null),
    ...(xpEarned !== undefined ? { lastMatchXp: xpEarned } : {}),
    ...(mmrDelta  !== undefined ? { lastMatchMmrDelta: mmrDelta } : {}),
  });
});

// ── Rejoin ─────────────────────────────────────────────────────────────────

socket.on("rejoin_failed", ({ reason }: { reason: string }) => {
  console.warn("[Socket] Rejoin failed:", reason);
  useGameStore.getState().setGameState({ isReconnecting: false, status: "lobby" });
});

socket.on("error", ({ code, message }: { code: string; message: string }) => {
  console.error(`[Socket] Server error ${code}:`, message);
});

// ── Power events ───────────────────────────────────────────────────────────

socket.on("power_used", ({ powerId, sourceId, targetId, sourceUsername }: {
  powerId: string; sourceId: string; targetId: string; sourceUsername: string;
}) => {
  // Notify store so UI can show a toast/banner
  console.log(`[Power] ${sourceUsername} used ${powerId} → ${targetId}`);
  // Future: dispatch to a powers store slice for animated feedback
});

socket.on("letter_banned", ({ letter, expiresAt }: { letter: string; expiresAt: number }) => {
  console.log(`[Power] Letter ${letter} banned until ${new Date(expiresAt).toISOString()}`);
  // Future: store banned letter in game state for validation UI
});

socket.on("chain_reversed", ({ expiresAt }: { expiresAt: number }) => {
  console.log(`[Power] Chain reversed until ${new Date(expiresAt).toISOString()}`);
});

socket.on("category_switched", ({ category }: { category: string }) => {
  useGameStore.getState().setGameState({ selectedCategory: category });
});

socket.on("word_stolen", ({ by, word }: { by: string; word: string }) => {
  console.log(`[Power] Word "${word}" stolen by ${by}`);
});

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizePlayer(p: any) {
  return {
    id:        p.id        ?? "",
    uid:       p.uid       ?? "",
    username:  p.username  ?? "Player",
    avatar:    p.avatar    ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
    status:    p.status    ?? "active",
    lives:     p.lives     ?? 3,
    connected: p.connected ?? true,
  };
}

export default socket;
