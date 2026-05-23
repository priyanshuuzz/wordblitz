import React, { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, RefreshCcw, Trophy, Zap, Pause, Lightbulb,
  Keyboard, Settings,
} from "lucide-react";
import { useGameStore } from "../../store";
import socket from "../../socket";
import { WordChain } from "./WordChain";
import { PlayerCard } from "./PlayerCard";
import { TimerBar } from "../ui/ProgressBar";
import { Button } from "../ui/Button";
import { shakeVariants, buttonTap } from "../../lib/animations";
import { sfx } from "../../lib/sound";
import { launchConfetti } from "../../lib/confetti";
import { validateCategoryWord, type CategoryId } from "../../lib/categoryWords";
import { getAIWordHints } from "../../lib/ai";
import { processWord, resetCombo, createComboState, type ComboState, type ComboResult } from "../../lib/combo";
import { checkMatchAchievements } from "../../lib/achievements";
import { updateMissionsAfterMatch } from "../../lib/missions";
import { startRecording, stopRecording, recordEvent } from "../../replay/replayRecorder";
import { ComboOverlay, ComboStrip } from "./ComboOverlay";
import { PowerPanel } from "./PowerPanel";
import { decideBotWord, getBotTaunt } from "../../ai/botDecisionEngine";
import { randomPersonality, getProfile } from "../../ai/botProfiles";
import type { PowerId } from "../../lib/powers";

// ── Exit modal ─────────────────────────────────────────────────────────────
const ExitModal = ({ onResume, onExit, onForfeit }: {
  onResume: () => void; onExit: () => void; onForfeit: () => void;
}) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
    <motion.div initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 8 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative w-full max-w-[300px] bg-[#141414] border border-[#3a3a3a] border-l-4 border-l-[#ff51fa] p-7 flex flex-col gap-5">
      <div>
        <h2 className="font-headline font-black text-lg text-[#cafd00] uppercase tracking-tight">Game Paused</h2>
        <p className="text-[#8a8a8a] text-[12px] mt-1.5 leading-relaxed">
          Leaving counts as a <span className="text-white font-bold">LOSS</span>.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="primary" fullWidth onClick={onResume} className="h-12">Resume Game</Button>
        <Button variant="secondary" fullWidth onClick={onExit}
          className="h-11 border-[#ff51fa] text-[#ff51fa] hover:bg-[rgba(255,81,250,0.08)]">Exit to Home</Button>
        <Button variant="ghost" fullWidth onClick={onForfeit}
          className="h-10 text-[11px] text-[#5a5a5a] border border-dashed border-[#3a3a3a] hover:text-[#8a8a8a]">
          Forfeit & Spectate
        </Button>
      </div>
    </motion.div>
  </div>
);

// ── Hint system ────────────────────────────────────────────────────────────
const HINT_WORDS: Record<string, string[]> = {
  A:["apple","anchor","arrow","arch","asset"],B:["brave","blade","blast","bloom","bound"],
  C:["chain","charm","chase","clear","climb"],D:["dawn","dock","draft","drive","dune"],
  E:["eagle","earth","elder","elite","enter"],F:["flame","flash","fleet","float","forge"],
  G:["gold","gate","glow","grace","grand"],H:["horse","heart","hill","honor","heavy"],
  I:["image","index","inner","issue","ideal"],J:["judge","juice","jewel","joint","joker"],
  K:["king","keen","karma","knife","knock"],L:["light","lance","level","learn","laser"],
  M:["moon","mist","mind","mode","magic"],N:["noble","nerve","night","north","novel"],
  O:["ocean","order","orbit","olive","onset"],P:["pulse","phase","prime","power","paint"],
  Q:["quest","quick","quote","queen","quota"],R:["river","rope","rise","realm","rapid"],
  S:["spark","stone","surge","smart","scale"],T:["tower","trace","trust","trail","theme"],
  U:["under","union","ultra","unite","upper"],V:["voice","vivid","vapor","valid","verse"],
  W:["wave","wind","world","watch","water"],X:["xenon","xray"],
  Y:["yield","young","yacht","yearn","youth"],Z:["zebra","zone","zenith","zeal","zest"],
};

function getHint(lastWord: string, usedWords: string[]): string | null {
  const lc = lastWord.slice(-1).toUpperCase();
  const candidates = (HINT_WORDS[lc] ?? []).filter(w => !usedWords.includes(w.toLowerCase()));
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * Math.min(3, candidates.length))].toUpperCase();
}

