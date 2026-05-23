// ── Power Panel ───────────────────────────────────────────────────────────
// In-game UI strip showing the player's available powers.
// Sits above the word input in GameBoard.

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  POWERS, loadInventory, isOnCooldown, setCooldown,
  getCooldownRemaining, usePower as consumePower,
  type PowerId,
} from "../../lib/powers";
import { sfx } from "../../lib/sound";
import { buttonTap } from "../../lib/animations";

interface PowerPanelProps {
  isMyTurn:   boolean;
  players:    { id: string; username: string; status: string }[];
  myId:       string;
  onUsePower: (powerId: PowerId, targetId: string | null) => void;
  disabled:   boolean;
}

export const PowerPanel: React.FC<PowerPanelProps> = ({
  isMyTurn, players, myId, onUsePower, disabled,
}) => {
  const [inventory, setInventory] = useState(loadInventory);
  const [cooldownTick, setCooldownTick] = useState(0);
  const [targeting, setTargeting] = useState<PowerId | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Refresh cooldown display every second
  useEffect(() => {
    const t = setInterval(() => setCooldownTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const opponents = players.filter(p => p.id !== myId && p.status === "active");
  const selfTargeting: PowerId[] = ["shield", "double_xp"];

  function handlePowerClick(powerId: PowerId) {
    if (disabled || isOnCooldown(powerId)) return;
    const count = inventory.find(i => i.powerId === powerId)?.count ?? 0;
    if (count <= 0) {
      showToast("No charges left!");
      return;
    }

    const def = POWERS[powerId];
    if (def.targetsSelf || selfTargeting.includes(powerId)) {
      // Self-targeting — use immediately
      firepower(powerId, null);
    } else {
      if (opponents.length === 1) {
        // Only one opponent — auto-target
        firepower(powerId, opponents[0].id);
      } else {
        // Show target picker
        setTargeting(powerId);
      }
    }
  }

  function firepower(powerId: PowerId, targetId: string | null) {
    const ok = consumePower(powerId);
    if (!ok) { showToast("No charges!"); return; }
    setCooldown(powerId);
    setInventory(loadInventory());
    setTargeting(null);
    sfx.click();
    onUsePower(powerId, targetId);
    showToast(`${POWERS[powerId].icon} ${POWERS[powerId].name} activated!`);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  const availablePowers = inventory.filter(i => i.count > 0);
  if (availablePowers.length === 0) return null;

  return (
    <div className="relative">
      {/* Power chips */}
      <div className="flex gap-2 flex-wrap justify-center">
        {availablePowers.map(({ powerId, count }) => {
          const def = POWERS[powerId];
          const onCd = isOnCooldown(powerId);
          const cdMs = getCooldownRemaining(powerId);
          const cdSec = Math.ceil(cdMs / 1000);
          const canUse = !disabled && !onCd && count > 0;

          return (
            <motion.button
              key={powerId}
              whileTap={canUse ? buttonTap : {}}
              onClick={() => handlePowerClick(powerId)}
              disabled={!canUse}
              title={`${def.name}: ${def.description}`}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-headline font-black uppercase tracking-widest transition-all select-none ${
                canUse
                  ? "cursor-pointer hover:brightness-125"
                  : "cursor-not-allowed opacity-40"
              }`}
              style={{
                borderColor: canUse ? def.color : "#2a2a2a",
                backgroundColor: canUse ? `${def.color}18` : "transparent",
                color: canUse ? def.color : "#3a3a3a",
              }}
            >
              <span className="text-[14px]">{def.icon}</span>
              <span>{def.name}</span>
              {/* Charge count */}
              <span
                className="ml-0.5 w-4 h-4 flex items-center justify-center text-[9px] font-black"
                style={{ backgroundColor: def.color, color: "#0a0a0a" }}
              >
                {count}
              </span>
              {/* Cooldown overlay */}
              {onCd && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="font-mono font-bold text-[10px] text-white">{cdSec}s</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Target picker modal */}
      <AnimatePresence>
        {targeting && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-[#141414] border border-[#3a3a3a] p-3 min-w-[180px]"
          >
            <p className="text-[9px] font-headline font-bold text-[#5a5a5a] uppercase tracking-widest mb-2 text-center">
              Target opponent
            </p>
            <div className="flex flex-col gap-1.5">
              {opponents.map(p => (
                <button
                  key={p.id}
                  onClick={() => firepower(targeting, p.id)}
                  className="px-3 py-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white font-headline font-bold text-[11px] uppercase tracking-wide text-left transition-colors"
                >
                  {p.username}
                </button>
              ))}
              <button
                onClick={() => setTargeting(null)}
                className="px-3 py-1.5 text-[#5a5a5a] font-headline font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors text-center"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1e1e1e] border border-[#3a3a3a] px-3 py-1 text-[10px] font-headline font-bold text-[#cafd00] uppercase tracking-widest pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
