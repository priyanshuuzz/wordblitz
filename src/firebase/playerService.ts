// ── Player service — Firestore CRUD ───────────────────────────────────────
// All writes use Admin SDK (bypasses security rules).
// Called only from server-side code after match completion.

import { FieldValue } from "firebase-admin/firestore";
import { adminFirestore } from "./admin.js";
import { calculateMMR, calculateXP, getRank } from "../engine/mmrCalculator.js";
import type { RoomState } from "../types/game.js";

const db = adminFirestore;

// ── Profile ────────────────────────────────────────────────────────────────

export async function getPlayerProfile(uid: string) {
  const snap = await db.doc(`players/${uid}`).get();
  return snap.exists ? snap.data() : null;
}

export async function ensurePlayerProfile(
  uid: string,
  username: string,
  avatar: string
): Promise<void> {
  const ref = db.doc(`players/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      uid, username, avatar,
      xp: 0, level: 1, mmr: 1000, rank: "silver",
      wins: 0, losses: 0, winStreak: 0, gamesPlayed: 0,
      createdAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp(),
    });
  }
}

// ── Match completion ───────────────────────────────────────────────────────

export async function recordMatchResult(room: RoomState): Promise<void> {
  if (!room.winnerUid || room.status !== "finished") return;

  const players = Array.from(room.players.values());
  if (players.length < 2) return;

  // Fetch all player profiles in parallel
  const profiles = await Promise.all(
    players.map(p => getPlayerProfile(p.uid))
  );

  const profileMap = new Map<string, any>();
  players.forEach((p, i) => profileMap.set(p.uid, profiles[i]));

  // Calculate MMR for 2-player match (extend for multiplayer later)
  const winner = players.find(p => p.uid === room.winnerUid)!;
  const losers = players.filter(p => p.uid !== room.winnerUid);

  const winnerProfile = profileMap.get(winner.uid) ?? { mmr: 1000, gamesPlayed: 0, winStreak: 0 };

  // Batch all writes — 1 batch = N writes, billed as N writes (not N transactions)
  const batch = db.batch();

  // Winner update
  const winnerWords = room.eventLog
    .filter(e => e.uid === winner.uid && e.type === "word_submitted")
    .map(e => e.data.word as string);
  const avgWordLen = winnerWords.length
    ? winnerWords.reduce((s, w) => s + w.length, 0) / winnerWords.length
    : 0;
  const xpEarned = calculateXP(true, (winnerProfile.winStreak ?? 0) + 1, avgWordLen);

  let totalMmrDelta = 0;

  for (const loser of losers) {
    const loserProfile = profileMap.get(loser.uid) ?? { mmr: 1000, gamesPlayed: 0 };
    const mmrResult = calculateMMR(
      winner.uid, winnerProfile.mmr ?? 1000, winnerProfile.gamesPlayed ?? 0,
      loser.uid,  loserProfile.mmr  ?? 1000, loserProfile.gamesPlayed  ?? 0,
    );
    totalMmrDelta += mmrResult.winnerDelta;

    const loserXp = calculateXP(false, 0, 0);
    const loserNewMmr = mmrResult.loserNewMmr;

    batch.update(db.doc(`players/${loser.uid}`), {
      losses:       FieldValue.increment(1),
      gamesPlayed:  FieldValue.increment(1),
      xp:           FieldValue.increment(loserXp),
      mmr:          loserNewMmr,
      rank:         getRank(loserNewMmr),
      winStreak:    0,
      lastActiveAt: FieldValue.serverTimestamp(),
    });
  }

  const winnerNewMmr = Math.max(0, (winnerProfile.mmr ?? 1000) + totalMmrDelta);

  batch.update(db.doc(`players/${winner.uid}`), {
    wins:         FieldValue.increment(1),
    gamesPlayed:  FieldValue.increment(1),
    xp:           FieldValue.increment(xpEarned),
    mmr:          winnerNewMmr,
    rank:         getRank(winnerNewMmr),
    winStreak:    FieldValue.increment(1),
    lastActiveAt: FieldValue.serverTimestamp(),
  });

  // Write match document
  const matchRef = db.collection("matches").doc(room.id);
  const playerData: Record<string, any> = {};
  players.forEach(p => {
    const words = room.eventLog
      .filter(e => e.uid === p.uid && e.type === "word_submitted")
      .map(e => e.data.word as string);
    playerData[p.uid] = {
      placement:   p.uid === room.winnerUid ? 1 : 2,
      wordsPlayed: words,
      xpEarned:    p.uid === room.winnerUid ? xpEarned : calculateXP(false, 0, 0),
    };
  });

  batch.set(matchRef, {
    matchId:    room.id,
    mode:       room.mode,
    playerIds:  players.map(p => p.uid),
    players:    playerData,
    winnerId:   room.winnerUid,
    durationMs: room.finishedAt! - (room.startedAt ?? room.createdAt),
    startedAt:  room.startedAt ? new Date(room.startedAt) : null,
    endedAt:    new Date(room.finishedAt!),
    flagged:    false,
    flagReasons: [],
  });

  await batch.commit();
  console.log(`[Firebase] Match ${room.id} recorded. Winner: ${room.winnerUid} +${xpEarned}XP +${totalMmrDelta}MMR`);
}
