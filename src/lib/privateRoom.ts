// ── Private Room Service (Firestore-backed, no server needed) ─────────────
// Rooms live in the `privateRooms` collection.
// Real-time updates via onSnapshot — works on Netlify with no backend.

import {
  collection, doc, setDoc, getDoc, updateDoc,
  onSnapshot, arrayUnion, serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";

// ── Types ──────────────────────────────────────────────────────────────────

export interface RoomMember {
  uid: string;
  username: string;
  avatar: string;
}

export type PrivateRoomStatus = "waiting" | "started" | "cancelled";

export interface GameMove {
  word: string;
  byUid: string;
  nextTurnUid: string;
  ts: number;
}

export interface PrivateRoomDoc {
  roomId: string;
  hostUid: string;
  hostUsername: string;
  maxPlayers: number;
  turnDuration: number;   // ms
  status: PrivateRoomStatus;
  players: RoomMember[];
  createdAt: unknown;
  // Game state (synced via Firestore)
  currentTurnUid?: string;
  lastWord?: string;
  usedWords?: string[];
  turnDeadline?: number;
  winnerId?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Create room (host) ─────────────────────────────────────────────────────

export async function createPrivateRoom(
  host: RoomMember,
  maxPlayers: number,
  turnDuration: number
): Promise<string> {
  const roomId = generateCode();
  const ref = doc(collection(db, "privateRooms"), roomId);

  const roomData: PrivateRoomDoc = {
    roomId,
    hostUid: host.uid,
    hostUsername: host.username,
    maxPlayers,
    turnDuration,
    status: "waiting",
    players: [host],
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, roomData);
  return roomId;
}

// ── Join room (guest) ──────────────────────────────────────────────────────

export type JoinResult =
  | { ok: true; room: PrivateRoomDoc }
  | { ok: false; reason: "not_found" | "already_started" | "full" | "already_in_room" };

export async function joinPrivateRoom(
  roomId: string,
  member: RoomMember
): Promise<JoinResult> {
  const ref = doc(db, "privateRooms", roomId.toUpperCase());
  const snap = await getDoc(ref);

  if (!snap.exists()) return { ok: false, reason: "not_found" };

  const room = snap.data() as PrivateRoomDoc;

  if (room.status !== "waiting") return { ok: false, reason: "already_started" };
  if (room.players.some(p => p.uid === member.uid)) return { ok: false, reason: "already_in_room" };
  if (room.players.length >= room.maxPlayers) return { ok: false, reason: "full" };

  await updateDoc(ref, {
    players: arrayUnion(member),
  });

  const updated = await getDoc(ref);
  return { ok: true, room: updated.data() as PrivateRoomDoc };
}

// ── Start room (host only) — sets status + initial game state ──────────────

export async function startPrivateRoom(roomId: string, firstPlayerUid: string): Promise<void> {
  await updateDoc(doc(db, "privateRooms", roomId), {
    status: "started",
    currentTurnUid: firstPlayerUid,
    lastWord: "",
    usedWords: [],
    turnDeadline: Date.now() + 15_000,
    winnerId: null,
  });
}

// ── Submit a word (syncs to Firestore so both players see it) ──────────────

export async function submitWord(
  roomId: string,
  word: string,
  nextTurnUid: string,
  turnDuration: number,
  usedWords: string[]
): Promise<void> {
  await updateDoc(doc(db, "privateRooms", roomId), {
    lastWord: word.toUpperCase(),
    usedWords: [...usedWords, word.toLowerCase()],
    currentTurnUid: nextTurnUid,
    turnDeadline: Date.now() + turnDuration,
  });
}

// ── Eliminate a player (timeout) ───────────────────────────────────────────

export async function eliminateAndAdvance(
  roomId: string,
  nextTurnUid: string | null,
  winnerId: string | null,
  turnDuration: number,
  usedWords: string[]
): Promise<void> {
  const update: Record<string, unknown> = {
    currentTurnUid: nextTurnUid,
    usedWords,
    winnerId,
  };
  if (nextTurnUid) {
    update.turnDeadline = Date.now() + turnDuration;
  }
  if (winnerId !== undefined) {
    update.status = "cancelled"; // game over
  }
  await updateDoc(doc(db, "privateRooms", roomId), update);
}

// ── Cancel / leave room ────────────────────────────────────────────────────

export async function cancelPrivateRoom(roomId: string): Promise<void> {
  await updateDoc(doc(db, "privateRooms", roomId), { status: "cancelled" });
}

// ── Real-time listener ─────────────────────────────────────────────────────

export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: PrivateRoomDoc | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "privateRooms", roomId),
    (snap) => onUpdate(snap.exists() ? (snap.data() as PrivateRoomDoc) : null),
    (err) => { console.error("[PrivateRoom] snapshot error:", err); onUpdate(null); }
  );
}
