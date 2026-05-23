// ── useMatchmaking — clean hook for matchmaking flow ─────────────────────
// Encapsulates join/leave logic and queue status.

import { useEffect, useCallback } from "react";
import { useGameStore } from "../store";
import socket, { connectSocket } from "../socket";

export function useMatchmaking() {
  const { username, avatar, uid, mmr, setGameState } = useGameStore();

  const join = useCallback(async (mode: "casual" | "ranked" | "category" = "casual") => {
    // Ensure socket is connected with fresh auth token
    await connectSocket();

    setGameState({ status: "matchmaking" });

    socket.emit("join_matchmaking", {
      username,
      avatar,
      uid,
      mmr,
      region: "GLOBAL",
      mode,
    });
  }, [username, avatar, uid, mmr, setGameState]);

  const leave = useCallback(() => {
    socket.emit("leave_matchmaking");
    setGameState({ status: "lobby" });
  }, [setGameState]);

  // Clean up if component unmounts while in queue
  useEffect(() => {
    return () => {
      const status = useGameStore.getState().status;
      if (status === "matchmaking") {
        socket.emit("leave_matchmaking");
      }
    };
  }, []);

  return { join, leave };
}
