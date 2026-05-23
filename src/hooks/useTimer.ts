// ── useTimer — server-authoritative countdown hook ────────────────────────
// Reads from an absolute Unix ms deadline (set by server).
// No drift possible — client always computes from server timestamp.
// Falls back to local duration-based countdown when no deadline is set.

import { useState, useEffect, useRef } from "react";

interface UseTimerOptions {
  turnDeadline: number;   // absolute Unix ms from server (0 = not set)
  turnDuration: number;   // ms per turn (for local fallback)
  isPaused: boolean;
  onExpire?: () => void;
}

interface UseTimerResult {
  remaining: number;      // seconds remaining (float)
  fraction: number;       // 0–1 (1 = full, 0 = expired)
  isLow: boolean;         // < 30% remaining
  isCritical: boolean;    // < 10% remaining
  color: string;          // CSS color string
}

export function useTimer({
  turnDeadline,
  turnDuration,
  isPaused,
  onExpire,
}: UseTimerOptions): UseTimerResult {
  const durationSec = turnDuration / 1000;
  const [remaining, setRemaining] = useState(durationSec);
  const expiredRef = useRef(false);

  useEffect(() => {
    // Reset expiry flag on new turn
    expiredRef.current = false;
    setRemaining(durationSec);
  }, [turnDeadline, durationSec]);

  useEffect(() => {
    if (isPaused) return;

    const id = setInterval(() => {
      let rem: number;

      if (turnDeadline > 0) {
        // Server-authoritative: compute from absolute deadline
        rem = Math.max(0, (turnDeadline - Date.now()) / 1000);
      } else {
        // Local fallback
        setRemaining(prev => {
          const next = Math.max(0, prev - 0.1);
          if (next === 0 && !expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return next;
        });
        return;
      }

      setRemaining(rem);

      if (rem === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    }, 100);

    return () => clearInterval(id);
  }, [turnDeadline, isPaused, onExpire]);

  const fraction   = Math.min(1, Math.max(0, remaining / durationSec));
  const isLow      = fraction <= 0.3;
  const isCritical = fraction <= 0.1;

  const color = fraction > 0.6
    ? "#cafd00"
    : fraction > 0.3
    ? "#ffd166"
    : fraction > 0.1
    ? "#ff5c3a"
    : "#ff2200";

  return { remaining, fraction, isLow, isCritical, color };
}
