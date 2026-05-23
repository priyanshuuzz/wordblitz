// ── Stats Screen ─────────────────────────────────────────────────────────
// Match analytics dashboard — response times, letter usage, win rates.

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { BarChart2, Zap, Clock, Target, TrendingUp } from "lucide-react";
import { getAllReplays, getReplayStats } from "../../replay/replayRecorder";
import { loadStats } from "../../lib/achievements";
import { gridContainerVariants, gridItemVariants } from "../../lib/animations";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const StatsScreen: React.FC = () => {
  const replays = useMemo(() => getAllReplays(), []);
  const stats   = useMemo(() => loadStats(), []);

  // Aggregate across all replays
  const aggregate = useMemo(() => {
    let totalWords    = 0;
    let totalMs       = 0;
    let msCount       = 0;
    let fastestMs     = Infinity;
    const letterFreq: Record<string, number> = {};
    const wordLengths: number[] = [];

    for (const r of replays) {
      const s = getReplayStats(r);
      totalWords += r.totalWords;
      if (s.avgResponseMs > 0) { totalMs += s.avgResponseMs; msCount++; }
      if (s.fastestWordMs > 0 && s.fastestWordMs < fastestMs) fastestMs = s.fastestWordMs;

      for (const w of r.wordChain) {
        wordLengths.push(w.length);
        for (const c of w.toUpperCase()) {
          if (/[A-Z]/.test(c)) letterFreq[c] = (letterFreq[c] ?? 0) + 1;
        }
      }
    }

    const avgResponseMs = msCount > 0 ? Math.round(totalMs / msCount) : 0;
    const avgWordLen    = wordLengths.length
      ? Math.round((wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length) * 10) / 10
      : 0;

    // Top 5 most used letters
    const topLetters = Object.entries(letterFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([l]) => l);

    // Weakest letters (least used)
    const weakLetters = ALPHABET
      .filter(l => (letterFreq[l] ?? 0) === 0)
      .slice(0, 5);

    const maxFreq = Math.max(...Object.values(letterFreq), 1);

    return {
      totalWords, avgResponseMs, fastestMs: fastestMs === Infinity ? 0 : fastestMs,
      avgWordLen, topLetters, weakLetters, letterFreq, maxFreq,
    };
  }, [replays]);

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.totalWins / stats.gamesPlayed) * 100)
    : 0;

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-5 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-[#cafd00]" />
          <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-[#cafd00]">
            Stats
          </h2>
        </div>
        <p className="text-[10px] text-[#5a5a5a] mt-1 uppercase tracking-widest font-bold">
          Based on {replays.length} saved replays
        </p>
      </div>

      {/* Key metrics grid */}
      <motion.div
        variants={gridContainerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 px-4 pt-5"
      >
        {[
          { label: "Win Rate",      value: `${winRate}%`,                          icon: <Target size={14} />,    color: "text-[#cafd00]" },
          { label: "Total Wins",    value: String(stats.totalWins),                icon: <TrendingUp size={14} />, color: "text-[#cafd00]" },
          { label: "Best Streak",   value: String(stats.bestWinStreak),            icon: <Zap size={14} />,       color: "text-[#ff51fa]" },
          { label: "Avg Response",  value: aggregate.avgResponseMs ? `${aggregate.avgResponseMs}ms` : "—", icon: <Clock size={14} />, color: "text-white" },
          { label: "Fastest Word",  value: aggregate.fastestMs ? `${aggregate.fastestMs}ms` : "—",         icon: <Zap size={14} />,   color: "text-[#ffd166]" },
          { label: "Avg Word Len",  value: aggregate.avgWordLen ? `${aggregate.avgWordLen}L` : "—",         icon: <BarChart2 size={14} />, color: "text-white" },
        ].map(s => (
          <motion.div
            key={s.label}
            variants={gridItemVariants}
            className="bg-[#141414] border border-[#1e1e1e] p-4 flex flex-col gap-1"
          >
            <div className={`flex items-center gap-1.5 ${s.color} opacity-70`}>{s.icon}</div>
            <span className={`font-headline font-black text-2xl ${s.color}`}>{s.value}</span>
            <span className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest">{s.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Letter frequency heatmap */}
      <div className="px-4 mt-6">
        <h3 className="font-headline font-bold text-[10px] text-[#5a5a5a] uppercase tracking-widest mb-3">
          Letter Usage Heatmap
        </h3>
        <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
          {ALPHABET.map(l => {
            const freq = aggregate.letterFreq[l] ?? 0;
            const intensity = aggregate.maxFreq > 0 ? freq / aggregate.maxFreq : 0;
            const bg = intensity > 0.7 ? "#cafd00" : intensity > 0.4 ? "#ffd166" : intensity > 0.1 ? "#ff51fa" : "#1e1e1e";
            const textColor = intensity > 0.4 ? "#0a0a0a" : "#5a5a5a";
            return (
              <div
                key={l}
                title={`${l}: ${freq} uses`}
                className="aspect-square flex items-center justify-center font-headline font-black text-[10px] transition-all"
                style={{ backgroundColor: bg, color: textColor }}
              >
                {l}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-2">
          {[
            { color: "#cafd00", label: "High" },
            { color: "#ffd166", label: "Med" },
            { color: "#ff51fa", label: "Low" },
            { color: "#1e1e1e", label: "None" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <div className="w-3 h-3" style={{ backgroundColor: s.color }} />
              <span className="text-[8px] font-bold text-[#5a5a5a] uppercase">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top / weak letters */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-5">
        <div className="bg-[#141414] border border-[#1e1e1e] p-4">
          <p className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest mb-2">Top Letters</p>
          <div className="flex gap-2">
            {aggregate.topLetters.length > 0
              ? aggregate.topLetters.map(l => (
                  <span key={l} className="font-headline font-black text-xl text-[#cafd00]">{l}</span>
                ))
              : <span className="text-[#3a3a3a] text-[11px]">Play more!</span>
            }
          </div>
        </div>
        <div className="bg-[#141414] border border-[#1e1e1e] p-4">
          <p className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest mb-2">Weak Letters</p>
          <div className="flex gap-2">
            {aggregate.weakLetters.length > 0
              ? aggregate.weakLetters.map(l => (
                  <span key={l} className="font-headline font-black text-xl text-[#ff51fa]">{l}</span>
                ))
              : <span className="text-[#3a3a3a] text-[11px]">All covered!</span>
            }
          </div>
        </div>
      </div>

      {/* Games played */}
      <div className="px-4 mt-5">
        <div className="bg-[#141414] border border-[#1e1e1e] p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest">Games Played</p>
            <p className="font-headline font-black text-3xl text-white mt-1">{stats.gamesPlayed}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest">Total Words</p>
            <p className="font-headline font-black text-3xl text-[#cafd00] mt-1">{aggregate.totalWords}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
