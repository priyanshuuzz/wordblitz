// ── WORDBLITZ Game Server ──────────────────────────────────────────────────
import "dotenv/config";
import express        from "express";
import helmet         from "helmet";
import { createServer }  from "http";
import { Server, Socket } from "socket.io";
import cors           from "cors";
import path           from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

import { verifyToken }          from "./src/firebase/admin.js";
import { recordMatchResult, ensurePlayerProfile } from "./src/firebase/playerService.js";
import { drainFlags }           from "./src/engine/antiCheat.js";
import { handleUsePower, cleanupRoom } from "./src/engine/powerEngine.js";
import {
  handleWordSubmit, handleDisconnect, handleReconnect,
  getActiveRoomCount, serializeRoom, getRoom,
  addPlayerToRoom, createPrivateRoom, startPrivateRoom,
} from "./src/rooms/roomManager.js";
import {
  enqueue, dequeue, isQueued, getQueueLength, tick as mmTick,
} from "./src/matchmaking/queue.js";
import {
  checkRateLimit, checkMatchmakingLimit, checkWordSubmitLimit,
} from "./src/middleware/rateLimiter.js";
import type { JoinMatchmakingPayload, SubmitWordPayload, RejoinPayload, RoomState } from "./src/types/game.js";

const IS_PROD = process.env.NODE_ENV === "production";
const PORT    = parseInt(process.env.PORT ?? "3000", 10);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

// ── Global error handlers — prevent silent crashes ─────────────────────────
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught exception:", err);
  // Don't exit — log and continue for non-fatal errors
});

// ── Express setup ──────────────────────────────────────────────────────────
const app        = express();
const httpServer = createServer(app);

app.use(helmet({
  contentSecurityPolicy: IS_PROD,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: IS_PROD ? ALLOWED_ORIGINS : "*",
  methods: ["GET", "POST"],
}));
app.use(express.json({ limit: "10kb" }));

const io = new Server(httpServer, {
  cors: {
    origin: IS_PROD ? ALLOWED_ORIGINS : "*",
    methods: ["GET", "POST"],
  },
  pingTimeout:  20_000,
  pingInterval: 10_000,
  maxHttpBufferSize: 1e5, // 100KB max payload
});

