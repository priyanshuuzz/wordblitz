// ── Missions Screen ───────────────────────────────────────────────────────
import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Target, Check, Coins } from "lucide-react";
import {
  getDailyMissions, getWeeklyMissions,
  claimMission, type MissionId,
} from "../../lib/missions";
import { sfx } from "../../lib/sound";
import { listContainerVariants, listItemVariants } from "../../lib/animations";

export const MissionsScreen: React.FC = () => {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const [claimed, setClaimed] = useState<Set<MissionId>>(new Set());
  const [xpToast, setXpToast] = useState<string | null>(null);

  const missions = tab === "daily" ? getDailyMissions() : getWeeklyMissions();

  const handleClaim = useCallback((id: MissionId) => {
    const reward = claimMission(id);
    if (!reward) return;
    sfx.achievement?.();
    setClaimed(prev => new Set([...prev, id]));
    setXpToast(`+${reward.xp} XP  +${reward.coins} Coins`);
    setTimeout(() => setXpToast(null), 2000);
  }, []);

  // Time until reset
  const now = new Date();
  const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
  const dailyMs = midnight.getTime() - now.getTime();
  const dailyHrs = Math.floor(dailyMs / 3_600_000);
  const dailyMin = Math.floor((dailyMs % 3_600_000) / 60_000);

  const completedCount = missions.filter(m => m.progress.completed).length;
  const totalCount     = missions.length;

  return (
    <div className="flex flex-col pb-6 relative">
      {/* XP toast */}
      {xpToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-[#cafd00] text-[#516700] font-headline font-black text-[13px] uppercase tracking-widest px-5 py-2 pointer-events-none"
        >
          {xpToast}
        </motion.div>
      )}

      {/* Header */}
      <div className="px-5 pt-6 pb-5 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-[#ff51fa]" />
            <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-[#ff51fa]">
              Missions
            </h2>
          </div>
          <span className="text-[10px] font-headline font-bold text-[#5a5a5a] uppercase tracking-widest">
            Resets in {dailyHrs}h {dailyMin}m
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-headline font-bold uppercase tracking-widest">
            <span className="text-[#5a5a5a]">{completedCount} / {totalCount} complete</span>
            <span className="text-[#ff51fa]">{Math.round((completedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-[3px] bg-[#1e1e1e] w-full overflow-hidden">
            <motion.div
              animate={{ width: `${(completedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.6 }}
              className="h-full bg-[#ff51fa]"
              style={{ boxShadow: "0 0 8px rgba(255,81,250,0.5)" }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a1a1a]">
        {(["daily", "weekly"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 font-headline font-black text-[10px] uppercase tracking-widest transition-all ${
              tab === t ? "bg-[#ff51fa] text-[#400040]" : "text-[#5a5a5a] hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Mission list */}
      <motion.div
        key={tab}
        variants={listContainerVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-2 px-4 pt-4"
      >
        {missions.map(({ def, progress }) => {
          const pct = Math.min(100, (progress.progress / def.target) * 100);
          const canClaim = progress.completed && !progress.claimedAt && !claimed.has(def.id);
          const isClaimed = !!progress.claimedAt || claimed.has(def.id);

          return (
            <motion.div
              key={def.id}
              variants={listItemVariants}
              className={`p-4 border-l-4 transition-all ${
                isClaimed
                  ? "bg-[#0f0f0f] border-l-[#2a2a2a] opacity-50"
                  : progress.completed
                  ? "bg-[#141414] border-l-[#ff51fa]"
                  : "bg-[#141414] border-l-[#1e1e1e]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Icon + info */}
                <div className="flex items-start gap-3 flex-grow min-w-0">
                  <span className="text-xl flex-shrink-0 mt-0.5">{def.icon}</span>
                  <div className="flex-grow min-w-0">
                    <p className="font-headline font-black text-[13px] uppercase tracking-tight text-white">
                      {def.title}
                    </p>
                    <p className="text-[10px] text-[#5a5a5a] mt-0.5">{def.description}</p>

                    {/* Progress bar */}
                    {!isClaimed && (
                      <div className="mt-2 space-y-1">
                        <div className="h-[2px] bg-[#1e1e1e] w-full overflow-hidden">
                          <motion.div
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-[#ff51fa]"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-[#5a5a5a]">
                          {progress.progress} / {def.target}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reward + claim */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-headline font-bold text-[#cafd00] uppercase">
                    +{def.rewardXp} XP
                  </span>
                  <span className="text-[9px] font-bold text-[#ffd166]">
                    +{def.rewardCoins} 🪙
                  </span>

                  {canClaim && (
                    <button
                      onClick={() => handleClaim(def.id)}
                      className="mt-1 px-3 py-1 bg-[#ff51fa] text-[#400040] font-headline font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
                    >
                      Claim
                    </button>
                  )}
                  {isClaimed && (
                    <div className="mt-1 flex items-center gap-1 text-[#3a3a3a]">
                      <Check size={12} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Done</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
