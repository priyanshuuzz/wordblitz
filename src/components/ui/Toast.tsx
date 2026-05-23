import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Zap, AlertCircle, CheckCircle, X } from "lucide-react";
import { slideDownVariants } from "../../lib/animations";

// ── Generic Toast ──────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  type?: "info" | "success" | "error" | "warning";
  onDismiss: () => void;
  duration?: number;
}

const typeConfig = {
  info:    { border: "border-[#f3ffca]", text: "text-[#f3ffca]", icon: <Zap size={14} /> },
  success: { border: "border-[#06d6a0]", text: "text-[#06d6a0]", icon: <CheckCircle size={14} /> },
  error:   { border: "border-[#ff5c3a]", text: "text-[#ff5c3a]", icon: <AlertCircle size={14} /> },
  warning: { border: "border-[#ffd166]", text: "text-[#ffd166]", icon: <AlertCircle size={14} /> },
};

export const Toast: React.FC<ToastProps> = ({ message, type = "info", onDismiss, duration = 2500 }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  const cfg = typeConfig[type];

  return (
    <motion.div
      variants={slideDownVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-[#141414] border ${cfg.border} px-5 py-3 font-headline font-bold text-[12px] uppercase tracking-widest shadow-[0_8px_32px_rgba(0,0,0,0.6)]`}
    >
      <span className={cfg.text}>{cfg.icon}</span>
      <span className="text-white">{message}</span>
      <button onClick={onDismiss} className="ml-2 text-[#5a5a5a] hover:text-white transition-colors">
        <X size={12} />
      </button>
    </motion.div>
  );
};

// ── Achievement Toast ──────────────────────────────────────────────────────
interface AchievementToastProps {
  title: string;
  description: string;
  xp: number;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ title, description, xp, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
      className="fixed top-6 right-4 z-[200] w-72 bg-[#141414] border border-[#3a3a3a] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 shimmer pointer-events-none" />

      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 bg-[rgba(202,253,0,0.12)] border border-[rgba(202,253,0,0.3)] flex items-center justify-center flex-shrink-0">
          <Trophy size={18} className="text-[#cafd00]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-headline font-black text-[#cafd00] uppercase tracking-[0.25em] mb-0.5">
            Achievement Unlocked
          </p>
          <p className="font-headline font-black text-white text-[13px] uppercase tracking-tight leading-tight">{title}</p>
          <p className="text-[#8a8a8a] text-[10px] mt-0.5 leading-snug">{description}</p>
          <p className="text-[#cafd00] font-headline font-black text-[11px] mt-1.5">+{xp} XP</p>
        </div>
        <button onClick={onDismiss} className="text-[#5a5a5a] hover:text-white transition-colors flex-shrink-0">
          <X size={12} />
        </button>
      </div>
    </motion.div>
  );
};

// ── XP Float ───────────────────────────────────────────────────────────────
interface XPFloatProps {
  amount: number;
  onDone: () => void;
}

export const XPFloat: React.FC<XPFloatProps> = ({ amount, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="xp-float pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[300]">
      <span className="font-headline font-black text-2xl text-[#cafd00] text-glow-primary">
        +{amount} XP
      </span>
    </div>
  );
};
