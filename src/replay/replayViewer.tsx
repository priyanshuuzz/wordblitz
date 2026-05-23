// ── Replay Viewer ─────────────────────────────────────────────────────────
// Playback UI for a saved MatchReplay.
// Shows timeline, word chain, eliminations, and per-player stats.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Pause, SkipBack, SkipForward, X,
  Trophy, Zap, Clock, ChevronLeft,
} from "lucide-react";
import {
  getAllReplays, getReplayStats, deleteReplay,
  type MatchReplay, type ReplayEvent,
} from "./replayRecorder";
import { sfx } from "../lib/sound";
import { buttonTap } from "../lib/animations";

// ── Replay List ────────────────────────────────────────────────────────────
interface ReplayListProps {
  onSelect: (replay: MatchReplay) => void;
}

export const ReplayList: React.FC<ReplayListProps> = ({ onSelect }) => {
  const [replays, setReplays] = useState<MatchReplay[]>(getAllReplays);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteReplay(id);
    setReplays(getAllReplays());
  };

  if (replays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
        <Play size={32} className="text-[#2a2a2a]" />
        <p className="font-headline font-bold text-[#3a3a3a] text-[11px] uppercase tracking-widest">
          No replays yet — play a match!
        </p>
        <p className="text-[10px] text-[#2a2a2a]">Up to 10 replays are saved automatically.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 pt-4 pb-6">
      {replays.map(r => {
        const stats = getReplayStats(r);
        const durationSec = r.durationMs ? Math.round(r.durationMs / 1000) : 0;
        const date = new Date(r.startedAt).toLocaleDateString();

        return (
          <motion.div
            key={r.id}
            whileTap={buttonTap}
            onClick={() => { sfx.click(); onSelect(r); }}
            className="bg-[#141414] border border-[#1e1e1e] border-l-4 p-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
            style={{ borderLeftColor: r.winnerId ? "#cafd00" : "#ff51fa" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-headline font-black text-[13px] uppercase tracking-tight text-white">
                    {r.mode.toUpperCase()} {r.category ? `· ${r.category}` : ""}
                  </span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 uppercase ${
                    r.winnerId ? "bg-[rgba(202,253,0,0.15)] text-[#cafd00]" : "bg-[rgba(255,81,250,0.15)] text-[#ff51fa]"
                  }`}>
                    {r.winnerId === "me" ? "WIN" : "LOSS"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-[#5a5a5a] font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Clock size={9} />{durationSec}s</span>
                  <span className="flex items-center gap-1"><Zap size={9} />{r.totalWords} words</span>
                  <span>{r.players.length} players</span>
                  <span>{date}</span>
                </div>
              </div>
              <button
                onClick={e => handleDelete(r.id, e)}
                className="text-[#3a3a3a] hover:text-[#ff5c3a] transition-colors p-1 flex-shrink-0"
                title="Delete replay"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ── Replay Player ──────────────────────────────────────────────────────────
interface ReplayPlayerProps {
  replay:  MatchReplay;
  onClose: () => void;
}

export const ReplayPlayer: React.FC<ReplayPlayerProps> = ({ replay, onClose }) => {
  const [eventIdx, setEventIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wordEvents = replay.events.filter(e => e.type === "word_submitted");
  const elimEvents = replay.events.filter(e => e.type === "player_eliminated");
  const stats      = getReplayStats(replay);

  const currentEvent: ReplayEvent | null = replay.events[eventIdx] ?? null;
  const visibleWords = replay.events
    .slice(0, eventIdx + 1)
    .filter(e => e.type === "word_submitted")
    .map(e => String(e.data.word ?? "").toUpperCase());

  const step = useCallback(() => {
    setEventIdx(prev => {
      if (prev >= replay.events.length - 1) {
        setPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [replay.events.length]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(step, 800 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, step]);

  const pct = replay.events.length > 1
    ? Math.round((eventIdx / (replay.events.length - 1)) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0a0a0a]">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-md">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-[#cafd00] hover:bg-[#141414] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-headline font-black text-[11px] text-[#cafd00] uppercase tracking-widest">
            Replay
          </p>
          <p className="text-[9px] text-[#5a5a5a] uppercase tracking-widest">
            {replay.mode} {replay.category ? `· ${replay.category}` : ""}
          </p>
        </div>
        <div className="w-9" />
      </header>

      {/* Players */}
      <div className="flex border-b border-[#1a1a1a] overflow-x-auto no-scrollbar">
        {replay.players.map(p => {
          const isElim = elimEvents.some(e => e.playerId === p.id && replay.events.indexOf(e) <= eventIdx);
          const wordCount = stats.wordsByPlayer[p.id] ?? 0;
          return (
            <div key={p.id} className={`flex-1 min-w-[80px] flex flex-col items-center py-3 px-2 border-r border-[#1a1a1a] last:border-r-0 ${isElim ? "opacity-40" : ""}`}>
              <img src={p.avatar} alt="" className="w-8 h-8 object-cover mb-1" />
              <span className="font-headline font-bold text-[9px] uppercase tracking-wide text-white truncate w-full text-center">
                {p.username}
              </span>
              <span className="text-[8px] text-[#5a5a5a] font-mono">{wordCount}w</span>
            </div>
          );
        })}
      </div>

      {/* Current event display */}
      <div className="flex-grow flex flex-col items-center justify-center px-5 py-6 gap-4">
        <AnimatePresence mode="wait">
          {currentEvent && (
            <motion.div
              key={eventIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              {currentEvent.type === "word_submitted" && (
                <>
                  <p className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest mb-2">
                    {replay.players.find(p => p.id === currentEvent.playerId)?.username ?? "Player"}
                  </p>
                  <p className="font-headline font-black text-[clamp(40px,12vw,64px)] text-[#cafd00] uppercase tracking-tighter">
                    {String(currentEvent.data.word ?? "").toUpperCase()}
                  </p>
                </>
              )}
              {currentEvent.type === "player_eliminated" && (
                <p className="font-headline font-black text-2xl text-[#ff5c3a] uppercase tracking-tighter">
                  💀 {replay.players.find(p => p.id === currentEvent.playerId)?.username} eliminated
                </p>
              )}
              {currentEvent.type === "game_over" && (
                <p className="font-headline font-black text-2xl text-[#cafd00] uppercase tracking-tighter">
                  🏆 Game Over
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Word chain so far */}
        {visibleWords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
            {visibleWords.slice(-12).map((w, i) => (
              <span
                key={i}
                className="font-mono font-bold text-[10px] uppercase px-2 py-0.5 bg-[#141414] border border-[#2a2a2a] text-[#8a8a8a]"
              >
                {w}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-[#1a1a1a] p-4 space-y-3">
        {/* Scrubber */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={replay.events.length - 1}
            value={eventIdx}
            onChange={e => { setPlaying(false); setEventIdx(Number(e.target.value)); }}
            className="w-full h-1.5 bg-[#1e1e1e] rounded-none appearance-none cursor-pointer accent-[#cafd00]"
          />
          <div className="flex justify-between text-[9px] font-mono text-[#3a3a3a]">
            <span>{eventIdx + 1}</span>
            <span>{replay.events.length}</span>
          </div>
        </div>

        {/* Playback buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { setPlaying(false); setEventIdx(0); }}
            className="w-9 h-9 flex items-center justify-center text-[#5a5a5a] hover:text-white transition-colors"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            className="w-12 h-12 flex items-center justify-center bg-[#cafd00] text-[#516700] hover:brightness-110 transition-all"
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={() => { setPlaying(false); setEventIdx(replay.events.length - 1); }}
            className="w-9 h-9 flex items-center justify-center text-[#5a5a5a] hover:text-white transition-colors"
          >
            <SkipForward size={18} />
          </button>
          {/* Speed */}
          <button
            onClick={() => setSpeed(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
            className="px-2 py-1 border border-[#2a2a2a] text-[#cafd00] font-mono font-bold text-[11px] hover:border-[#cafd00] transition-colors"
          >
            {speed}×
          </button>
        </div>

        {/* Stats row */}
        <div className="flex justify-around text-center pt-1 border-t border-[#1a1a1a]">
          {[
            { label: "Words",    value: replay.totalWords },
            { label: "Longest", value: stats.longestWord.toUpperCase() || "—" },
            { label: "Avg ms",  value: stats.avgResponseMs ? `${stats.avgResponseMs}ms` : "—" },
          ].map(s => (
            <div key={s.label}>
              <p className="font-headline font-black text-[13px] text-white">{s.value}</p>
              <p className="text-[8px] font-bold text-[#5a5a5a] uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Replay Screen (container) ──────────────────────────────────────────────
export const ReplayScreen: React.FC = () => {
  const [selected, setSelected] = useState<MatchReplay | null>(null);

  if (selected) {
    return <ReplayPlayer replay={selected} onClose={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-6 pb-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <Play size={18} className="text-[#cafd00]" />
          <h2 className="font-headline font-black text-xl uppercase tracking-tighter text-[#cafd00]">
            Replays
          </h2>
        </div>
        <p className="text-[10px] text-[#5a5a5a] mt-1 uppercase tracking-widest font-bold">
          Last 10 matches saved automatically
        </p>
      </div>
      <ReplayList onSelect={setSelected} />
    </div>
  );
};
