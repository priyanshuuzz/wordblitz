import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bolt, Settings, Trophy, User, ArrowLeft, Search, Hourglass,
  CheckCircle, XCircle, Home, BarChart2, Zap, Target, ArrowUp,
  Copy, Plus, HelpCircle, ChevronLeft, Fingerprint, Key, Lock,
  ShieldCheck, AlertCircle, MoreHorizontal, X, RefreshCcw,
  Volume2, Music, Check, Pause, Bell, Globe, Trash2, LogOut,
  Calendar, Clock, Tv, Globe2, Cpu, Film, Flame, Star, Swords,
  ShoppingBag, Users, Keyboard, Trophy as TrophyIcon,
} from "lucide-react";
import { useGameStore } from "./store";
import socket, { connectSocket } from "./socket";
import { loginWithGoogle, loginWithEmail, registerWithEmail, logout, onAuthChange } from "./firebase";
import { TimerBar } from "./components/ui/ProgressBar";
import { ProgressBar } from "./components/ui/ProgressBar";
import { WordChain } from "./components/game/WordChain";
import { PlayerCard } from "./components/game/PlayerCard";
import { GameBoard } from "./components/game/GameBoard";
import { Avatar } from "./components/ui/Avatar";
import { Toast, AchievementToast, XPFloat } from "./components/ui/Toast";
import { RankBadge, StatusBadge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { SocialScreen } from "./components/screens/SocialScreen";
import { StoreScreen } from "./components/screens/StoreScreen";
import { TournamentScreen } from "./components/screens/TournamentScreen";
import { NotificationsPanel } from "./components/screens/NotificationsPanel";
import { KeyboardShortcutsModal } from "./components/screens/KeyboardShortcutsModal";
import {
  pageVariants, slideUpVariants, backdropVariants, modalVariants,
  listContainerVariants, listItemVariants, gridContainerVariants,
  gridItemVariants, shakeVariants, matchFoundVariants, matchFoundTextVariants,
  victoryTextVariants, xpContainerVariants, xpRowVariants,
  splashVariants, splashLogoVariants, buttonTap,
} from "./lib/animations";
import { sfx } from "./lib/sound";
import { launchConfetti } from "./lib/confetti";
import { subscribeNotifications, getUnreadCount, type AppNotification } from "./lib/notifications";
import { CATEGORIES } from "./lib/categoryWords";
import { loadUnlocked, ACHIEVEMENTS } from "./lib/achievements";
import { AchievementScreen } from "./components/screens/AchievementScreen";
import { MissionsScreen }    from "./components/screens/MissionsScreen";
import { ReplayScreen }      from "./replay/replayViewer";
import { StatsScreen }       from "./components/screens/StatsScreen";

// ── Shared overlay components ──────────────────────────────────────────────

const SplashScreen = () => (
  <motion.div
    variants={splashVariants} initial="initial" exit="exit"
    className="fixed inset-0 z-[400] bg-[#0a0a0a] flex flex-col items-center justify-center bg-grid"
  >
    <motion.div variants={splashLogoVariants} initial="initial" animate="animate" className="text-center">
      <div className="flex items-center gap-3 mb-6">
        <Bolt size={32} className="text-[#cafd00]" />
        <h1 className="font-headline font-black text-5xl text-[#f3ffca] uppercase tracking-tighter">WORDBLITZ</h1>
      </div>
      <p className="font-headline font-bold text-[11px] text-[#5a5a5a] uppercase tracking-[0.4em]">Real-Time Word Battles</p>
    </motion.div>
    <div className="absolute bottom-12 w-48 h-[2px] bg-[#1e1e1e] overflow-hidden">
      <motion.div
        initial={{ x: "-100%" }} animate={{ x: "0%" }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="h-full bg-[#cafd00]"
      />
    </div>
  </motion.div>
);

const ConnectionBanner = () => (
  <motion.div
    initial={{ y: -40 }} animate={{ y: 0 }} exit={{ y: -40 }}
    className="fixed top-0 left-0 w-full h-10 bg-[#b92902] text-white flex items-center justify-center z-[350] font-headline font-bold text-[11px] uppercase tracking-widest gap-2"
  >
    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
    CONNECTION LOST — Reconnecting...
  </motion.div>
);

const ReconnectingOverlay = () => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
  >
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="mb-6 text-[#cafd00]">
      <RefreshCcw size={48} />
    </motion.div>
    <h2 className="font-headline font-black text-2xl text-white uppercase tracking-tighter mb-2">Connection Lost</h2>
    <p className="font-headline font-bold text-[#cafd00] text-[11px] uppercase tracking-[0.3em] animate-pulse">Reconnecting...</p>
    <div className="mt-10 w-40 h-[2px] bg-[#1e1e1e] overflow-hidden">
      <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} className="h-full bg-[#cafd00]" />
    </div>
  </motion.div>
);

// ── Delete Confirmation Modal ──────────────────────────────────────────────
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
        <motion.div variants={backdropVariants} initial="initial" animate="animate" exit="exit"
          onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
        <motion.div variants={modalVariants} initial="initial" animate="animate" exit="exit"
          className="relative w-full max-w-sm bg-[#141414] border border-[#ff5c3a] p-8">
          <AlertCircle size={40} className="text-[#ff5c3a] mb-5 mx-auto" />
          <h2 className="font-headline font-black text-xl text-white uppercase text-center mb-3 tracking-tighter">Delete Account?</h2>
          <p className="text-[#8a8a8a] text-center text-[13px] mb-7 leading-relaxed">
            This is <span className="text-[#ff5c3a] font-bold uppercase">permanent</span>. All XP, ranks and stats will be wiped forever.
          </p>
          <div className="flex flex-col gap-2.5">
            <Button variant="danger" fullWidth onClick={onConfirm} className="h-12 border-[#ff5c3a] text-[#ff5c3a] hover:bg-[rgba(255,92,58,0.1)]">Confirm Deletion</Button>
            <Button variant="ghost" fullWidth onClick={onClose} className="h-11 text-[#8a8a8a] hover:text-white">Cancel</Button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ── Settings Modal ─────────────────────────────────────────────────────────
