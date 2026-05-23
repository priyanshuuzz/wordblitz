import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Trophy, Calendar, Clock, Users, Zap, ChevronRight,
  Lock, Star, Crown, Target, ArrowLeft,
} from "lucide-react";
import { useGameStore } from "../../store";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/Badge";
import { listContainerVariants, listItemVariants, buttonTap } from "../../lib/animations";
import { sfx } from "../../lib/sound";

interface Tournament {
  id: string;
  name: string;
  description: string;
  status: "live" | "upcoming" | "ended";
  entryFee: number;
  prizePool: string;
  players: number;
  maxPlayers: number;
  startTime: string;
  duration: string;
  format: string;
  minRank: string;
  rewards: { place: string; prize: string }[];
}

const TOURNAMENTS: Tournament[] = [
  {
    id: "t1",
    name: "Neon Storm Open",
    description: "Season 1 flagship tournament. All ranks welcome.",
    status: "live",
    entryFee: 0,
    prizePool: "10,000 XP",
    players: 847,
    maxPlayers: 1024,
    startTime: "Live Now",
    duration: "2h remaining",
    format: "Single Elimination",
    minRank: "Any",
    rewards: [
      { place: "1st", prize: "5,000 XP + Neon Crown" },
      { place: "2nd", prize: "2,500 XP + Storm Frame" },
      { place: "3rd", prize: "1,000 XP + Silver Badge" },
      { place: "Top 16", prize: "250 XP" },
    ],
  },
  {
    id: "t2",
    name: "Diamond League",
    description: "Exclusive tournament for Diamond+ players.",
    status: "upcoming",
    entryFee: 500,
    prizePool: "50,000 XP + Gems",
    players: 64,
    maxPlayers: 128,
    startTime: "Starts in 3h",
    duration: "4 hours",
    format: "Double Elimination",
    minRank: "Diamond",
    rewards: [
      { place: "1st", prize: "25,000 XP + 10 💎 + Exclusive Title" },
      { place: "2nd", prize: "12,500 XP + 5 💎" },
      { place: "3rd", prize: "5,000 XP + 2 💎" },
      { place: "Top 8", prize: "1,000 XP" },
    ],
  },
  {
    id: "t3",
    name: "Speed Blitz Cup",
    description: "5-second turns only. Pure reflexes.",
    status: "upcoming",
    entryFee: 200,
    prizePool: "20,000 XP",
    players: 0,
    maxPlayers: 256,
    startTime: "Starts in 6h",
    duration: "3 hours",
    format: "Round Robin",
    minRank: "Gold",
    rewards: [
      { place: "1st", prize: "10,000 XP + Speed Demon Title" },
      { place: "2nd", prize: "5,000 XP" },
      { place: "3rd", prize: "2,000 XP" },
    ],
  },
  {
    id: "t4",
    name: "Weekly Grind",
    description: "Last week's champion: CRYPTIC_KING",
    status: "ended",
    entryFee: 0,
    prizePool: "5,000 XP",
    players: 512,
    maxPlayers: 512,
    startTime: "Ended",
    duration: "Completed",
    format: "Single Elimination",
    minRank: "Any",
    rewards: [
      { place: "1st", prize: "2,500 XP + Weekly Badge" },
      { place: "2nd", prize: "1,000 XP" },
      { place: "3rd", prize: "500 XP" },
    ],
  },
];

const statusConfig = {
  live:     { label: "Live",     color: "primary" as const,   dot: "bg-[#cafd00]"  },
  upcoming: { label: "Upcoming", color: "warning" as const,   dot: "bg-[#ffd166]"  },
  ended:    { label: "Ended",    color: "muted" as const,     dot: "bg-[#3a3a3a]"  },
};

