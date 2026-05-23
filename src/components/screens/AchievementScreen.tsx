// ── Achievement Screen ────────────────────────────────────────────────────
import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Trophy, Lock } from "lucide-react";
import {
  ACHIEVEMENTS, loadUnlocked,
  type AchievementDef, type AchievementId,
} from "../../lib/achievements";
import { listContainerVariants, listItemVariants } from "../../lib/animations";

const RARITY_COLOR: Record<string, string> = {
  common:    "#8a8a8a",
  rare:      "#cafd00",
  epic:      "#ff51fa",
  legendary: "#ffd166",
};

const RARITY_ORDER = ["legendary", "epic", "rare", "common"];

export const AchievementScreen: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const unlocked = useMemo(() => new Set(loadUnlocked().map(u => u.id)), []);

  const sorted = useMemo(() => {
    return (Object.values(ACHIEVEMENTS) as AchievementDef[])
      .sort((a, b) => {
        // Unlocked first, then by rarity
        const aU = unlocked.has(a.id) ? 0 : 1;
        const bU = unlocked.has(b.id) ? 0 : 1;
        if (aU !== bU) return aU - bU;
        return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
      });
  }, [unlocked]);

  const filtered = sorted.filter(a => {
    if (filter === "unlocked") return unlocked.has(a.id);
    if (filter === "locked")   return !unlocked.has(a.id);
    return true;
  });

  const unlockedCount = unlocked.size;
  const totalCount    = sorted.length;
  const pct           = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="flex flex-col pb-6">
      {/* Header */}
      <div className="px-5 pt-6 pb-5 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-[#cafd00]" />
          <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-[#cafd00]">
            Achievements
          </h2>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-headline font-bold uppercase tracking-widest">
            <span className="text-[#5a5a5a]">{unlockedCount} / {totalCount} unlocked</span>
            <span className="text-[#cafd00]">{pct}%</span>
          </div>
          <div className="h-[3px] bg-[#1e1e1e] w-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-[#cafd00]"
              style={{ boxShadow: "0 0 8px rgba(202,253,0,0.5)" }}
            />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-[#1a1a1a]">
        {(["all", "unlocked", "locked"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-3 font-headline font-black text-[10px] uppercase tracking-widest transition-all ${
              filter === f ? "bg-[#cafd00] text-[#516700]" : "text-[#5a5a5a] hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Achievement list */}
      <motion.div
        variants={listContainerVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-1.5 px-4 pt-4"
      >
        {filtered.map(def => {
          const isUnlocked = unlocked.has(def.id);
          const color = RARITY_COLOR[def.rarity];

          return (
            <motion.div
              key={def.id}
              variants={listItemVariants}
              className={`flex items-center gap-4 p-4 border-l-4 transition-all ${
                isUnlocked
                  ? "bg-[#141414] border-l-[#cafd00]"
                  : "bg-[#0f0f0f] border-l-[#1e1e1e] opacity-60"
              }`}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 flex items-center justify-center text-2xl flex-shrink-0 border"
                style={{
                  borderColor: isUnlocked ? color : "#1e1e1e",
                  backgroundColor: isUnlocked ? `${color}18` : "transparent",
                }}
              >
                {isUnlocked ? def.icon : <Lock size={16} className="text-[#3a3a3a]" />}
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-headline font-black text-[13px] uppercase tracking-tight text-white truncate">
                    {def.title}
                  </span>
                  <span
                    className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 flex-shrink-0"
                    style={{ color, backgroundColor: `${color}18` }}
                  >
                    {def.rarity}
                  </span>
                </div>
                <p className="text-[10px] text-[#5a5a5a] leading-tight">{def.description}</p>
              </div>

              {/* XP reward */}
              <div className="flex-shrink-0 text-right">
                <span
                  className="font-headline font-black text-[12px]"
                  style={{ color: isUnlocked ? "#cafd00" : "#3a3a3a" }}
                >
                  +{def.xp} XP
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