// ── Auth middleware ────────────────────────────────────────────────────────
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    if (!IS_PROD) {
      socket.data.uid    = socket.id;
      socket.data.authed = false;
      return next();
    }
    return next(new Error("Authentication required"));
  }
  try {
    const decoded        = await verifyToken(token);
    socket.data.uid      = decoded.uid;
    socket.data.email    = decoded.email;
    socket.data.authed   = true;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// ── Match finish callback ──────────────────────────────────────────────────
async function onMatchFinish(room: RoomState): Promise<void> {
  cleanupRoom(room.id);
  try {
    await recordMatchResult(room);
  } catch (err) {
    console.error("[Firebase] Failed to record match:", err);
  }

  const flags = drainFlags();
  if (flags.length > 0) {
    try {
      const { adminFirestore } = await import("./src/firebase/admin.js");
      const batch = adminFirestore.batch();
      for (const flag of flags) {
        batch.set(adminFirestore.collection("suspicions").doc(), {
          uid: flag.uid, type: flag.type, severity: flag.severity,
          matchId: flag.matchId, data: flag.data,
          timestamp: new Date(flag.timestamp),
        });
      }
      await batch.commit();
    } catch (err) {
      console.error("[AntiCheat] Failed to persist flags:", err);
    }
  }
}

// ── Socket event handlers ──────────────────────────────────────────────────
io.on("connection", (socket: Socket) => {
  const uid = socket.data.uid as string;
  console.log(`[Socket] Connected uid=${uid} sid=${socket.id}`);

  socket.on("join_matchmaking", async (payload: JoinMatchmakingPayload) => {
    if (!payload?.username) return;
    if (!checkMatchmakingLimit(uid)) {
      socket.emit("error", { code: "RATE_LIMITED", message: "Too many requests" });
      return;
    }
    if (isQueued(uid)) {
      socket.emit("matchmaking_status", { status: "already_queued", queueLength: getQueueLength() });
      return;
    }
    socket.data.username = payload.username;
    socket.data.avatar   = payload.avatar;

    ensurePlayerProfile(uid, payload.username, payload.avatar).catch(err =>
      console.error("[Firebase] ensurePlayerProfile failed:", err)
    );

    enqueue({
      socketId: socket.id, uid,
      username: payload.username, avatar: payload.avatar,
      mmr: payload.mmr ?? 1000, region: payload.region ?? "GLOBAL",
      mode: payload.mode ?? "casual", joinedAt: Date.now(), currentRange: 150,
    });
    socket.emit("matchmaking_status", { status: "queued", queueLength: getQueueLength() });
  });

  socket.on("leave_matchmaking", () => {
    dequeue(uid);
    socket.emit("matchmaking_status", { status: "left" });
  });

  socket.on("submit_word", (payload: SubmitWordPayload) => {
    if (!payload?.roomId || !payload?.word) return;
    if (!checkWordSubmitLimit(uid)) {
      socket.emit("word_rejected", { reason: "Slow down!" });
      return;
    }
    if (!checkRateLimit(uid, 60, 60_000)) {
      socket.emit("error", { code: "RATE_LIMITED", message: "Rate limit exceeded" });
      return;
    }
    try {
      handleWordSubmit(socket.id, payload.roomId, payload.word, io, onMatchFinish);
    } catch (err) {
      console.error("[Game] handleWordSubmit error:", err);
    }
  });

  socket.on("rejoin_match", (payload: RejoinPayload) => {
    if (!payload?.roomId) return;
    const success = handleReconnect(socket.id, payload.uid ?? uid, payload.roomId, io);
    if (!success) socket.emit("rejoin_failed", { reason: "Room not found or grace expired" });
  });

  socket.on("request_snapshot", ({ roomId }: { roomId: string }) => {
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room) { socket.emit("room_not_found"); return; }
    if (!room.players.has(socket.id)) { socket.emit("not_in_room"); return; }
    socket.emit("room_snapshot", serializeRoom(room));
  });

  socket.on("use_power", (payload: { roomId: string; powerId: string; targetId: string | null }) => {
    if (!payload?.roomId || !payload?.powerId) return;
    const room = getRoom(payload.roomId);
    if (!room) return;
    const result = handleUsePower(socket.id, {
      roomId:   payload.roomId,
      powerId:  payload.powerId as any,
      targetId: payload.targetId,
    }, room, io);
    if (!result.success) {
      socket.emit("power_blocked", { reason: result.reason });
    }
  });

  // ── Private room: create ────────────────────────────────────────────────
  socket.on("create_private_room", (payload: {
    username: string; avatar: string; mmr?: number;
    maxPlayers?: number; turnDuration?: number;
  }) => {
    if (!payload?.username) return;
    const room = createPrivateRoom(
      socket.id, uid,
      payload.username, payload.avatar ?? "",
      payload.mmr ?? 1000,
      Math.min(Math.max(payload.maxPlayers ?? 4, 2), 8),
      payload.turnDuration ?? 15_000,
      io
    );
    socket.emit("private_room_created", { roomId: room.id });
  });

  // ── Private room: join by code ───────────────────────────────────────────
  socket.on("join_private_room", (payload: {
    roomId: string; username: string; avatar: string; mmr?: number;
  }) => {
    if (!payload?.roomId || !payload?.username) return;
    const code = payload.roomId.toUpperCase().replace(/-/g, "");
    const result = addPlayerToRoom(
      socket.id, uid,
      payload.username, payload.avatar ?? "",
      payload.mmr ?? 1000,
      code, io
    );
    if (!result.ok) {
      socket.emit("join_room_error", { reason: (result as { ok: false; reason: string }).reason });
    } else {
      const room = getRoom(code);
      if (room) socket.emit("join_room_success", { roomId: code, snapshot: serializeRoom(room) });
    }
  });

  // ── Private room: start (host only) ─────────────────────────────────────
  socket.on("start_private_room", (payload: { roomId: string }) => {
    if (!payload?.roomId) return;
    const result = startPrivateRoom(payload.roomId, socket.id, io, onMatchFinish);
    if (!result.ok) {
      socket.emit("start_room_error", { reason: result.reason });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Disconnected uid=${uid} sid=${socket.id} reason=${reason}`);
    dequeue(uid);
    try { handleDisconnect(socket.id, io, onMatchFinish); }
    catch (err) { console.error("[Game] handleDisconnect error:", err); }
  });
});

// ── Matchmaking tick ───────────────────────────────────────────────────────
const mmInterval = setInterval(() => {
  try { mmTick(io, onMatchFinish); }
  catch (err) { console.error("[Matchmaking] tick error:", err); }
}, 500);

// ── Health endpoint ────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok", activeRooms: getActiveRoomCount(),
    queueLength: getQueueLength(), connections: io.engine.clientsCount,
    uptime: Math.floor(process.uptime()),
  });
});

// ── Vite / static ──────────────────────────────────────────────────────────
async function startServer() {
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  // In production (Railway), frontend is served by Netlify — no static files needed

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] WORDBLITZ running on http://localhost:${PORT}`);
    console.log(`[Server] NODE_ENV=${process.env.NODE_ENV ?? "development"}`);
  });
}

// ── Graceful shutdown ──────────────────────────────────────────────────────
function shutdown(signal: string) {
  console.log(`[Server] ${signal} received — shutting down gracefully`);
  clearInterval(mmInterval);
  io.close(() => {
    httpServer.close(() => {
      console.log("[Server] Closed. Goodbye.");
      process.exit(0);
    });
  });
  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10_000);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

startServer().catch(err => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});
