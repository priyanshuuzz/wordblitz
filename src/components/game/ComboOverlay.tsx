// ── Combo Overlay ─────────────────────────────────────────────────────────
// Displays the current combo streak and multiplier above the word input.
// Mounts inside GameBoard — receives combo state as props.

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { ComboResult } from "../../lib/combo";

interface ComboOverlayProps {
  result:  ComboResult | null;
  visible: boolean;
}

export const ComboOverlay: React.FC<ComboOverlayProps> = ({ result, visible }) => {
  const prevCount = useRef(0);

  useEffect(() => {
    if (result) prevCount.current = result.comboCount;
  }, [result]);

  if (!result || !visible) return null;

  const { multiplier, comboCount, bonusType, label, xp } = result;

  // Color by multiplier tier
  const color =
    multiplier >= 4.0 ? "#ff51fa" :
    multiplier >= 3.0 ? "#ff5c3a" :
    multiplier >= 2.0 ? "#ffd166" :
    multiplier >= 1.5 ? "#cafd00" :
    "#8a8a8a";

  const glowColor =
    multiplier >= 4.0 ? "rgba(255,81,250,0.5)" :
    multiplier >= 3.0 ? "rgba(255,92,58,0.5)"  :
    multiplier >= 2.0 ? "rgba(255,209,102,0.4)" :
    multiplier >= 1.5 ? "rgba(202,253,0,0.4)"  :
    "transparent";

  return (
    <AnimatePresence>
      {visible && label && (
        <motion.div
          key={`combo-${comboCount}`}
          initial={{ opacity: 0, y: -12, scale: 0.85 }}
          animate={{ opacity: 1, y: 0,   scale: 1 }}
          exit={{   opacity: 0, y: -8,   scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className="flex flex-col items-center gap-1 pointer-events-none select-none"
        >
          {/* Main combo badge */}
          <div
            className="flex items-center gap-2 px-4 py-1.5 border"
            style={{
              borderColor: color,
              backgroundColor: `${color}18`,
              boxShadow: `0 0 16px ${glowColor}`,
            }}
          >
            {/* Multiplier */}
            <motion.span
              key={multiplier}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 20 }}
              className="font-headline font-black text-[22px] leading-none"
              style={{ color, textShadow: `0 0 12px ${glowColor}` }}
            >
              ×{multiplier.toFixed(multiplier % 1 === 0 ? 0 : 1)}
            </motion.span>

            {/* Label */}
            <span
              className="font-headline font-black text-[10px] uppercase tracking-widest"
              style={{ color }}
            >
              {label}
            </span>
          </div>

          {/* XP earned chip */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-headline font-black text-[11px] uppercase tracking-widest"
            style={{ color: "#cafd00", textShadow: "0 0 8px rgba(202,253,0,0.6)" }}
          >
            +{xp} XP
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ── Combo counter strip (persistent, shows current streak) ─────────────────
interface ComboStripProps {
  count:      number;
  multiplier: number;
}

export const ComboStrip: React.FC<ComboStripProps> = ({ count, multiplier }) => {
  if (count < 2) return null;

  const color =
    multiplier >= 4.0 ? "#ff51fa" :
    multiplier >= 3.0 ? "#ff5c3a" :
    multiplier >= 2.0 ? "#ffd166" :
    "#cafd00";

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-1.5"
    >
      <span className="font-headline font-black text-[10px] uppercase tracking-widest" style={{ color }}>
        🔥 {count} COMBO
      </span>
      <span
        className="font-mono font-bold text-[10px]"
        style={{ color }}
      >
        ×{multiplier.toFixed(multiplier % 1 === 0 ? 0 : 1)}
      </span>
    </motion.div>
  );
};