export const TournamentScreen: React.FC = () => {
  const { setGameState } = useGameStore();
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [tab, setTab] = useState<"all" | "live" | "upcoming">("all");

  const filtered = TOURNAMENTS.filter(t =>
    tab === "all" || t.status === tab
  );

  if (selected) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="min-h-[100dvh] bg-[#0a0a0a] pt-16 pb-8"
      >
        <div className="px-4 pt-4 pb-6">
          <button onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-[#cafd00] font-headline font-bold text-[11px] uppercase tracking-widest mb-6 hover:brightness-125 transition-all">
            <ArrowLeft size={14} /> Back
          </button>

          {/* Hero */}
          <div className={`p-6 border-2 mb-6 relative overflow-hidden ${
            selected.status === "live" ? "border-[#cafd00] bg-[rgba(202,253,0,0.04)]" :
            selected.status === "upcoming" ? "border-[#ffd166] bg-[rgba(255,209,102,0.04)]" :
            "border-[#2a2a2a] bg-[#141414]"
          }`}>
            {selected.status === "live" && <div className="absolute inset-0 shimmer pointer-events-none opacity-20" />}
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${statusConfig[selected.status].dot}`} />
                <StatusBadge label={statusConfig[selected.status].label} color={statusConfig[selected.status].color} />
                {selected.entryFee === 0 && <StatusBadge label="Free Entry" color="success" />}
              </div>
              <h1 className="font-headline font-black text-3xl uppercase tracking-tighter mb-2">{selected.name}</h1>
              <p className="text-[#8a8a8a] text-[12px] mb-4">{selected.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Prize Pool", value: selected.prizePool, icon: <Trophy size={12} /> },
                  { label: "Format",     value: selected.format,    icon: <Target size={12} /> },
                  { label: "Players",    value: `${selected.players}/${selected.maxPlayers}`, icon: <Users size={12} /> },
                  { label: "Min Rank",   value: selected.minRank,   icon: <Crown size={12} /> },
                ].map(s => (
                  <div key={s.label} className="bg-[#0f0f0f] border border-[#1e1e1e] p-3">
                    <div className="flex items-center gap-1.5 text-[#5a5a5a] mb-1">{s.icon}<span className="text-[9px] font-bold uppercase tracking-widest">{s.label}</span></div>
                    <p className="font-headline font-black text-[13px] uppercase">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rewards */}
          <div className="mb-6">
            <h3 className="font-headline font-bold text-[10px] text-[#5a5a5a] uppercase tracking-widest mb-3">Prize Distribution</h3>
            <div className="space-y-2">
              {selected.rewards.map((r, i) => (
                <div key={i} className={`flex items-center justify-between p-3 border-l-4 ${
                  i === 0 ? "bg-[rgba(255,215,0,0.06)] border-[#ffd700]" :
                  i === 1 ? "bg-[rgba(192,192,192,0.06)] border-[#c0c0c0]" :
                  i === 2 ? "bg-[rgba(205,127,50,0.06)] border-[#cd7f32]" :
                  "bg-[#141414] border-[#2a2a2a]"
                }`}>
                  <span className={`font-headline font-black text-[13px] uppercase ${
                    i === 0 ? "text-[#ffd700]" : i === 1 ? "text-[#c0c0c0]" : i === 2 ? "text-[#cd7f32]" : "text-[#8a8a8a]"
                  }`}>{r.place}</span>
                  <span className="font-bold text-[12px] text-white">{r.prize}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {selected.status === "live" && (
            <Button variant="primary" fullWidth size="xl"
              onClick={() => { sfx.matchFound(); setGameState({ status: "matchmaking" }); }}>
              Join Tournament
            </Button>
          )}
          {selected.status === "upcoming" && (
            <Button variant="secondary" fullWidth size="xl"
              className="border-[#ffd166] text-[#ffd166] hover:bg-[rgba(255,209,102,0.08)]"
              onClick={() => { sfx.click(); }}>
              Register — {selected.entryFee === 0 ? "Free" : `${selected.entryFee} 🪙`}
            </Button>
          )}
          {selected.status === "ended" && (
            <Button variant="ghost" fullWidth size="lg" className="border border-[#2a2a2a]" disabled>
              Tournament Ended
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Sub-tabs */}
      <div className="flex w-full bg-[#0f0f0f] border-b border-[#1a1a1a] sticky top-16 z-20">
        {(["all", "live", "upcoming"] as const).map(t => (
          <button key={t} onClick={() => { sfx.click(); setTab(t); }}
            className={`flex-1 py-3.5 font-headline font-black text-[10px] tracking-widest uppercase transition-all ${
              tab === t ? "bg-[#cafd00] text-[#516700]" : "text-[#5a5a5a] hover:text-white"
            }`}>
            {t}
          </button>
        ))}
      </div>

      <motion.div variants={listContainerVariants} initial="initial" animate="animate"
        className="flex flex-col gap-3 p-4 pb-8">
        {filtered.map(t => (
          <motion.button key={t.id} variants={listItemVariants} whileTap={buttonTap}
            onClick={() => { sfx.click(); setSelected(t); }}
            className={`w-full text-left p-5 border-2 transition-all relative overflow-hidden ${
              t.status === "live"     ? "border-[#cafd00] bg-[rgba(202,253,0,0.03)] hover:bg-[rgba(202,253,0,0.06)]" :
              t.status === "upcoming" ? "border-[#1e1e1e] bg-[#141414] hover:border-[#ffd166]" :
              "border-[#1e1e1e] bg-[#0f0f0f] opacity-60"
            }`}>
            {t.status === "live" && <div className="absolute inset-0 shimmer pointer-events-none opacity-10" />}
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusConfig[t.status].dot} ${t.status === "live" ? "animate-pulse" : ""}`} />
                  <StatusBadge label={statusConfig[t.status].label} color={statusConfig[t.status].color} />
                  {t.entryFee === 0 && <StatusBadge label="Free" color="success" />}
                </div>
                <ChevronRight size={14} className="text-[#5a5a5a]" />
              </div>
              <h3 className="font-headline font-black text-lg uppercase tracking-tighter mb-1">{t.name}</h3>
              <p className="text-[#5a5a5a] text-[11px] mb-4">{t.description}</p>
              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1.5 text-[#cafd00]">
                  <Trophy size={11} /><span className="font-bold">{t.prizePool}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#8a8a8a]">
                  <Users size={11} /><span>{t.players}/{t.maxPlayers}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#8a8a8a]">
                  <Clock size={11} /><span>{t.startTime}</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};