const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { sfxVolume, musicEnabled, notificationsEnabled, avatar, setGameState, resetGame } = useGameStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const avatars = ["Felix","Aneka","Sawyer","Jocelyn","Max","Luna","Oliver","Maya"]
    .map(s => `https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`);

  const handleLogout = async () => {
    sfx.click();
    await logout();
    resetGame();
    setGameState({ status: "landing" });
    onClose();
  };
  const handleDelete = () => { resetGame(); setGameState({ status: "landing" }); onClose(); setShowDeleteConfirm(false); };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div variants={backdropVariants} initial="initial" animate="animate" exit="exit"
              onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div variants={modalVariants} initial="initial" animate="animate" exit="exit"
              className="relative w-full max-w-md bg-[#141414] border border-[#1e1e1e] p-6 overflow-y-auto max-h-[90dvh] no-scrollbar">
              <div className="flex justify-between items-center mb-7">
                <h2 className="font-headline font-black text-xl text-[#cafd00] uppercase tracking-tighter italic">Settings</h2>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#5a5a5a] hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="space-y-7">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white"><Volume2 size={16} className="text-[#cafd00]" /><span className="font-headline font-bold text-[11px] uppercase tracking-widest">SFX Volume</span></div>
                    <span className="font-mono text-[11px] text-[#cafd00]">{Math.round(sfxVolume * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" value={sfxVolume}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      setGameState({ sfxVolume: v });
                      try { localStorage.setItem("wb_sfx_volume", String(v)); } catch {}
                    }}
                    className="w-full h-1.5 bg-[#1e1e1e] rounded-none appearance-none cursor-pointer accent-[#cafd00]" />
                </div>
                {[
                  { label: "Music", icon: <Music size={16} className="text-[#ff51fa]" />, key: "musicEnabled" as const, val: musicEnabled },
                  { label: "Notifications", icon: <Bell size={16} className="text-[#cafd00]" />, key: "notificationsEnabled" as const, val: notificationsEnabled },
                ].map(({ label, icon, key, val }) => (
                  <div key={key} className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white">{icon}<span className="font-headline font-bold text-[11px] uppercase tracking-widest">{label}</span></div>
                    <button aria-label={`Toggle ${label}`} onClick={() => { sfx.click(); setGameState({ [key]: !val } as any); }}
                      className={`w-11 h-6 flex items-center p-1 transition-colors ${val ? "bg-[#cafd00]" : "bg-[#1e1e1e]"}`}>
                      <motion.div animate={{ x: val ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4 h-4 bg-white" />
                    </button>
                  </div>
                ))}
                <div className="space-y-3">
                  <span className="font-headline font-bold text-[11px] uppercase tracking-widest text-white block">Avatar</span>
                  <div className="grid grid-cols-4 gap-2.5">
                    {avatars.map((av, i) => (
                      <button key={i} aria-label={`Avatar ${i+1}`} onClick={() => { sfx.click(); setGameState({ avatar: av }); }}
                        className={`aspect-square border-2 transition-all relative ${avatar === av ? "border-[#cafd00] p-0.5" : "border-transparent hover:border-[#3a3a3a]"}`}>
                        <img src={av} alt="" className="w-full h-full object-cover" />
                        {avatar === av && <div className="absolute -top-1 -right-1 bg-[#cafd00] text-[#516700] p-0.5"><Check size={8} /></div>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2.5 pt-4 border-t border-[#1e1e1e]">
                  <Button variant="secondary" fullWidth onClick={handleLogout} className="h-11 gap-2"><LogOut size={16} />Logout</Button>
                  <Button variant="danger" fullWidth onClick={() => setShowDeleteConfirm(true)} className="h-11 gap-2"><Trash2 size={16} />Delete Account</Button>
                </div>
                <p className="text-center text-[9px] font-bold text-[#3a3a3a] uppercase tracking-[0.3em]">WORDBLITZ V2.0.0</p>
              </div>
              <Button variant="primary" fullWidth onClick={onClose} className="mt-7 h-12">Save & Close</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <DeleteConfirmationModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} />
    </>
  );
};

// ── Live battle feed data ──────────────────────────────────────────────────
const LIVE_BATTLES = [
  { p1: "CRYPTIC_K", p2: "LEXIS_MAX", word: "XENON",   rank: "MASTER"  },
  { p1: "VIPER_99",  p2: "SWIFTKEY",  word: "NEBULA",  rank: "GOLD"    },
  { p1: "BLITZ_ACE", p2: "WORD_WOLF", word: "THUNDER", rank: "DIAMOND" },
  { p1: "SYNTAX_X",  p2: "BYTE_ME",   word: "RHYTHM",  rank: "PLAT"    },
  { p1: "NEON_KING", p2: "FAST_FIN",  word: "QUARTZ",  rank: "GOLD"    },
];
const TOP_PLAYERS = [
  { rank: 1, name: "CRYPTIC_KING",  xp: "42.5K", tier: "MASTER"  },
  { rank: 2, name: "LEXIS_MAXIMUS", xp: "38.1K", tier: "MASTER"  },
  { rank: 3, name: "VIPER_99",      xp: "35.9K", tier: "DIAMOND" },
];

// ── Landing Screen ─────────────────────────────────────────────────────────
const LandingScreen = () => {
  const { setGameState } = useGameStore();
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState(12842);
  const [battleIdx, setBattleIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLiveCount(n => n + Math.floor(Math.random() * 7) - 3), 2000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setBattleIdx(i => (i + 1) % LIVE_BATTLES.length), 2500);
    return () => clearInterval(t);
  }, []);

  const handleGoogle = async () => {
    setAuthLoading(true); setAuthError(null);
    try {
      const user = await loginWithGoogle();
      setGameState({ username: user.displayName ?? `Player_${user.uid.slice(0,5)}`, avatar: user.photoURL ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`, status: "lobby" });
    } catch (err: any) { setAuthError(err?.message ?? "Google sign-in failed"); }
    finally { setAuthLoading(false); }
  };

  const battle = LIVE_BATTLES[battleIdx];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-[100dvh] flex flex-col bg-[#0a0a0a] overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-dense opacity-70" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(202,253,0,0.08) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-64" style={{ background: "linear-gradient(to top, #0a0a0a 0%, transparent 100%)" }} />
      </div>
      <header className="relative z-10 h-14 border-b border-[#1a1a1a] flex items-center justify-between px-5 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Bolt size={18} className="text-[#cafd00]" />
          </motion.div>
          <span className="font-headline font-black text-lg uppercase text-[#f3ffca] tracking-tighter">WORDBLITZ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <motion.span key={liveCount} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="font-headline font-bold text-[10px] text-[#cafd00] uppercase tracking-widest">
            {liveCount.toLocaleString()} live
          </motion.span>
        </div>
        <button aria-label="Help" className="w-8 h-8 border border-[#2a2a2a] flex items-center justify-center text-[#5a5a5a] hover:text-white hover:border-[#3a3a3a] transition-colors">
          <HelpCircle size={14} />
        </button>
      </header>
      <main className="relative z-10 flex flex-col px-5 pt-6 pb-12 gap-0">
        <section className="flex flex-col gap-5 pb-7">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 self-start">
            <div className="flex items-center gap-2 bg-[rgba(255,81,250,0.1)] border border-[rgba(255,81,250,0.25)] px-3 py-1">
              <Star size={10} className="text-[#ff51fa]" />
              <span className="font-headline font-black text-[9px] text-[#ff51fa] uppercase tracking-[0.25em]">Season 1 — Neon Storm</span>
            </div>
          </motion.div>
          <div className="relative -mx-5 overflow-hidden">
            <motion.h1 initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
              className="font-headline font-black text-[clamp(72px,20vw,100px)] text-[#cafd00] uppercase italic leading-none tracking-[-0.04em] pl-5"
              style={{ textShadow: "0 0 60px rgba(202,253,0,0.25)" }}>
              WORD<br />BLITZ
            </motion.h1>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16,1,0.3,1] }}
              className="h-[3px] bg-gradient-to-r from-[#cafd00] via-[#cafd00] to-[#ff51fa] origin-left mt-3 mx-5" />
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col gap-0.5">
            <p className="font-headline font-black text-[14px] text-white tracking-[0.2em] uppercase">Real-Time Word Battles.</p>
            <p className="font-headline font-black text-[14px] text-[#ff51fa] tracking-[0.2em] uppercase">No Mercy.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col gap-3">
            <Button variant="primary" fullWidth size="xl" onClick={() => { sfx.click(); setGameState({ status: "register" }); }} iconRight={<Zap size={18} />}>
              Get Started — It's Free
            </Button>
            <Button variant="secondary" fullWidth size="lg" onClick={() => { sfx.click(); setGameState({ status: "login" }); }}
              className="border-[#ff51fa] text-white hover:bg-[rgba(255,81,250,0.06)]">Login</Button>
          </motion.div>
          <div className="flex items-center gap-3">
            <div className="flex-grow h-px bg-[#1e1e1e]" />
            <span className="text-[9px] font-headline font-bold text-[#3a3a3a] uppercase tracking-widest whitespace-nowrap">or</span>
            <div className="flex-grow h-px bg-[#1e1e1e]" />
          </div>
          {authError && <p className="text-[#ff5c3a] text-[11px] font-bold uppercase tracking-widest text-center">{authError}</p>}
          <Button variant="google" fullWidth size="lg" onClick={handleGoogle} loading={authLoading}
            icon={!authLoading ? <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#0a0a0a] font-black text-[11px]">G</div> : undefined}>
            {authLoading ? "Signing in..." : "Continue with Google"}
          </Button>
        </section>
        <section className="border-t border-[#1a1a1a] pt-7 pb-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="live-dot" /><span className="font-headline font-black text-[10px] text-[#cafd00] uppercase tracking-[0.25em]">Live Arena</span></div>
            <span className="font-headline font-bold text-[9px] text-[#5a5a5a] uppercase tracking-widest">847 matches active</span>
          </div>
          <div className="bg-[#0f0f0f] border border-[#1e1e1e] border-l-2 border-l-[#cafd00] p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#cafd00] text-[#516700] px-2 py-0.5 font-headline font-black text-[8px] uppercase tracking-widest">Live</div>
            <AnimatePresence mode="wait">
              <motion.div key={battleIdx} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-headline font-black text-[11px] text-white uppercase">{battle.p1}</span>
                  <div className="flex items-center gap-1"><Swords size={12} className="text-[#ff51fa]" /><span className="font-headline font-bold text-[9px] text-[#ff51fa] uppercase">vs</span></div>
                  <span className="font-headline font-black text-[11px] text-white uppercase">{battle.p2}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[11px] text-[#cafd00]">{battle.word}</span>
                  <span className="text-[8px] font-black text-[#5a5a5a] uppercase bg-[#1e1e1e] px-1.5 py-0.5">{battle.rank}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="space-y-1.5">
            <p className="font-headline font-bold text-[9px] text-[#5a5a5a] uppercase tracking-widest mb-2">Top Players Right Now</p>
            {TOP_PLAYERS.map((p, i) => (
              <motion.div key={p.rank} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.07 }}
                className="flex items-center justify-between bg-[#0f0f0f] border border-[#1a1a1a] px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`font-headline font-black italic text-lg ${i === 0 ? "text-[#cafd00]" : "text-[#5a5a5a]"}`}>{String(p.rank).padStart(2,"0")}</span>
                  <span className="font-headline font-bold text-[11px] uppercase text-white">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#8a8a8a]">{p.xp} XP</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 uppercase ${p.tier === "MASTER" ? "bg-[rgba(255,81,250,0.15)] text-[#ff51fa]" : p.tier === "DIAMOND" ? "bg-[rgba(185,242,255,0.1)] text-[#b9f2ff]" : "bg-[rgba(255,215,0,0.1)] text-[#ffd700]"}`}>{p.tier}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        <section className="border-t border-[#1a1a1a] pt-7 pb-7 flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="bg-[#141414] border border-[#1e1e1e] border-l-4 border-l-[#cafd00] p-4 flex items-center justify-between cursor-pointer group"
            onClick={() => setGameState({ status: "register" })}>
            <div>
              <span className="text-[9px] font-headline font-black text-[#cafd00] uppercase tracking-[0.25em] block mb-1">Daily Challenge</span>
              <p className="font-headline font-black text-[15px] uppercase tracking-tight">The Quartz Trial</p>
              <p className="text-[10px] text-[#5a5a5a] mt-0.5">+150 XP · Neon Badge · Resets in 6h</p>
            </div>
            <div className="bg-[#cafd00] text-[#516700] p-2 group-hover:scale-110 transition-transform"><ChevronLeft className="rotate-180" size={16} /></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="bg-[#141414] border border-[#1e1e1e] p-4 relative overflow-hidden">
            <div className="absolute inset-0 shimmer pointer-events-none opacity-40" />
            <div className="relative flex items-center justify-between">
              <div>
                <span className="text-[9px] font-headline font-black text-[#ff51fa] uppercase tracking-[0.25em] block mb-1">Battle Pass</span>
                <p className="font-headline font-black text-[15px] uppercase tracking-tight">Season 1 Active</p>
                <p className="text-[10px] text-[#5a5a5a] mt-0.5">100 tiers · Exclusive skins · Ends in 28d</p>
              </div>
              <div className="text-right"><p className="font-headline font-black text-xl text-[#ff51fa]">FREE</p><p className="text-[9px] text-[#5a5a5a] uppercase">to start</p></div>
            </div>
          </motion.div>
        </section>
        <section className="border-t border-[#1a1a1a] pt-6 flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Active Players", value: liveCount.toLocaleString(), color: "text-white" },
              { label: "Matches Today",  value: "94.2K",                    color: "text-[#cafd00]" },
              { label: "Tournaments",    value: "42",                        color: "text-[#ff51fa]" },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-0.5 bg-[#0f0f0f] border border-[#1a1a1a] p-3">
                <span className={`font-headline font-black text-xl ${s.color}`}>{s.value}</span>
                <span className="text-[8px] font-bold text-[#5a5a5a] uppercase tracking-widest text-center leading-tight">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 text-[9px] font-headline font-bold text-[#3a3a3a] uppercase tracking-[0.2em]">
            <span>Privacy</span><span>Terms</span><span>Support</span>
          </div>
        </section>
      </main>
    </motion.div>
  );
};

// ── Login Screen ───────────────────────────────────────────────────────────
const LoginScreen = ({ onToast }: { onToast: (msg: string) => void }) => {
  const { setGameState } = useGameStore();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    if (!email || !password) return;
    setLoading(true); setError(null);
    try {
      const user = await loginWithEmail(email, password);
      sfx.matchFound();
      setGameState({ username: user.displayName ?? email.split("@")[0], avatar: user.photoURL ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`, status: "lobby" });
    } catch (err: any) {
      sfx.wordRejected();
      setError(err?.code === "auth/invalid-credential" ? "Invalid email or password" : (err?.message ?? "Login failed"));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError(null);
    try {
      const user = await loginWithGoogle();
      sfx.matchFound();
      setGameState({ username: user.displayName ?? `Player_${user.uid.slice(0,5)}`, avatar: user.photoURL ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`, status: "lobby" });
    } catch (err: any) { setError(err?.message ?? "Google sign-in failed"); }
    finally { setGoogleLoading(false); }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-[100dvh] flex flex-col bg-[#0a0a0a] bg-grid-dense overflow-x-hidden">
      <header className="h-14 flex items-center justify-between px-5 z-10">
        <button aria-label="Back" onClick={() => { sfx.click(); setGameState({ status: "landing" }); }}
          className="w-9 h-9 flex items-center justify-center text-[#cafd00] hover:bg-[#141414] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <span className="font-headline font-black text-lg uppercase text-[#f3ffca] tracking-tighter">WORDBLITZ</span>
        <div className="w-9" />
      </header>
      <main className="flex-grow px-5 pt-6 pb-10 flex flex-col">
        <div className="mb-8">
          <h1 className="font-headline font-black italic text-[clamp(36px,11vw,56px)] text-[#cafd00] uppercase leading-none tracking-tighter">ACCESS<br />GRANTED</h1>
          <div className="flex h-[3px] mt-3 w-full">
            <div className="w-1/2 bg-[#f3ffca]" /><div className="w-1/2 bg-[#cafd00]" />
          </div>
        </div>
        <div className="bg-[#141414] border-l-4 border-[#cafd00] p-6 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-headline font-bold text-[#8a8a8a] uppercase tracking-[0.2em]">Email</label>
            <div className="relative">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" aria-label="Email"
                className="input-game w-full h-[52px] px-4 pr-12 text-white font-mono text-[15px] placeholder-[#3a3a3a]" />
              <Fingerprint size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3a3a3a]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-headline font-bold text-[#8a8a8a] uppercase tracking-[0.2em]">Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEmailLogin()} placeholder="••••••••" aria-label="Password"
                className="input-game w-full h-[52px] px-4 pr-12 text-white font-mono text-[15px] placeholder-[#3a3a3a]" />
              <button aria-label={showPass ? "Hide" : "Show"} onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3a3a3a] hover:text-[#8a8a8a] transition-colors">
                <Key size={18} />
              </button>
            </div>
          </div>
          {error && <p className="text-[#ff5c3a] text-[11px] font-bold uppercase tracking-widest text-center">{error}</p>}
          <Button variant="primary" fullWidth size="xl" onClick={handleEmailLogin} loading={loading}
            disabled={!email || !password} iconRight={!loading ? <Zap size={18} /> : undefined}>
            {loading ? "Entering..." : "Enter Arena"}
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex-grow h-px bg-[#1e1e1e]" />
            <span className="text-[10px] font-headline font-bold text-[#3a3a3a] uppercase tracking-widest">or</span>
            <div className="flex-grow h-px bg-[#1e1e1e]" />
          </div>
          <Button variant="google" fullWidth size="lg" onClick={handleGoogle} loading={googleLoading}
            icon={!googleLoading ? <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#0a0a0a] font-black text-[11px]">G</div> : undefined}>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>
          <button onClick={() => onToast("Password reset link sent!")}
            className="flex items-center justify-center gap-2 text-[#ff51fa] font-bold text-[12px] uppercase tracking-wide hover:brightness-125 transition-all">
            <Lock size={12} /> Forgot password?
          </button>
        </div>
        <p className="text-center text-[12px] font-headline font-bold text-[#5a5a5a] uppercase tracking-widest mt-6">
          No account? <span onClick={() => { sfx.click(); setGameState({ status: "register" }); }}
            className="text-white cursor-pointer hover:text-[#cafd00] transition-colors">Register</span>
        </p>
      </main>
    </motion.div>
  );
};

// ── Register Screen ────────────────────────────────────────────────────────
const RegisterScreen = () => {
  const { setGameState } = useGameStore();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStrength = () => {
    if (!password) return { label: "NONE", level: 0, color: "#1e1e1e" };
    if (password.length < 4) return { label: "WEAK", level: 1, color: "#ff5c3a" };
    if (password.length < 7) return { label: "FAIR", level: 3, color: "#ffd166" };
    if (password.length < 10) return { label: "GOOD", level: 4, color: "#cafd00" };
    return { label: "STRONG", level: 6, color: "#06d6a0" };
  };
  const strength = getStrength();
  const isValid = username.length >= 3 && email && password.length >= 6 && agreed;

  const handleRegister = async () => {
    if (!isValid) return;
    setLoading(true); setError(null);
    try {
      const user = await registerWithEmail(username, email, password);
      sfx.achievement();
      setGameState({ username: user.displayName ?? username, avatar: user.photoURL ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`, status: "lobby" });
    } catch (err: any) {
      sfx.wordRejected();
      setError(err?.code === "auth/email-already-in-use" ? "Email already registered" : (err?.message ?? "Registration failed"));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError(null);
    try {
      const user = await loginWithGoogle();
      sfx.matchFound();
      setGameState({ username: user.displayName ?? `Player_${user.uid.slice(0,5)}`, avatar: user.photoURL ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`, status: "lobby" });
    } catch (err: any) { setError(err?.message ?? "Google sign-in failed"); }
    finally { setGoogleLoading(false); }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-[100dvh] flex flex-col bg-[#0a0a0a] bg-grid-dense overflow-x-hidden">
      <header className="h-14 flex items-center justify-between px-5 z-10">
        <button aria-label="Back" onClick={() => { sfx.click(); setGameState({ status: "landing" }); }}
          className="w-9 h-9 flex items-center justify-center text-[#cafd00] hover:bg-[#141414] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <span className="font-headline font-black text-lg uppercase text-[#f3ffca] tracking-tighter">WORDBLITZ</span>
        <div className="w-9" />
      </header>
      <main className="flex-grow px-5 pt-6 pb-10 flex flex-col">
        <div className="mb-8">
          <h1 className="font-headline font-black italic text-[clamp(32px,10vw,52px)] text-[#cafd00] uppercase leading-[0.9] tracking-tighter">INIT<br />PLAYER</h1>
          <div className="w-24 h-[3px] bg-[#ff51fa] mt-3" />
        </div>
        <div className="flex flex-col gap-4">
          {[
            { label: "Player ID", type: "text",  val: username, set: setUsername, placeholder: "USERNAME", aria: "Username" },
            { label: "Email",     type: "email", val: email,    set: setEmail,    placeholder: "your@email.com", aria: "Email" },
          ].map(f => (
            <div key={f.label} className="space-y-1.5">
              <label className="block text-[10px] font-headline font-bold text-[#8a8a8a] uppercase tracking-[0.2em]">{f.label}</label>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} aria-label={f.aria}
                className="input-game w-full h-[52px] px-4 text-[#f3ffca] font-mono text-[15px] placeholder-[#3a3a3a]" />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-headline font-bold text-[#8a8a8a] uppercase tracking-[0.2em]">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" aria-label="Password"
              className="input-game w-full h-[52px] px-4 text-[#f3ffca] font-mono text-[15px] placeholder-[#3a3a3a]" />
            <div className="flex gap-1 mt-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-1 flex-1 transition-all duration-300"
                  style={{ backgroundColor: i < strength.level ? strength.color : "#1e1e1e" }} />
              ))}
            </div>
            <div className="flex justify-between">
              <span className="text-[9px] font-headline font-bold text-[#5a5a5a] uppercase tracking-widest">Strength</span>
              <span className="text-[9px] font-headline font-bold uppercase tracking-widest" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          </div>
          <button onClick={() => { sfx.click(); setAgreed(!agreed); }} className="flex items-center gap-3 text-left">
            <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${agreed ? "bg-[#ff51fa] border-[#ff51fa]" : "border-[#ff51fa] bg-transparent"}`}>
              {agreed && <Check size={12} className="text-[#400040]" />}
            </div>
            <p className="text-[11px] font-headline font-bold text-[#8a8a8a] uppercase tracking-wide">
              I agree to the <span className="text-[#ff51fa]">Terms</span> & Protocols
            </p>
          </button>
          {error && <p className="text-[#ff5c3a] text-[11px] font-bold uppercase tracking-widest text-center">{error}</p>}
          <Button variant="primary" fullWidth size="xl" onClick={handleRegister} loading={loading} disabled={!isValid}>
            {loading ? "Creating..." : "Create Account"}
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex-grow h-px bg-[#1e1e1e]" />
            <span className="text-[10px] font-headline font-bold text-[#3a3a3a] uppercase tracking-widest">or</span>
            <div className="flex-grow h-px bg-[#1e1e1e]" />
          </div>
          <Button variant="google" fullWidth size="lg" onClick={handleGoogle} loading={googleLoading}
            icon={!googleLoading ? <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#0a0a0a] font-black text-[11px]">G</div> : undefined}>
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>
          <p className="text-center text-[12px] font-headline font-bold text-[#5a5a5a] uppercase tracking-widest">
            Have an account? <span onClick={() => { sfx.click(); setGameState({ status: "login" }); }}
              className="text-white cursor-pointer hover:text-[#cafd00] transition-colors">Login</span>
          </p>
        </div>
      </main>
    </motion.div>
  );
};

// ── Header ─────────────────────────────────────────────────────────────────
const Header = ({ onNotifications, unreadCount }: { onNotifications: () => void; unreadCount: number }) => {
  const { username, avatar, uid, mmr } = useGameStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!uid) return;
    import("./firebase/leaderboardService")
      .then(m => m.fetchPlayerProfile(uid))
      .then(p => { if (p) setProfile(p); })
      .catch(() => {});
  }, [uid]);

  const xp      = profile?.xp    ?? 0;
  const level   = profile?.level ?? 1;
  const rank    = profile?.rank  ?? "silver";
  const xpMax   = Math.round(500 * Math.pow(level, 1.5));
  const xpInLvl = xp % xpMax;
  const pct     = Math.min(100, (xpInLvl / xpMax) * 100);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0a0a0a]/95 backdrop-blur-md h-16 flex justify-between items-center px-4 border-b border-[#1a1a1a]">
      <div className="flex items-center gap-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={buttonTap}
          className="w-10 h-10 border border-[#2a2a2a] overflow-hidden flex-shrink-0">
          <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
        </motion.div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-headline font-black text-[11px] text-[#cafd00] uppercase tracking-wide">
              {rank.charAt(0).toUpperCase() + rank.slice(1)} · Lv{level}
            </span>
            <span className="text-[9px] text-[#5a5a5a] font-mono">{xpInLvl}/{xpMax}</span>
          </div>
          <div className="w-28 h-[3px] bg-[#1e1e1e] overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }}
              className="h-full bg-[#cafd00]" style={{ boxShadow: "0 0 6px rgba(202,253,0,0.6)" }} />
          </div>
          <span className="text-[9px] text-[#5a5a5a] font-headline font-bold uppercase tracking-widest">
            {xpMax - xpInLvl} XP to next
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Bolt size={16} className="text-[#cafd00]" />
        <span className="font-headline font-black text-lg text-[#f3ffca] uppercase tracking-tighter">WORDBLITZ</span>
      </div>
      <div className="flex items-center gap-1">
        <motion.button whileTap={buttonTap} onClick={() => { sfx.notification(); onNotifications(); }} aria-label="Notifications"
          className="w-10 h-10 flex items-center justify-center text-[#8a8a8a] hover:text-[#cafd00] hover:bg-[#141414] transition-colors relative">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#ff51fa] text-[#400040] text-[8px] font-black flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </motion.button>
        <motion.button whileHover={{ rotate: 90 }} whileTap={buttonTap}
          onClick={() => { sfx.click(); setIsSettingsOpen(true); }} aria-label="Settings"
          className="w-10 h-10 flex items-center justify-center text-[#cafd00] hover:bg-[#141414] transition-colors">
          <Settings size={18} />
        </motion.button>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
};

// ── Navbar ─────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { activeTab, setGameState } = useGameStore();
  const tabs = [
    { id: "home",         label: "Home",    icon: Home        },
    { id: "rankings",     label: "Ranks",   icon: BarChart2   },
    { id: "social",       label: "Social",  icon: Users       },
    { id: "store",        label: "Store",   icon: ShoppingBag },
    { id: "tournaments",  label: "Events",  icon: Trophy      },
    { id: "achievements", label: "Awards",  icon: TrophyIcon  },
    { id: "missions",     label: "Missions",icon: Target      },
    { id: "replays",      label: "Replays", icon: Tv          },
    { id: "stats",        label: "Stats",   icon: BarChart2   },
  ];
  // Show only first 5 in bottom nav; rest accessible via "More" or swipe
  const primaryTabs = tabs.slice(0, 5);
  return (
    <nav className="fixed bottom-0 left-0 w-full h-[68px] bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#1a1a1a] flex justify-around items-center px-2 z-50">
      {primaryTabs.map(tab => (
        <motion.button key={tab.id} whileTap={buttonTap}
          onClick={() => { sfx.click(); setGameState({ activeTab: tab.id as any }); }}
          className={`flex flex-col items-center justify-center gap-1 p-2 relative min-w-[48px] transition-colors ${activeTab === tab.id ? "text-[#cafd00]" : "text-[#5a5a5a]"}`}>
          <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 1.8} />
          <span className="font-headline font-bold text-[8px] uppercase tracking-widest">{tab.label}</span>
          {activeTab === tab.id && (
            <motion.div layoutId="nav-indicator"
              className="absolute -top-px w-8 h-[2px] bg-[#cafd00]"
              style={{ boxShadow: "0 0 8px rgba(202,253,0,0.8)" }} />
          )}
        </motion.button>
      ))}
      {/* More button — opens secondary tabs */}
      <motion.button whileTap={buttonTap}
        onClick={() => { sfx.click(); setGameState({ activeTab: ["achievements","missions","replays","stats"].includes(activeTab) ? activeTab as any : "achievements" }); }}
        className={`flex flex-col items-center justify-center gap-1 p-2 relative min-w-[48px] transition-colors ${["achievements","missions","replays","stats"].includes(activeTab) ? "text-[#cafd00]" : "text-[#5a5a5a]"}`}>
        <MoreHorizontal size={20} strokeWidth={["achievements","missions","replays","stats"].includes(activeTab) ? 2.5 : 1.8} />
        <span className="font-headline font-bold text-[8px] uppercase tracking-widest">More</span>
        {["achievements","missions","replays","stats"].includes(activeTab) && (
          <motion.div layoutId="nav-indicator"
            className="absolute -top-px w-8 h-[2px] bg-[#cafd00]"
            style={{ boxShadow: "0 0 8px rgba(202,253,0,0.8)" }} />
        )}
      </motion.button>
    </nav>
  );
};

// ── Home Content ───────────────────────────────────────────────────────────
const HomeContent = () => {
  const { setGameState, username, avatar, uid, mmr } = useGameStore();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    Promise.all([
      import("./firebase/leaderboardService").then(m => m.fetchPlayerProfile(uid)),
      import("./firebase/leaderboardService").then(m => m.fetchMatchHistory(uid, 3)),
    ]).then(([prof, hist]) => {
      if (cancelled) return;
      setProfile(prof);
      setHistory(hist as any[]);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [uid]);

  const startMatchmaking = () => {
    sfx.click();
    setGameState({ status: "matchmaking" });
    connectSocket().then(() => {
      socket.emit("join_matchmaking", { username, avatar, uid, mmr, region: "GLOBAL", mode: "casual" });
    }).catch(() => {
      setGameState({ status: "matchmaking" });
    });
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 6) { setJoinError("Enter a valid room code"); return; }
    setJoinError(null);
    setJoining(true);
    try {
      const { joinPrivateRoom } = await import("./lib/privateRoom");
      const result = await joinPrivateRoom(code, { uid, username, avatar });

      if (!result.ok) {
        const msgs: Record<string, string> = {
          not_found:      "Room not found — check the code",
          already_started:"Game already started",
          full:           "Room is full",
          already_in_room:"You're already in this room",
        };
        setJoinError(msgs[(result as { ok: false; reason: string }).reason] ?? "Could not join room");
        setJoining(false);
        return;
      }

      setJoining(false);
      setGameState({
        status: "private_room",
        roomId: code,
        players: result.room.players.map(p => ({
          id: p.uid, uid: p.uid, username: p.username,
          avatar: p.avatar, status: "active" as const, lives: 3,
        })),
      });
    } catch (e) {
      setJoining(false);
      setJoinError("Connection failed — try again");
      console.error("[JoinRoom]", e);
    }
  };

  const winRate = profile && profile.gamesPlayed > 0
    ? Math.round((profile.wins / profile.gamesPlayed) * 100) : 0;

  return (
    <>
      <section className="relative px-5 pt-6 pb-8">
        <div className="absolute inset-0 bg-grid-dense opacity-60" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(202,253,0,0.07) 0%, transparent 70%)" }} />
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="font-headline font-bold text-[10px] text-[#cafd00] uppercase tracking-[0.25em]">4,281 players battling live</span>
          </div>
          <div>
            <h1 className="font-headline font-black text-[clamp(44px,12vw,64px)] leading-none tracking-tighter uppercase">
              Dominate<br />The <span className="text-[#cafd00]" style={{ textShadow: "0 0 30px rgba(202,253,0,0.4)" }}>Grid</span>
            </h1>
          </div>
          <motion.button whileTap={buttonTap} onClick={startMatchmaking}
            className="btn-primary w-full h-16 flex items-center justify-between px-6 text-[18px] scanlines"
            whileHover={{ boxShadow: "0 0 30px rgba(202,253,0,0.3)" }}>
            <span>PLAY NOW</span>
            <Bolt size={24} />
          </motion.button>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Private Room",   action: () => { sfx.click(); setGameState({ status: "private_room" }); } },
              { label: "Category Mode",  action: () => { sfx.click(); setGameState({ status: "category_selection" }); } },
            ].map(b => (
              <motion.button key={b.label} whileTap={buttonTap} onClick={b.action}
                className="btn-secondary h-12 text-[12px] font-headline font-bold uppercase tracking-widest">
                {b.label}
              </motion.button>
            ))}
          </div>

          {/* ── Join Room by Code ─────────────────────────────────────── */}
          <div className="border border-[#1e1e1e] bg-[#0f0f0f]">
            <div className="px-4 pt-3 pb-1 flex items-center gap-2">
              <Key size={13} className="text-[#cafd00]" />
              <span className="font-headline font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">Join a Room</span>
            </div>
            <div className="px-4 pb-4 flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setJoinError(null); }}
                  onKeyDown={e => e.key === "Enter" && joinRoom()}
                  placeholder="ENTER ROOM CODE"
                  maxLength={8}
                  aria-label="Room code"
                  className="input-game flex-grow h-12 px-4 font-mono text-[16px] font-bold text-[#f3ffca] tracking-[0.2em] placeholder-[#3a3a3a] uppercase"
                />
                <motion.button
                  whileTap={buttonTap}
                  onClick={joinRoom}
                  disabled={joining || joinCode.length < 6}
                  className="h-12 px-5 bg-[#cafd00] text-[#516700] font-headline font-black text-[12px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d8ff33] transition-colors flex items-center gap-2"
                >
                  {joining ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RefreshCcw size={16} />
                    </motion.span>
                  ) : (
                    <ArrowUp size={16} className="rotate-90" />
                  )}
                  {joining ? "…" : "Join"}
                </motion.button>
              </div>
              {joinError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[#ff5c3a] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <XCircle size={12} />{joinError}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 mb-6">
        <motion.div whileTap={buttonTap} onClick={() => { sfx.click(); setGameState({ status: "daily_challenge" }); }}
          className="bg-[#141414] border border-[#1e1e1e] border-l-4 border-l-[#cafd00] p-5 cursor-pointer relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Calendar size={72} /></div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[9px] font-headline font-black text-[#cafd00] uppercase tracking-[0.3em] block mb-1">Daily Challenge</span>
              <h3 className="font-headline font-black text-xl uppercase tracking-tighter italic">The Quartz Trial</h3>
              <p className="text-[#5a5a5a] text-[10px] uppercase mt-1">Win to earn <span className="text-[#cafd00]">Neon Badge</span> + 150 XP</p>
            </div>
            <div className="bg-[#cafd00] text-[#516700] p-2 flex-shrink-0"><ChevronLeft className="rotate-180" size={18} /></div>
          </div>
        </motion.div>
      </section>

      <section className="px-5 mb-8">
        <h2 className="font-headline font-bold text-[10px] text-[#5a5a5a] uppercase tracking-widest mb-4">Battle Record</h2>
        <motion.div variants={gridContainerVariants} initial="initial" animate="animate" className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Wins",  value: profile ? String(profile.wins)   : "—", color: "text-[#cafd00]" },
            { label: "Losses",      value: profile ? String(profile.losses) : "—", color: "text-[#ff51fa]" },
            { label: "Win Rate",    value: profile ? `${winRate}%`          : "—", color: "text-white"     },
            { label: "MMR",         value: profile ? String(profile.mmr)    : String(mmr), color: "text-[#cafd00]" },
          ].map(s => (
            <motion.div key={s.label} variants={gridItemVariants}
              className="bg-[#141414] border border-[#1e1e1e] p-5 flex flex-col justify-between h-28">
              <span className="text-[9px] font-headline font-bold text-[#5a5a5a] uppercase tracking-widest">{s.label}</span>
              <span className={`font-headline font-black text-4xl ${s.color}`}>{s.value}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="px-5 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline font-bold text-[10px] text-[#5a5a5a] uppercase tracking-widest">Recent Activity</h2>
          <span onClick={() => setGameState({ activeTab: "rankings" as any })}
            className="text-[10px] font-bold text-[#cafd00] uppercase cursor-pointer hover:brightness-125">View All</span>
        </div>
        {history.length === 0 ? (
          <div className="bg-[#141414] border border-[#1e1e1e] p-6 text-center">
            <p className="font-headline font-bold text-[#3a3a3a] text-[11px] uppercase tracking-widest">
              {uid ? "No matches yet — play your first game!" : "Sign in to see your history"}
            </p>
          </div>
        ) : (
          <motion.div variants={listContainerVariants} initial="initial" animate="animate" className="space-y-1.5">
            {history.map((item, i) => {
              const won = item.placement === 1;
              const ago = item.endedAt?.seconds
                ? (() => { const s = Math.floor(Date.now() / 1000 - item.endedAt.seconds); return s < 3600 ? `${Math.floor(s/60)}m ago` : `${Math.floor(s/3600)}h ago`; })()
                : "recently";
              return (
                <motion.div key={item.matchId ?? i} variants={listItemVariants}
                  className="flex items-center justify-between p-4 bg-[#141414] border-l-2 hover:bg-[#1a1a1a] transition-colors"
                  style={{ borderLeftColor: won ? "#cafd00" : "#ff51fa" }}>
                  <div className="flex items-center gap-3">
                    {won ? <CheckCircle size={14} className="text-[#cafd00] flex-shrink-0" /> : <XCircle size={14} className="text-[#ff51fa] flex-shrink-0" />}
                    <div>
                      <p className="font-headline font-bold text-[12px] uppercase tracking-tight">{won ? "Victory" : "Defeat"} · {item.mode ?? "Casual"}</p>
                      <p className="text-[9px] text-[#5a5a5a] uppercase tracking-tight">{ago}</p>
                    </div>
                  </div>
                  <span className={`font-headline font-black text-[12px] ${won ? "text-[#cafd00]" : "text-[#8a8a8a]"}`}>+{item.xpEarned ?? 25} XP</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </>
  );
};

// ── Rankings ───────────────────────────────────────────────────────────────
const Rankings = () => {
  const [tab, setTab] = useState("GLOBAL");
  const { avatar, uid, username } = useGameStore();
  const [board, setBoard] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      import("./firebase/leaderboardService").then(m => m.fetchLeaderboard("season1", 10)),
      uid ? import("./firebase/leaderboardService").then(m => m.fetchPlayerProfile(uid)) : Promise.resolve(null),
      uid ? import("./firebase/leaderboardService").then(m => m.fetchMatchHistory(uid, 5)) : Promise.resolve([]),
    ]).then(([lb, prof, hist]) => {
      if (cancelled) return;
      setBoard(lb); setProfile(prof); setHistory(hist as any[]); setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [uid, tab]);

  const myPosition = board.findIndex(e => e.uid === uid);

  return (
    <div className="flex flex-col">
      <div className="flex w-full bg-[#0f0f0f] border-b border-[#1a1a1a] sticky top-16 z-20">
        {["GLOBAL","WEEKLY","FRIENDS"].map(t => (
          <button key={t} onClick={() => { sfx.click(); setTab(t); }}
            className={`flex-1 py-3.5 font-headline font-black text-[10px] tracking-widest uppercase transition-all ${tab === t ? "bg-[#cafd00] text-[#516700]" : "text-[#5a5a5a] hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <RefreshCcw size={24} className="text-[#cafd00]" />
          </motion.div>
        </div>
      ) : board.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Trophy size={32} className="text-[#2a2a2a]" />
          <p className="font-headline font-bold text-[#3a3a3a] text-[11px] uppercase tracking-widest">No rankings yet — play a match!</p>
        </div>
      ) : (
        <motion.div variants={listContainerVariants} initial="initial" animate="animate" className="flex flex-col gap-1 mt-3 px-4">
          {board.map((item, i) => {
            const isYou = item.uid === uid;
            return (
              <motion.div key={item.uid} variants={listItemVariants}
                className={`flex items-center justify-between p-4 border-l-4 transition-all ${isYou ? "bg-[#cafd00] border-[#cafd00] scale-[1.02]" : "bg-[#141414] border-[#1e1e1e] hover:border-[#3a3a3a]"}`}>
                <div className="flex items-center gap-4">
                  <span className={`font-headline font-black italic text-2xl ${isYou ? "text-[#516700]" : "text-[#cafd00]"}`}>
                    {String(item.position ?? i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <span className={`font-headline font-bold text-[13px] uppercase tracking-tight ${isYou ? "text-[#516700]" : "text-white"}`}>
                      {isYou ? `YOU (${item.username})` : item.username}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest ${isYou ? "bg-[#516700] text-[#cafd00]" : "bg-[#1e1e1e] text-[#8a8a8a]"}`}>
                        {item.rank?.toUpperCase() ?? "BRONZE"}
                      </span>
                      <span className={`text-[10px] font-bold ${isYou ? "text-[#516700]" : "text-[#5a5a5a]"}`}>{item.mmr} MMR</span>
                    </div>
                  </div>
                </div>
                {i === 0 && <Trophy size={18} className="text-[#cafd00]" />}
              </motion.div>
            );
          })}
        </motion.div>
      )}
      <section className="mt-10 px-4 pb-10">
        <div className="h-20 bg-gradient-to-r from-[#cafd00] to-[#ff51fa] relative">
          <div className="absolute -bottom-8 left-5 w-16 h-16 border-4 border-[#0a0a0a] overflow-hidden">
            <img src={avatar} alt="profile" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="mt-12 space-y-5">
          <div>
            <h2 className="font-headline font-black text-2xl uppercase tracking-tighter">{username || "PLAYER"}</h2>
            <p className="font-headline font-bold text-[10px] text-[#cafd00] uppercase tracking-[0.2em]">
              {myPosition >= 0 ? `Rank #${myPosition + 1} Global` : "Unranked"}
            </p>
          </div>
          <div className="grid grid-cols-2 border border-[#1e1e1e]">
            {[
              ["Wins",     profile?.wins ?? "—",        "text-[#cafd00]"],
              ["Tier",     (profile?.rank ?? "bronze").toUpperCase(), "text-[#ffd700]"],
              ["Win Rate", profile ? `${Math.round((profile.wins / Math.max(profile.gamesPlayed, 1)) * 100)}%` : "—", "text-white"],
              ["MMR",      profile?.mmr ?? "—",         "text-white"],
            ].map(([l, v, c], i) => (
              <div key={String(l)} className={`p-5 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b" : ""} border-[#1e1e1e]`}>
                <p className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest mb-1">{l}</p>
                <p className={`font-headline font-black text-xl ${c}`}>{v}</p>
              </div>
            ))}
          </div>
          {history.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-headline font-bold text-[10px] text-[#5a5a5a] uppercase tracking-widest">Recent Matches</h3>
              {history.map(m => {
                const won = m.placement === 1;
                const ago = m.endedAt?.seconds
                  ? (() => { const s = Math.floor(Date.now() / 1000 - m.endedAt.seconds); return s < 3600 ? `${Math.floor(s/60)}m ago` : `${Math.floor(s/3600)}h ago`; })()
                  : "recently";
                return (
                  <div key={m.matchId} className="flex items-center justify-between p-4 bg-[#141414] border-l-2"
                    style={{ borderLeftColor: won ? "#cafd00" : "#ff51fa" }}>
                    <div className="flex items-center gap-3">
                      {won ? <CheckCircle size={13} className="text-[#cafd00]" /> : <XCircle size={13} className="text-[#ff51fa]" />}
                      <div>
                        <p className="font-headline font-bold text-[11px] uppercase">{won ? "Victory" : "Defeat"} · {m.mode}</p>
                        <p className="text-[9px] text-[#5a5a5a] uppercase">{ago}</p>
                      </div>
                    </div>
                    <span className={`font-headline font-black text-[11px] ${won ? "text-[#cafd00]" : "text-[#8a8a8a]"}`}>+{m.xpEarned} XP</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// ── Lobby ──────────────────────────────────────────────────────────────────
const Lobby = () => {
  const { activeTab } = useGameStore();
  return (
    <div className="pt-16 pb-[68px] flex flex-col min-h-[100dvh] bg-[#0a0a0a]">
      {activeTab === "home"         && <HomeContent />}
      {activeTab === "rankings"     && <Rankings />}
      {activeTab === "social"       && <SocialScreen />}
      {activeTab === "store"        && <StoreScreen />}
      {activeTab === "tournaments"  && <TournamentScreen />}
      {activeTab === "achievements" && <AchievementScreen />}
      {activeTab === "missions"     && <MissionsScreen />}
      {activeTab === "replays"      && <ReplayScreen />}
      {activeTab === "stats"        && <StatsScreen />}
    </div>
  );
};

// ── Matchmaking ────────────────────────────────────────────────────────────
const Matchmaking = () => {
  const { setGameState, avatar, uid, mmr, username, turnDuration } = useGameStore();
  const [found, setFound] = useState(1);
  const [matchReady, setMatchReady] = useState(false);
  const avatarSeeds = ["Felix","Aneka","Sawyer","Jocelyn","Max","Luna","Oliver","Maya"];

  useEffect(() => {
    if (found < 4) {
      const t = setInterval(() => setFound(p => p + 1), 1500);
      return () => clearInterval(t);
    } else {
      setMatchReady(true);
      sfx.matchFound();
      const t = setTimeout(() => {
        const currentStatus = useGameStore.getState().status;
        if (currentStatus !== "playing") {
          setGameState({
            status: "playing",
            players: [
              { id: "me",   uid: uid || "me",   username: username || "You",     avatar,                                                                    status: "active", lives: 3 },
              { id: "bot1", uid: "bot1", username: "Viper_99",  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Viper`, status: "active", lives: 3 },
              { id: "bot2", uid: "bot2", username: "SwiftKey",  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Swift`, status: "active", lives: 3 },
            ],
            currentTurnId: "me",
            lastWord:      "RIVER",
            usedWords:     ["RIVER"],
            turnDeadline:  Date.now() + turnDuration,
          });
        }
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [found]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0a0a0a] bg-grid relative overflow-hidden">
      <header className="h-16 flex items-center px-5 gap-4 border-b border-[#1a1a1a] z-10 bg-[#0a0a0a]/90 backdrop-blur-md">
        <motion.button whileTap={buttonTap} onClick={() => { sfx.click(); socket.emit("leave_matchmaking"); setGameState({ status: "lobby" }); }}
          className="w-9 h-9 flex items-center justify-center text-[#cafd00] hover:bg-[#141414] transition-colors">
          <ArrowLeft size={20} />
        </motion.button>
        <h1 className="font-headline font-bold text-lg uppercase text-[#cafd00] tracking-tight">Finding Match...</h1>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center px-5 z-10 gap-10">
        <div className="relative w-56 h-56 flex items-center justify-center">
          {[0,1,2].map(i => (
            <div key={i} className="absolute inset-0 border border-[#cafd00] rounded-full"
              style={{ opacity: 0.08 + i * 0.06, transform: `scale(${0.5 + i * 0.25})` }} />
          ))}
          <motion.div className="absolute inset-0 border-2 border-[#cafd00] rounded-full"
            animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} />
          <div className="relative flex flex-col items-center text-center">
            <Search size={28} className="text-[#cafd00] mb-2" />
            <p className="font-headline font-black text-xl text-[#cafd00] uppercase tracking-tighter">Searching</p>
            <p className="font-headline text-[9px] text-[#5a5a5a] tracking-[0.2em] uppercase mt-1">Global</p>
          </div>
        </div>
        <div className="w-full max-w-sm bg-[#141414] border-l-4 border-[#cafd00] p-6">
          <div className="flex justify-between items-end mb-5">
            <div>
              <h2 className="font-headline font-black text-3xl text-white">{found}/4</h2>
              <p className="font-headline text-[10px] text-[#5a5a5a] uppercase tracking-widest">Players Ready</p>
            </div>
            <ProgressBar value={found} max={4} color="#cafd00" height={4} className="w-28" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square relative">
                {i < found ? (
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="w-full h-full border-b-2 border-[#cafd00] overflow-hidden bg-[#1e1e1e]">
                    <img src={i === 0 ? avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeeds[i]}`}
                      alt="" className="w-full h-full object-cover grayscale" />
                  </motion.div>
                ) : (
                  <div className="w-full h-full border border-dashed border-[#2a2a2a] flex items-center justify-center bg-[#0f0f0f]">
                    <Hourglass size={14} className="text-[#3a3a3a]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#141414] border border-[#1e1e1e] border-l-2 border-l-[#ff51fa] px-4 py-3 w-full max-w-sm">
          <Zap size={14} className="text-[#ff51fa]" />
          <p className="text-[12px] text-[#8a8a8a]">Tip: <span className="text-white font-semibold">Chain words faster for bonus XP!</span></p>
        </div>
        <Button variant="secondary" fullWidth onClick={() => { sfx.click(); socket.emit("leave_matchmaking"); setGameState({ status: "lobby" }); }}
          className="max-w-sm h-12 border-[#3a3a3a] text-[#8a8a8a] hover:border-[#ff5c3a] hover:text-[#ff5c3a]">
          Cancel
        </Button>
      </main>
      <AnimatePresence>
        {matchReady && (
          <motion.div variants={matchFoundVariants} initial="initial" animate="animate"
            className="absolute inset-0 z-50 bg-[#cafd00] flex items-center justify-center">
            <motion.h2 variants={matchFoundTextVariants} initial="initial" animate="animate"
              className="font-headline font-black text-[clamp(40px,12vw,72px)] text-[#516700] uppercase italic tracking-tight">
              MATCH FOUND!
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Private Room Setup ─────────────────────────────────────────────────────
const PrivateRoomSetup = () => {
  const { setGameState, username, avatar, uid, mmr, turnDuration } = useGameStore();
  const [roomSize, setRoomSize] = useState(4);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ uid: string; username: string; avatar: string; isHost?: boolean }[]>([]);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isHost = players[0]?.uid === uid;
  const fakeColors = ["#cafd00", "#ff51fa", "#ffd166", "#ff5c3a", "#8a8a8a", "#b9f2ff"];

  // Create room on mount
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    // Check if we're a guest (already have a roomId from joining)
    const existingRoomId = useGameStore.getState().roomId;

    const subscribeAndListen = (code: string, isCreating: boolean) => {
      import("./lib/privateRoom").then(({ subscribeToRoom }) => {
        if (cancelled) return;
        if (!isCreating) { setRoomCode(code); setCreating(false); }

        unsubscribe = subscribeToRoom(code, (room) => {
          if (!room || cancelled) return;
          setPlayers(room.players.map((p, i) => ({ ...p, isHost: i === 0 })));

          if (room.status === "started") {
            const myUid = useGameStore.getState().uid;
            const currentStatus = useGameStore.getState().status;

            // Map current user to "me", others keep their uid as id
            const mappedPlayers = room.players.map((p) => ({
              id: p.uid === myUid ? "me" : p.uid,
              uid: p.uid,
              username: p.username, avatar: p.avatar,
              status: "active" as const, lives: 3,
            }));

            const currentTurnId = room.currentTurnUid === myUid
              ? "me"
              : (room.currentTurnUid ?? null);

            if (currentStatus !== "playing") {
              // First time entering playing state
              sfx.matchFound();
              setGameState({
                status: "playing",
                roomId: code,
                players: mappedPlayers,
                currentTurnId,
                lastWord: room.lastWord ?? "",
                usedWords: room.usedWords ?? [],
                turnDeadline: room.turnDeadline ?? (Date.now() + (room.turnDuration ?? 15_000)),
                turnDuration: room.turnDuration ?? 15_000,
              });
            } else {
              // Game already running — sync turn/word updates from other player
              setGameState({
                players: mappedPlayers,
                currentTurnId,
                lastWord: room.lastWord ?? "",
                usedWords: room.usedWords ?? [],
                turnDeadline: room.turnDeadline ?? (Date.now() + (room.turnDuration ?? 15_000)),
              });
            }
          }

          if (room.status === "cancelled" && useGameStore.getState().status === "playing") {
            setGameState({ status: "finished", winnerId: null });
          }
        });
      });
    };

    if (existingRoomId) {
      // Guest path — already joined, just subscribe
      subscribeAndListen(existingRoomId, false);
    } else {
      // Host path — create room then subscribe
      import("./lib/privateRoom").then(({ createPrivateRoom }) => {
        if (cancelled) return;
        createPrivateRoom(
          { uid, username, avatar },
          roomSize,
          turnDuration
        ).then(code => {
          if (cancelled) return;
          setRoomCode(code);
          setCreating(false);
          setGameState({ roomId: code });
          subscribeAndListen(code, true);
        }).catch(err => {
          if (!cancelled) { setCreating(false); setError("Failed to create room. Check your connection."); }
          console.error("[PrivateRoom] create error:", err);
        });
      });
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyCode = () => {
    if (!roomCode) return;
    sfx.click();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    if (!roomCode || players.length < 2) return;
    sfx.matchFound();
    const { startPrivateRoom } = await import("./lib/privateRoom");
    await startPrivateRoom(roomCode, players[0].uid, turnDuration);
  };

  const displayCode = roomCode
    ? `${roomCode.slice(0, 3)}-${roomCode.slice(3)}`
    : "------";

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-[100dvh] flex flex-col bg-[#0a0a0a] overflow-y-auto no-scrollbar">
      <header className="h-16 flex items-center px-5 gap-4 border-b border-[#1a1a1a] sticky top-0 bg-[#0a0a0a] z-10">
        <motion.button whileTap={buttonTap} onClick={() => { sfx.click(); setGameState({ status: "lobby", roomId: null }); }}
          className="w-9 h-9 flex items-center justify-center text-[#cafd00] hover:bg-[#141414] transition-colors">
          <ArrowLeft size={20} />
        </motion.button>
        <h1 className="font-headline font-black text-lg uppercase tracking-tighter text-[#f3ffca]">Private Room</h1>
        {!isHost && <span className="ml-auto text-[10px] font-headline font-bold text-[#ff51fa] uppercase tracking-widest">Guest</span>}
      </header>
      <div className="flex-grow flex flex-col p-5 gap-5">

        {/* Room Code */}
        <div className="space-y-2">
          <label className="block font-headline font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">Room Code</label>
          <div className="flex gap-2">
            <div className="flex-grow bg-[#141414] border border-[#2a2a2a] h-16 flex items-center justify-center font-mono text-3xl font-bold tracking-[0.3em] relative overflow-hidden">
              {creating ? (
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-[#5a5a5a] text-[14px] uppercase tracking-widest">Generating…</motion.span>
              ) : error ? (
                <span className="text-[#ff5c3a] text-[12px] px-4 text-center">{error}</span>
              ) : (
                <span className="text-[#f3ffca]">{displayCode}</span>
              )}
            </div>
            <button onClick={copyCode} disabled={!roomCode}
              className="w-16 h-16 bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center text-[#cafd00] hover:bg-[#282828] transition-colors active:scale-95 disabled:opacity-40">
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
          <p className="text-[#3a3a3a] text-[10px] uppercase tracking-widest">Share this code with friends to invite them</p>
        </div>

        {/* Host-only settings (locked after room created) */}
        {isHost && (
          <>
            <div className="space-y-3">
              <label className="block font-headline font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">Max Players</label>
              <div className="flex gap-2">
                {[2,3,4,5,6].map(s => (
                  <button key={s} onClick={() => { sfx.click(); setRoomSize(s); }}
                    disabled={!!roomCode}
                    className={`w-12 h-12 font-headline font-black text-xl transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${roomSize === s ? "bg-[#cafd00] text-[#516700] border-[#cafd00]" : "bg-[#141414] text-[#8a8a8a] border-[#2a2a2a] hover:border-[#3a3a3a]"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="block font-headline font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">Turn Timer</label>
              <div className="flex flex-wrap gap-2">
                {[{l:"10s",v:10_000},{l:"15s",v:15_000},{l:"30s",v:30_000},{l:"1m",v:60_000},{l:"2m",v:120_000},{l:"5m",v:300_000}].map(t => (
                  <button key={t.l} onClick={() => { sfx.click(); setGameState({ turnDuration: t.v }); }}
                    disabled={!!roomCode}
                    className={`flex-1 min-w-[48px] h-11 font-headline font-bold text-[12px] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed ${turnDuration === t.v ? "bg-[#cafd00] text-[#516700]" : "bg-[#141414] text-[#8a8a8a] border border-[#2a2a2a] hover:border-[#3a3a3a]"}`}>
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5">
          <Button variant="secondary" fullWidth className="h-11 border-[#ff51fa] text-[#ff51fa] hover:bg-[rgba(255,81,250,0.08)]"
            onClick={copyCode} disabled={!roomCode}>
            <Copy size={14} className="mr-2" />Share Invite
          </Button>
          {isHost && (
            <Button variant="primary" fullWidth size="xl" onClick={startGame} disabled={players.length < 2 || !roomCode}>
              Start Game ({players.length}/{roomSize})
            </Button>
          )}
          {!isHost && (
            <div className="bg-[#141414] border border-[#1e1e1e] p-4 text-center">
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[11px] font-headline font-bold text-[#cafd00] uppercase tracking-widest">
                Waiting for host to start…
              </motion.span>
            </div>
          )}
        </div>

        {/* Player list */}
        <div className="space-y-3">
          <label className="font-headline font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">
            Players <span className="text-[#cafd00]">{players.length}/{roomSize}</span>
          </label>
          <div className="space-y-2">
            {players.map((p, i) => (
              <motion.div key={p.uid} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className={`bg-[#141414] p-3 flex items-center justify-between border-l-4 ${i === 0 ? "border-[#cafd00]" : "border-[#ff51fa]"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center font-headline font-black text-lg"
                    style={{ backgroundColor: fakeColors[i % fakeColors.length], color: "#0a0a0a" }}>
                    {(p.username ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-[13px] text-white">
                    {p.username}{p.uid === uid ? " (You)" : ""}
                  </span>
                </div>
                <StatusBadge label={i === 0 ? "Host" : "Ready"} color={i === 0 ? "primary" : "success"} />
              </motion.div>
            ))}
            {Array.from({ length: Math.max(0, roomSize - players.length) }).map((_, i) => (
              <div key={i} className="bg-[#0f0f0f] border border-dashed border-[#2a2a2a] p-3 flex items-center justify-center h-14">
                <span className="text-[#3a3a3a] text-[12px] italic">Waiting for player…</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── Daily Challenge Screen ─────────────────────────────────────────────────
const DailyChallengeScreen = () => {
  const { setGameState, username, avatar, uid, mmr, turnDuration } = useGameStore();
  const [timeLeft, setTimeLeft] = useState("");
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date(); const midnight = new Date(); midnight.setHours(24,0,0,0);
      const d = midnight.getTime() - now.getTime();
      setTimeLeft(`${Math.floor(d/3600000).toString().padStart(2,"0")}:${Math.floor((d%3600000)/60000).toString().padStart(2,"0")}:${Math.floor((d%60000)/1000).toString().padStart(2,"0")}`);
    };
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, []);

  const days    = ["M","T","W","T","F","S","S"];
  const results = [true,true,false,true,true,null,null];

  const startChallenge = () => {
    sfx.matchFound();
    setGameState({
      status: "playing",
      players: [
        { id: "me",   uid: uid || "me",   username: username || "You",     avatar,                                                                    status: "active", lives: 3 },
        { id: "bot1", uid: "bot1", username: "Quartz_AI", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Quartz`, status: "active", lives: 3 },
      ],
      currentTurnId: "me",
      lastWord:      "QUARTZ",
      usedWords:     ["QUARTZ"],
      turnDeadline:  Date.now() + turnDuration,
    });
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-[100dvh] bg-[#0a0a0a] pt-20 pb-12 px-5 flex flex-col">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => { sfx.click(); setGameState({ status: "lobby" }); }} aria-label="Back"
          className="w-10 h-10 flex items-center justify-center bg-[#141414] border border-[#2a2a2a] text-white hover:border-[#3a3a3a] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-headline font-black text-2xl uppercase tracking-tighter italic">Daily Challenge</h1>
      </header>
      <div className="flex-grow flex flex-col gap-7">
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-[#141414] border-2 border-[#cafd00] p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#cafd00] text-[#516700] px-3 py-1 font-headline font-black text-[9px] uppercase tracking-widest">Active</div>
          <span className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-[0.3em] mb-2 block">Word of the Day</span>
          <h2 className="font-headline font-black text-5xl text-white uppercase tracking-tighter mb-5">QUARTZ</h2>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest block mb-1">Resets In</span>
              <div className="flex items-center gap-1.5 text-[#cafd00] font-mono font-bold text-[13px]">
                <Clock size={13} /><span>{timeLeft}</span>
              </div>
            </div>
            <div>
              <span className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest block mb-1">Difficulty</span>
              <span className="text-[#ff51fa] font-bold uppercase text-[12px]">Expert</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest block mb-1">Reward</span>
              <span className="text-[#cafd00] font-bold uppercase text-[12px]">+150 XP</span>
            </div>
          </div>
        </motion.div>

        {/* Daily reward claim */}
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className={`p-5 border-2 relative overflow-hidden cursor-pointer transition-all ${claimed ? "border-[#06d6a0] bg-[rgba(6,214,160,0.05)]" : "border-[#ff51fa] bg-[rgba(255,81,250,0.04)] hover:bg-[rgba(255,81,250,0.08)]"}`}
          onClick={() => { if (!claimed) { sfx.achievement(); setClaimed(true); } }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-headline font-black text-[#ff51fa] uppercase tracking-[0.25em] block mb-1">Daily Login Reward</span>
              <p className="font-headline font-black text-[15px] uppercase tracking-tight">+50 XP · Day 6 Streak</p>
              <p className="text-[10px] text-[#5a5a5a] mt-0.5">🔥 Keep your streak alive!</p>
            </div>
            <div className={`p-3 font-headline font-black text-[11px] uppercase tracking-widest transition-all ${claimed ? "bg-[#06d6a0] text-[#003d2e]" : "bg-[#ff51fa] text-[#400040]"}`}>
              {claimed ? <Check size={18} /> : "CLAIM"}
            </div>
          </div>
        </motion.div>

        <div className="space-y-3">
          <h3 className="font-headline font-bold text-[10px] text-[#5a5a5a] uppercase tracking-widest">Weekly Progress</h3>
          <div className="flex justify-between gap-2">
            {days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-full aspect-square flex items-center justify-center border ${results[i] === true ? "bg-[#cafd00] border-[#cafd00]" : results[i] === false ? "bg-[#ff51fa] border-[#ff51fa]" : "bg-[#141414] border-[#2a2a2a]"}`}>
                  {results[i] === true  && <Check size={14} className="text-[#516700]" />}
                  {results[i] === false && <X     size={14} className="text-[#400040]" />}
                </div>
                <span className="text-[9px] font-bold text-[#5a5a5a]">{day}</span>
              </div>
            ))}
          </div>
        </div>

        <Button variant="primary" fullWidth size="xl" onClick={startChallenge} className="mt-auto">
          Play Challenge
        </Button>
      </div>
    </motion.div>
  );
};

// ── Category Selection ─────────────────────────────────────────────────────
const CategorySelectionScreen = () => {
  const { setGameState, selectedCategory, username, avatar, uid, mmr, turnDuration } = useGameStore();

  const startCategoryMatch = () => {
    if (!selectedCategory) return;
    sfx.matchFound();
    // Find a starter word for the category
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    const starterWord = cat?.words[0]?.toUpperCase() ?? "APPLE";
    setGameState({
      status: "playing",
      players: [
        { id: "me",   uid: uid || "me",   username: username || "You",     avatar,                                                                    status: "active", lives: 3 },
        { id: "bot1", uid: "bot1", username: "CatBot_1", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Cat1`, status: "active", lives: 3 },
        { id: "bot2", uid: "bot2", username: "CatBot_2", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Cat2`, status: "active", lives: 3 },
      ],
      currentTurnId: "me",
      lastWord:      starterWord,
      usedWords:     [starterWord.toLowerCase()],
      turnDeadline:  Date.now() + turnDuration,
    });
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-[100dvh] bg-[#0a0a0a] pt-20 pb-12 px-5 flex flex-col">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => { sfx.click(); setGameState({ status: "lobby" }); }} aria-label="Back"
          className="w-10 h-10 flex items-center justify-center bg-[#141414] border border-[#2a2a2a] text-white hover:border-[#3a3a3a] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-headline font-black text-2xl uppercase tracking-tighter italic">Select Category</h1>
      </header>
      <p className="text-[10px] font-headline font-bold text-[#5a5a5a] uppercase tracking-widest mb-4">
        Words must belong to the chosen category
      </p>
      <motion.div variants={gridContainerVariants} initial="initial" animate="animate" className="grid grid-cols-2 gap-3 mb-8">
        {CATEGORIES.map(cat => (
          <motion.button key={cat.id} variants={gridItemVariants} whileTap={buttonTap}
            onClick={() => { sfx.click(); setGameState({ selectedCategory: cat.id }); }}
            className={`p-5 text-left border-2 transition-all flex flex-col gap-2 ${
              selectedCategory === cat.id
                ? "bg-[#1e1e1e] border-[#cafd00]"
                : `bg-[#141414] border-[#1e1e1e] hover:border-[#3a3a3a]`
            }`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{cat.emoji}</span>
              {selectedCategory === cat.id && <div className="bg-[#cafd00] text-[#516700] p-0.5"><Check size={12} /></div>}
            </div>
            <h3 className={`font-headline font-black text-[15px] uppercase tracking-tight ${cat.color}`}>{cat.title}</h3>
            <p className="text-[9px] text-[#5a5a5a] uppercase tracking-widest">{cat.description}</p>
            <p className="text-[8px] text-[#3a3a3a] font-mono">{cat.words.length} words</p>
          </motion.button>
        ))}
      </motion.div>
      <Button variant="primary" fullWidth size="xl" disabled={!selectedCategory} onClick={startCategoryMatch}>
        {selectedCategory ? `Start ${CATEGORIES.find(c => c.id === selectedCategory)?.title} Match` : "Select a Category"}
      </Button>
    </motion.div>
  );
};

// ── Result Screen ──────────────────────────────────────────────────────────
const ResultScreen = ({ onPlayAgain, onBackToHome }: { onPlayAgain: () => void; onBackToHome: () => void }) => {
  const { winnerId, lastMatchXp, lastMatchMmrDelta, players, usedWords, selectedCategory } = useGameStore();
  const isWinner = winnerId === "me";
  const confettiRef = useRef(false);

  useEffect(() => {
    if (isWinner && !confettiRef.current) {
      confettiRef.current = true;
      sfx.victory();
      launchConfetti(4000);
    } else if (!isWinner) {
      sfx.defeat();
    }
  }, []);

  const myWords  = usedWords.length > 0 ? Math.ceil(usedWords.length / Math.max(players.length, 1)) : 0;
  const xpBase   = isWinner ? 100 : 25;
  const xpTotal  = lastMatchXp > 0 ? lastMatchXp : xpBase;
  const mmrDelta = lastMatchMmrDelta !== 0 ? lastMatchMmrDelta : isWinner ? 18 : -18;

  const xpRows = [
    { label: "Base XP",       xp: xpBase,           show: true },
    { label: "Win Bonus",     xp: xpTotal - xpBase, show: isWinner && xpTotal > xpBase },
    { label: "Participation", xp: 25,               show: !isWinner },
    { label: "Category Bonus",xp: 20,               show: !!selectedCategory },
  ].filter(r => r.show && r.xp > 0);

  const totalXp = xpRows.reduce((s, r) => s + r.xp, 0);

  // Word stats
  const longestWord = usedWords.reduce((a, b) => b.length > a.length ? b : a, "");
  const avgLen = usedWords.length
    ? Math.round(usedWords.reduce((s, w) => s + w.length, 0) / usedWords.length * 10) / 10
    : 0;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
      className="min-h-[100dvh] bg-[#0a0a0a] flex flex-col relative overflow-hidden p-5">
      {/* BG decoration */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none z-0">
        <span className="font-headline font-black text-[40vw] text-[#ff51fa]">{isWinner ? "W" : "L"}</span>
      </div>

      <header className="flex justify-center mb-8 z-10">
        <div className="flex items-center gap-2">
          <Bolt size={16} className="text-[#cafd00]" />
          <span className="font-headline font-black text-lg text-[#f3ffca] uppercase tracking-tighter">WORDBLITZ</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center max-w-lg mx-auto w-full z-10 gap-8">
        {/* Result headline */}
        <div className="text-center">
          <StatusBadge label="Match Terminated" color="secondary" />
          <motion.h2 variants={victoryTextVariants} initial="initial" animate="animate"
            className={`font-headline font-black italic text-[clamp(56px,18vw,96px)] leading-[0.85] uppercase mt-4 ${isWinner ? "text-[#cafd00]" : "text-[#ff51fa]"}`}
            style={{ textShadow: isWinner ? "0 0 40px rgba(202,253,0,0.4)" : "0 0 40px rgba(255,81,250,0.4)" }}>
            {isWinner ? "YOU WIN" : "DEFEAT"}
          </motion.h2>
          {selectedCategory && (
            <p className="font-headline font-bold text-[10px] text-[#5a5a5a] uppercase tracking-widest mt-2">
              {CATEGORIES.find(c => c.id === selectedCategory)?.title} Mode
            </p>
          )}
        </div>

        {/* Stats card */}
        <div className="w-full bg-[#141414] border border-[#1e1e1e] p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Words",   String(myWords || usedWords.length),                                                                  "text-[#cafd00]"],
              ["MMR",     `${mmrDelta > 0 ? "+" : ""}${mmrDelta}`,                                                             mmrDelta >= 0 ? "text-[#cafd00]" : "text-[#ff51fa]"],
              ["Result",  isWinner ? "WIN" : "LOSS",                                                                           isWinner ? "text-[#cafd00]" : "text-[#ff51fa]"],
            ].map(([l,v,c]) => (
              <div key={l} className="flex flex-col">
                <span className={`font-headline font-black text-2xl ${c}`}>{v}</span>
                <span className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest">{l}</span>
              </div>
            ))}
          </div>

          {/* Extended stats */}
          {usedWords.length > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1e1e1e]">
              {[
                { label: "Longest Word", value: longestWord.toUpperCase() || "—" },
                { label: "Avg Length",   value: avgLen ? `${avgLen} letters` : "—" },
                { label: "Total Words",  value: String(usedWords.length) },
                { label: "Chain Length", value: `${usedWords.length} links` },
              ].map(s => (
                <div key={s.label} className="bg-[#0f0f0f] border border-[#1e1e1e] p-3">
                  <p className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="font-headline font-black text-[13px] text-white uppercase">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* XP breakdown */}
          <div className="border-t border-[#1e1e1e] pt-4 space-y-2">
            <p className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest mb-3">XP Breakdown</p>
            <motion.div variants={xpContainerVariants} initial="initial" animate="animate" className="space-y-2">
              {xpRows.map(r => (
                <motion.div key={r.label} variants={xpRowVariants} className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-[#8a8a8a] uppercase tracking-wide">{r.label}</span>
                  <span className="font-headline font-black text-[13px] text-[#cafd00]">+{r.xp} XP</span>
                </motion.div>
              ))}
              <div className="flex justify-between items-center border-t border-[#1e1e1e] pt-2 mt-2">
                <span className="font-headline font-black text-[13px] text-white uppercase">Total</span>
                <span className="font-headline font-black text-xl text-[#cafd00]" style={{ textShadow: "0 0 12px rgba(202,253,0,0.5)" }}>
                  +{totalXp} XP
                </span>
              </div>
            </motion.div>
          </div>

          {/* XP progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
              <span className="text-[#5a5a5a]">XP Progress</span>
              <span className="text-[#cafd00]">{isWinner ? "Rank up soon!" : "Keep going"}</span>
            </div>
            <ProgressBar value={isWinner ? 85 : 45} color="#cafd00" height={4} glow />
          </div>

          {/* Word chain replay */}
          {usedWords.length > 0 && (
            <div className="border-t border-[#1e1e1e] pt-4">
              <p className="text-[9px] font-bold text-[#5a5a5a] uppercase tracking-widest mb-2">Word Chain</p>
              <WordChain words={usedWords.slice(-8)} />
              {usedWords.length > 8 && (
                <p className="text-[9px] text-[#3a3a3a] mt-1 text-center">+{usedWords.length - 8} more words</p>
              )}
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          <Button variant="primary" fullWidth size="xl" onClick={() => { sfx.click(); onPlayAgain(); }}>
            Play Again
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" fullWidth className="h-12 border-[#ff51fa] text-[#ff51fa] hover:bg-[rgba(255,81,250,0.08)]"
              onClick={() => {
                sfx.click();
                const text = `I just ${isWinner ? "won" : "played"} a match on WordBlitz! ${usedWords.length} words chained. Can you beat me? 🔥`;
                navigator.share?.({ text }).catch(() => navigator.clipboard.writeText(text));
              }}>
              Share Stats
            </Button>
            <Button variant="ghost" fullWidth onClick={() => { sfx.click(); onBackToHome(); }}
              className="h-12 border border-[#2a2a2a] hover:border-[#3a3a3a]">
              Home
            </Button>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const { status, setGameState, resetGame, isReconnecting, activeTab } = useGameStore();
  const [toast, setToast]           = useState<{ msg: string; type?: "info"|"success"|"error"|"warning" } | null>(null);
  const [achievement, setAchievement] = useState<{ title: string; description: string; xp: number } | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<{ title: string; description: string; xp: number }[]>([]);
  const [isSplash, setIsSplash]     = useState(true);
  const [isOffline, setIsOffline]   = useState(!navigator.onLine);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Drain achievement queue — show one at a time
  useEffect(() => {
    if (!achievement && achievementQueue.length > 0) {
      const [next, ...rest] = achievementQueue;
      setAchievement(next);
      setAchievementQueue(rest);
    }
  }, [achievement, achievementQueue]);

  // Sync unread count
  useEffect(() => {
    return subscribeNotifications(notifs => {
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "?") { sfx.click(); setShowShortcuts(s => !s); }
      if (status === "lobby") {
        if (e.key === " ") { e.preventDefault(); setGameState({ status: "matchmaking" }); }
        if (e.key === "p" || e.key === "P") setGameState({ status: "private_room" });
        if (e.key === "c" || e.key === "C") setGameState({ status: "category_selection" });
        if (e.key === "t" || e.key === "T") setGameState({ activeTab: "tournaments" as any });
        if (e.key === "1") setGameState({ activeTab: "home" as any });
        if (e.key === "2") setGameState({ activeTab: "rankings" as any });
        if (e.key === "3") setGameState({ activeTab: "social" as any });
        if (e.key === "4") setGameState({ activeTab: "store" as any });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [status]);

  useEffect(() => {
    const splashTimer = setTimeout(() => setIsSplash(false), 1600);

    const unsubAuth = onAuthChange(user => {
      if (user) {
        const s = useGameStore.getState().status;
        if (["landing","login","register"].includes(s)) {
          setGameState({
            username: user.displayName ?? `Player_${user.uid.slice(0,5)}`,
            avatar:   user.photoURL ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
            uid:      user.uid,
            status:   "lobby",
          });
          // Show welcome achievement on first login
          setTimeout(() => {
            setAchievement({ title: "Welcome!", description: "You joined the arena.", xp: 50 });
          }, 1200);
        } else {
          setGameState({ uid: user.uid });
        }
        connectSocket();
      }
    });

    const onOnline  = () => { setIsOffline(false); setToast({ msg: "Back online!", type: "success" }); };
    const onOffline = () => setIsOffline(true);

    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      clearTimeout(splashTimer);
      unsubAuth();
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const wrap = (key: string, el: React.ReactNode) => (
    <motion.div key={key} variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {el}
    </motion.div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white selection:bg-[#cafd00] selection:text-[#0a0a0a] overflow-x-hidden">
      {/* Global overlays */}
      <AnimatePresence>
        {isSplash      && <SplashScreen key="splash" />}
        {isOffline     && <ConnectionBanner key="offline" />}
        {toast         && <Toast key="toast" message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
        {achievement   && (
          <AchievementToast
            key="achievement"
            title={achievement.title}
            description={achievement.description}
            xp={achievement.xp}
            onDismiss={() => setAchievement(null)}
          />
        )}
        {isReconnecting && !isOffline && <ReconnectingOverlay key="reconnect" />}
      </AnimatePresence>

      {/* Panels */}
      <NotificationsPanel isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Screens */}
      <AnimatePresence mode="wait">
        {!isSplash && (
          <>
            {status === "landing"            && wrap("landing",    <LandingScreen />)}
            {status === "login"              && wrap("login",      <LoginScreen onToast={msg => setToast({ msg })} />)}
            {status === "register"           && wrap("register",   <RegisterScreen />)}
            {status === "lobby"              && wrap("lobby", (
              <>
                <Header onNotifications={() => setShowNotifs(true)} unreadCount={unreadCount} />
                <Lobby />
                <Navbar />
              </>
            ))}
            {status === "private_room"       && wrap("private",    <PrivateRoomSetup />)}
            {status === "daily_challenge"    && wrap("daily",      <DailyChallengeScreen />)}
            {status === "category_selection" && wrap("category",   <CategorySelectionScreen />)}
            {status === "matchmaking"        && wrap("matchmaking", <Matchmaking />)}
            {status === "playing"            && wrap("playing",    <GameBoard />)}
            {status === "finished"           && wrap("finished",   (
              <ResultScreen
                onPlayAgain={() => {
                  resetGame();
                  setGameState({ status: "matchmaking" });
                }}
                onBackToHome={() => {
                  resetGame();
                  setGameState({ status: "lobby" });
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