// ── Bot dictionary ─────────────────────────────────────────────────────────
const BOT_DICT: Record<string, string[]> = {
  A:["apple","anchor","arrow"],B:["brave","blade","blast"],C:["chain","charm","chase"],
  D:["dawn","dock","draft"],E:["eagle","earth","elite"],F:["flame","flash","fleet"],
  G:["gold","gate","grace"],H:["horse","heart","honor"],I:["image","inner","ideal"],
  J:["judge","juice","jewel"],K:["king","keen","karma"],L:["light","lance","level"],
  M:["moon","mist","mode"],N:["noble","nerve","night"],O:["ocean","order","orbit"],
  P:["pulse","phase","prime"],Q:["quest","quick","quote"],R:["river","rope","rise"],
  S:["spark","stone","surge"],T:["tower","trace","trust"],U:["under","union","ultra"],
  V:["voice","vivid","vapor"],W:["wave","wind","world"],X:["xray","xenon"],
  Y:["yield","young","yacht"],Z:["zebra","zone","zenith"],
};
const wordCache: Record<string, string[]> = {};

// ── Main GameBoard component ───────────────────────────────────────────────
export const GameBoard: React.FC = () => {
  const {
    players, currentTurnId, lastWord, usedWords, setGameState,
    avatar, username, uid, isPaused, isSpectating, resetGame,
    turnDuration, turnDeadline, selectedCategory,
  } = useGameStore();

  const [input, setInput] = useState("");
  const [showFlash, setShowFlash] = useState(false);
  const [elimToast, setElimToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [xpFloat, setXpFloat] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintList, setHintList] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [matchTime, setMatchTime] = useState(0);
  const [turnTimer, setTurnTimer] = useState(turnDuration / 1000);

  // ── Combo state ──────────────────────────────────────────────────────────
  const [comboState, setComboState] = useState<ComboState>(createComboState());
  const [lastComboResult, setLastComboResult] = useState<ComboResult | null>(null);
  const [showCombo, setShowCombo] = useState(false);
  const comboHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Replay / achievement tracking ────────────────────────────────────────
  const fastestWordMsRef  = useRef<number>(Infinity);
  const maxComboRef       = useRef<number>(0);
  const recordingRef      = useRef(false);
  const opponentAvgMsRef  = useRef<number>(0);
  const opponentTimesRef  = useRef<number[]>([]);
  // Assign a personality per bot (keyed by player id)
  const botPersonalities  = useRef<Record<string, ReturnType<typeof getProfile>>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTurnRef = useRef(currentTurnId);
  const prevWordRef = useRef(lastWord);
  const confettiLaunchedRef = useRef(false);

  // ── Start replay recording when match begins ───────────────────────────
  useEffect(() => {
    if (!recordingRef.current && players.length > 0) {
      recordingRef.current = true;
      startRecording({
        roomId:   useGameStore.getState().roomId ?? `local_${Date.now()}`,
        mode:     selectedCategory ? "category" : "casual",
        category: selectedCategory,
        players:  players.map(p => ({ id: p.id, uid: p.uid, username: p.username, avatar: p.avatar })),
      });
    }
  }, [players.length]);

  const isMyTurn = currentTurnId === "me" && !isSpectating;
  const lastChar = lastWord.slice(-1).toUpperCase();
  const timerFraction = turnDeadline > 0
    ? Math.max(0, Math.min(1, (turnDeadline - Date.now()) / turnDuration))
    : Math.max(0, Math.min(1, turnTimer / (turnDuration / 1000)));
  const timerColor = timerFraction > 0.6 ? "#cafd00" : timerFraction > 0.3 ? "#ffd166" : timerFraction > 0.1 ? "#ff5c3a" : "#ff2200";

  // Match clock
  useEffect(() => {
    const t = setInterval(() => setMatchTime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setIsExitOpen(true); setGameState({ isPaused: true }); }
      if (e.key === "Tab") { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Focus input on my turn
  useEffect(() => {
    if (isMyTurn && !isPaused) inputRef.current?.focus();
  }, [isMyTurn, lastWord, isPaused]);

  // Reset hint on new turn
  useEffect(() => {
    setHint(null);
    setHintList([]);
    setHintUsed(false);
    setHintLoading(false);
    setInput("");
  }, [lastWord, currentTurnId]);

  // Timer tick
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPaused) return;

    if (prevTurnRef.current !== currentTurnId || prevWordRef.current !== lastWord) {
      setTurnTimer(turnDuration / 1000);
      prevTurnRef.current = currentTurnId;
      prevWordRef.current = lastWord;
    }

    timerRef.current = setInterval(() => {
      if (turnDeadline > 0) {
        const rem = Math.max(0, (turnDeadline - Date.now()) / 1000);
        setTurnTimer(rem);
        // Sound cues
        if (rem <= 3 && rem > 0) sfx.timerCritical();
        else if (rem <= 5 && rem > 3 && Math.floor(rem) !== Math.floor(rem + 0.1)) sfx.tick();
        if (rem === 0) handleElim();
      } else {
        setTurnTimer(p => {
          const n = Math.max(0, p - 0.1);
          if (n <= 3 && n > 0 && Math.floor(n) !== Math.floor(p)) sfx.timerCritical();
          if (n === 0) handleElim();
          return n;
        });
      }
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lastWord, currentTurnId, isPaused, turnDuration, turnDeadline]);

  function handleElim() {
    if (timerRef.current) clearInterval(timerRef.current);
    const cp = players.find(p => p.id === currentTurnId);
    if (!cp || cp.status !== "active") return;

    // In a private room, only the player whose turn it is handles their own timeout
    const { roomId, uid: myUid } = useGameStore.getState();
    if (roomId && cp.id !== "me") return; // other player's client handles their own timeout

    sfx.eliminated();
    setElimToast(`${cp.username} eliminated!`);
    setTimeout(() => setElimToast(null), 2500);
    setComboState(prev => resetCombo(prev));
    setShowCombo(false);
    recordEvent("player_eliminated", cp.id, { reason: "timeout" });

    const remainingAfterElim = players.filter(p => p.status === "active" && p.id !== currentTurnId);

    // Private room — sync elimination via Firestore
    if (roomId) {
      const nextPlayer = remainingAfterElim[0];
      const nextUid = nextPlayer?.uid ?? null;
      const winnerUid = remainingAfterElim.length <= 1 ? (nextPlayer?.uid ?? null) : null;
      import("../../lib/privateRoom").then(({ eliminateAndAdvance }) => {
        eliminateAndAdvance(roomId, nextUid, winnerUid, turnDuration, usedWords).catch(console.error);
      });
      return;
    }

    // Local mode below
    setGameState({
      players: players.map(p =>
        p.id === currentTurnId ? { ...p, status: "eliminated" as const } : p
      ),
    });
    const remaining = remainingAfterElim;
    if (remaining.length <= 1) {
      const winner = remaining[0];
      if (winner?.id === "me") { sfx.victory(); launchConfetti(); }
      else sfx.defeat();

      // Stop replay + check achievements + update missions
      const replay = stopRecording(winner?.id ?? null);
      recordingRef.current = false;
      const longestWord = usedWords.reduce((a, b) => b.length > a.length ? b : a, "");
      const isWon = winner?.id === "me";
      checkMatchAchievements({
        won:           isWon,
        wordCount:     usedWords.length,
        longestWord,
        fastestWordMs: fastestWordMsRef.current === Infinity ? 0 : fastestWordMsRef.current,
        playerCount:   players.length,
        isCategory:    !!selectedCategory,
        comboMax:      maxComboRef.current,
      });
      updateMissionsAfterMatch({
        won:          isWon,
        wordCount:    usedWords.length,
        longestWord,
        speedWords:   0,   // tracked server-side; 0 for local
        isCategory:   !!selectedCategory,
        withFriend:   false,
        winStreak:    isWon ? 1 : 0,
      });

      setTimeout(() => setGameState({
        status: "finished",
        winnerId: winner?.id === "me" ? "me" : (winner?.id ?? null),
        lastMatchXp: winner?.id === "me" ? 100 : 25,
        lastMatchMmrDelta: winner?.id === "me" ? 18 : -18,
      }), 1200);
    } else {
      const activeIds = players.filter(p => p.status === "active" && p.id !== currentTurnId).map(p => p.id);
      const nextId = activeIds[0] ?? "me";
      setGameState({ currentTurnId: nextId, turnDeadline: Date.now() + turnDuration });
    }
  }

  // ── Bot AI — only runs in local/solo games, NOT in private rooms ─────────
  useEffect(() => {
    // Skip bot entirely when playing in a private room (real players via Firestore)
    const { roomId } = useGameStore.getState();
    if (roomId) return;

    if (isMyTurn || !currentTurnId || isPaused) return;
    const cp = players.find(p => p.id === currentTurnId);
    if (!cp || cp.status !== "active") return;

    // Assign personality on first encounter
    if (!botPersonalities.current[cp.id]) {
      botPersonalities.current[cp.id] = getProfile(randomPersonality());
    }
    const profile = botPersonalities.current[cp.id];

    setBotThinking(true);
    let cancelled = false;

    decideBotWord(profile, lastWord, usedWords, selectedCategory, opponentAvgMsRef.current)
      .then(({ word, delayMs, isMistake }) => {
        if (cancelled) return;
        setBotThinking(false);

        const fire = () => {
          if (cancelled) return;
          if (isMistake || !word) {
            handleElim();
            return;
          }
          const newUsed = [...usedWords, word.toLowerCase()];
          sfx.wordAccepted();
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 600);
          recordEvent("word_submitted", cp.id, { word: word.toLowerCase() });

          const activeIds = players.filter(p => p.status === "active").map(p => p.id);
          const myIdx = activeIds.indexOf(currentTurnId);
          const nextId = activeIds[(myIdx + 1) % activeIds.length] ?? "me";
          setGameState({ lastWord: word, usedWords: newUsed, currentTurnId: nextId, turnDeadline: Date.now() + turnDuration });
        };

        setTimeout(fire, delayMs);
      })
      .catch(() => {
        if (!cancelled) { setBotThinking(false); handleElim(); }
      });

    return () => { cancelled = true; setBotThinking(false); };
  }, [currentTurnId, lastWord, isPaused]);

  function validateWord(w: string): { valid: boolean; reason?: string } {
    const word = w.trim().toUpperCase();
    if (word.length < 2) return { valid: false, reason: "Too short" };
    if (!/^[A-Z]+$/.test(word)) return { valid: false, reason: "Letters only" };
    if (lastChar && !word.startsWith(lastChar)) return { valid: false, reason: `Must start with "${lastChar}"` };
    if (usedWords.map(u => u.toUpperCase()).includes(word)) return { valid: false, reason: "Already used!" };

    // Category validation
    if (selectedCategory) {
      return validateCategoryWord(word.toLowerCase(), lastWord.toLowerCase(), usedWords, selectedCategory as CategoryId);
    }
    return { valid: true };
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!isMyTurn || !input.trim() || isValidating || isPaused) return;

    const word = input.trim().toUpperCase();
    const check = validateWord(word);

    if (!check.valid) {
      sfx.wordRejected();
      setErrorMsg(check.reason ?? "Invalid word");
      setShaking(true);
      setTimeout(() => { setShaking(false); setErrorMsg(null); }, 1500);
      return;
    }

    setIsValidating(true);

    // If connected to server via socket, emit
    const { roomId, players: currentPlayers, uid: myUid } = useGameStore.getState();
    if (roomId && socket.connected) {
      socket.emit("submit_word", { roomId, word: word.toLowerCase() });
      setInput("");
      setIsValidating(false);
      return;
    }

    // Private room via Firestore — sync word to both players
    if (roomId) {
      try {
        const { submitWord } = await import("../../lib/privateRoom");
        const activeIds = currentPlayers.filter(p => p.status === "active").map(p => p.id);
        const myIdx = activeIds.indexOf("me");
        const nextLocalId = activeIds[(myIdx + 1) % activeIds.length] ?? "me";
        // Map local "me" back to real uid for Firestore
        const nextPlayer = currentPlayers.find(p => p.id === nextLocalId);
        const nextUid = nextPlayer?.uid ?? myUid;
        const { turnDuration: td } = useGameStore.getState();
        await submitWord(roomId, word, nextUid, td, usedWords);
        // Firestore onSnapshot will update state for both players
        setInput("");
        setIsValidating(false);
        sfx.wordAccepted();
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 600);
        return;
      } catch (err) {
        console.error("[PrivateRoom] submitWord failed:", err);
        // Fall through to local mode
      }
    }

    // Local mode (no roomId — solo/bot game)
    const newUsed = [...usedWords, word.toLowerCase()];
    sfx.wordAccepted();
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 600);

    // ── Combo processing ────────────────────────────────────────────────
    const { result, nextState } = processWord(word, comboState);
    setComboState(nextState);
    setLastComboResult(result);
    setShowCombo(true);
    if (comboHideTimer.current) clearTimeout(comboHideTimer.current);
    comboHideTimer.current = setTimeout(() => setShowCombo(false), 2200);
    if (nextState.count > maxComboRef.current) maxComboRef.current = nextState.count;

    // Track fastest word + opponent avg ms
    const now = Date.now();
    const delta = comboState.lastWordTime > 0 ? now - comboState.lastWordTime : Infinity;
    if (delta < fastestWordMsRef.current) fastestWordMsRef.current = delta;
    if (delta !== Infinity && delta < 60_000) {
      opponentTimesRef.current.push(delta);
      const times = opponentTimesRef.current.slice(-10);
      opponentAvgMsRef.current = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    }

    // Record to replay
    recordEvent("word_submitted", "me", { word: word.toLowerCase() });

    const xp = result.xp;
    setXpFloat(xp);
    setTimeout(() => setXpFloat(null), 1200);

    const activeIds = players.filter(p => p.status === "active").map(p => p.id);
    const myIdx = activeIds.indexOf("me");
    const nextId = activeIds[(myIdx + 1) % activeIds.length] ?? "me";

    setGameState({
      lastWord: word,
      usedWords: newUsed,
      currentTurnId: nextId,
      turnDeadline: Date.now() + turnDuration,
    });
    setInput("");
    setIsValidating(false);
  }

  async function handleHint() {
    if (hintUsed || !isMyTurn || hintLoading) return;
    sfx.click();
    setHintUsed(true);
    setHintLoading(true);

    try {
      // Try AI hints first (OpenRouter / Gemini)
      const result = await getAIWordHints(lastChar, usedWords, selectedCategory ?? undefined);
      if (result.words.length > 0) {
        setHintList(result.words);
        setHint(result.words[0]);
      } else {
        // Fallback to local static hints
        const local = getHint(lastWord, usedWords);
        setHint(local);
      }
    } catch {
      // Fallback to local static hints on any error
      const local = getHint(lastWord, usedWords);
      setHint(local);
    } finally {
      setHintLoading(false);
    }
  }

  // Cycle through AI hint suggestions
  function cycleHint() {
    if (!hintList.length) return;
    sfx.click();
    const currentIdx = hintList.indexOf(hint ?? "");
    const nextIdx = (currentIdx + 1) % hintList.length;
    setHint(hintList[nextIdx]);
  }

  const mmFormatted = `${String(Math.floor(matchTime / 60)).padStart(2, "0")}:${String(matchTime % 60).padStart(2, "0")}`;

  return (
    <div className={`min-h-[100dvh] flex flex-col bg-[#0a0a0a] relative overflow-hidden ${timerFraction <= 0.1 ? "vignette-danger" : ""}`}>
      {/* Timer bar — top of screen */}
      <TimerBar value={timerFraction} duration={turnDuration / 1000} />

      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-md z-10">
        <motion.button whileTap={buttonTap}
          onClick={() => { sfx.click(); setIsExitOpen(true); setGameState({ isPaused: true }); }}
          className="w-9 h-9 flex items-center justify-center text-[#cafd00] hover:bg-[#141414] transition-colors">
          <Pause size={18} />
        </motion.button>

        {/* Center: last char prompt */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-headline font-bold text-[#5a5a5a] uppercase tracking-[0.3em]">
            {selectedCategory ? selectedCategory.toUpperCase() : "Word Chain"}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono font-bold text-[11px] text-[#5a5a5a]">{mmFormatted}</span>
            <span className="text-[#3a3a3a]">·</span>
            <span className="font-headline font-black text-[13px]" style={{ color: timerColor }}>
              {Math.ceil(turnTimer)}s
            </span>
          </div>
        </div>

        {/* Hint button */}
        <motion.button whileTap={buttonTap}
          onClick={handleHint}
          disabled={hintUsed || !isMyTurn || hintLoading}
          className={`w-9 h-9 flex items-center justify-center transition-colors ${
            hintUsed || !isMyTurn ? "text-[#2a2a2a] cursor-not-allowed" : "text-[#ff51fa] hover:bg-[#141414]"
          }`}
          title="AI hint (once per turn)">
          {hintLoading
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                <RefreshCcw size={16} className="text-[#ff51fa]" />
              </motion.div>
            : <Lightbulb size={18} />
          }
        </motion.button>
      </header>

      {/* Players strip */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-[#1a1a1a] bg-[#0a0a0a]">
        {players.map(p => (
          <PlayerCard
            key={p.id}
            player={p as any}
            isCurrentTurn={p.id === currentTurnId}
            isMe={p.id === "me"}
            isThinking={p.id === currentTurnId && p.id !== "me" && botThinking}
          />
        ))}
      </div>

      {/* Main arena */}
      <main className="flex-grow flex flex-col items-center justify-center px-5 py-6 gap-6 relative">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-grid-dense opacity-40" />
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${timerColor}08 0%, transparent 70%)`,
            transition: "background 300ms ease",
          }} />
        </div>

        {/* Hint display */}
        <AnimatePresence>
          {hint && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
              {/* Main hint */}
              <div className="bg-[rgba(255,81,250,0.12)] border border-[rgba(255,81,250,0.3)] px-4 py-2 flex items-center gap-3">
                <div>
                  <span className="text-[9px] font-headline font-bold text-[#ff51fa] uppercase tracking-widest block mb-0.5">
                    AI Hint {hintList.length > 1 ? `(${hintList.indexOf(hint) + 1}/${hintList.length})` : ""}
                  </span>
                  <span className="font-headline font-black text-[15px] text-white uppercase tracking-tight">{hint}</span>
                </div>
                {/* Cycle button — only shown when AI returned multiple hints */}
                {hintList.length > 1 && (
                  <button onClick={cycleHint}
                    className="text-[#ff51fa] hover:brightness-125 transition-all p-1"
                    title="Next suggestion">
                    <RefreshCcw size={13} />
                  </button>
                )}
              </div>
              {/* All hints as chips */}
              {hintList.length > 1 && (
                <div className="flex gap-1.5 flex-wrap justify-center">
                  {hintList.map((w, i) => (
                    <button key={w} onClick={() => { sfx.click(); setHint(w); }}
                      className={`px-2 py-0.5 font-headline font-black text-[10px] uppercase tracking-wide transition-all ${
                        hint === w
                          ? "bg-[#ff51fa] text-[#400040]"
                          : "bg-[rgba(255,81,250,0.1)] border border-[rgba(255,81,250,0.2)] text-[#ff51fa] hover:bg-[rgba(255,81,250,0.2)]"
                      }`}>
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last word display */}
        <div className="text-center z-10">
          <p className="text-[9px] font-bold tracking-[0.5em] text-[#3a3a3a] uppercase mb-3">Previous Word</p>
          <div className="font-headline font-black text-[clamp(48px,14vw,80px)] tracking-tighter leading-none">
            {lastWord ? (
              <>
                <span className="text-white">{lastWord.slice(0, -1).toUpperCase()}</span>
                <span className="text-[#ff51fa]" style={{ textShadow: "0 0 20px rgba(255,81,250,0.6)" }}>
                  {lastWord.slice(-1).toUpperCase()}
                </span>
              </>
            ) : (
              <span className="text-[#3a3a3a]">START</span>
            )}
          </div>
          {lastWord && (
            <p className="text-[10px] font-headline font-bold text-[#5a5a5a] uppercase tracking-[0.3em] mt-2">
              Next word starts with <span style={{ color: timerColor }}>{lastChar}</span>
            </p>
          )}
        </div>

        {/* Input area */}
        <div className="w-full max-w-xl space-y-4 z-10">
          {/* Power panel — above input, only on my turn */}
          {isMyTurn && !isSpectating && (
            <PowerPanel
              isMyTurn={isMyTurn}
              players={players}
              myId="me"
              disabled={isPaused}
              onUsePower={(powerId: PowerId, targetId: string | null) => {
                const { roomId } = useGameStore.getState();
                if (roomId && socket.connected) {
                  socket.emit("use_power", { roomId, powerId, targetId });
                }
                // Local mode: show toast only (no server to apply effect)
              }}
            />
          )}

          {/* Combo overlay — shown above input when active */}
          <div className="flex justify-center min-h-[48px] items-end">
            <ComboOverlay result={lastComboResult} visible={showCombo} />
          </div>
          {isSpectating ? (
            <div className="bg-[#0f0f0f] border border-dashed border-[#2a2a2a] p-8 text-center">
              <span className="text-[#3a3a3a] font-headline font-bold text-[12px] uppercase tracking-[0.3em]">
                Spectating — You Forfeited
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative">
              <div className="absolute -top-3 left-0 bg-[#ff51fa] text-[#400040] text-[9px] font-black px-2 py-0.5 uppercase tracking-widest z-20">
                Starts with: {lastChar || "?"}
              </div>
              <motion.div animate={shaking ? "shake" : "rest"} variants={shakeVariants}
                className={`bg-[#141414] flex items-center border transition-colors ${
                  errorMsg ? "border-[#ff5c3a]" : showFlash ? "border-[#06d6a0]" : "border-[#2a2a2a] focus-within:border-[#cafd00]"
                }`}
                style={showFlash ? { boxShadow: "0 0 20px rgba(6,214,160,0.3)" } : {}}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value.toUpperCase())}
                  disabled={!isMyTurn || isPaused}
                  aria-label="Enter word"
                  className="bg-transparent flex-1 font-mono text-[clamp(20px,6vw,36px)] uppercase text-[#cafd00] placeholder-[#2a2a2a] py-4 px-4 focus:outline-none disabled:opacity-40"
                  placeholder={isMyTurn ? `${lastChar}...` : "WAITING..."}
                />
                <motion.button whileTap={isMyTurn && !isValidating ? buttonTap : {}} type="submit"
                  disabled={!isMyTurn || isValidating || isPaused} aria-label="Submit"
                  className="bg-[#cafd00] text-[#516700] font-headline font-black text-[15px] uppercase px-6 h-14 flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-40 min-w-[100px]">
                  {isValidating
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><RefreshCcw size={18} /></motion.div>
                    : "SEND"}
                </motion.button>
              </motion.div>
              <div className={`h-[2px] w-full mt-0.5 transition-colors ${isMyTurn ? "bg-gradient-to-r from-[#cafd00] to-[#ff51fa]" : "bg-[#1a1a1a]"}`} />
              <AnimatePresence>
                {errorMsg && (
                  <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute -bottom-6 left-0 text-[#ff5c3a] text-[10px] font-bold uppercase tracking-widest">
                    {errorMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          )}

          {/* Word chain */}
          <WordChain words={usedWords} className="mt-6" />
        </div>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {showFlash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-[rgba(6,214,160,0.15)] border border-[rgba(6,214,160,0.4)] px-8 py-4 backdrop-blur-sm">
              <span className="text-[#06d6a0] font-headline font-black text-2xl tracking-widest italic">VALID ✓</span>
            </div>
          </motion.div>
        )}
        {xpFloat !== null && (
          <div className="xp-float pointer-events-none fixed top-1/3 left-1/2 -translate-x-1/2 z-[300]">
            <span className="font-headline font-black text-2xl text-[#cafd00]" style={{ textShadow: "0 0 20px rgba(202,253,0,0.8)" }}>
              +{xpFloat} XP
            </span>
          </div>
        )}
        {elimToast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-[rgba(255,92,58,0.15)] border-2 border-[#ff5c3a] px-8 py-4 text-center">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter font-headline">{elimToast}</h2>
            </div>
          </motion.div>
        )}
        {isExitOpen && (
          <ExitModal
            onResume={() => { sfx.click(); setIsExitOpen(false); setGameState({ isPaused: false }); }}
            onExit={() => { sfx.click(); setIsExitOpen(false); resetGame(); setGameState({ status: "lobby", isPaused: false }); }}
            onForfeit={() => { sfx.click(); setIsExitOpen(false); setGameState({ isPaused: false, isSpectating: true }); }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="h-11 bg-[#0a0a0a] flex items-center justify-between px-4 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Trophy size={11} className="text-[#cafd00]" />
            <span className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest">{usedWords.length} words</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={11} className="text-[#ff51fa]" />
            <span className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest">
              {players.filter(p => p.status === "active").length} alive
            </span>
          </div>
          <ComboStrip count={comboState.count} multiplier={comboState.multiplier} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#cafd00] animate-pulse" />
          <span className="text-[9px] font-bold text-[#cafd00] uppercase tracking-widest">
            {socket.connected ? "Live" : "Local"}
          </span>
        </div>
      </footer>
    </div>
  );
};
