import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

interface ProgressBarProps {
  value: number;        // 0–100
  max?: number;
  color?: string;
  bgColor?: string;
  height?: number;
  animated?: boolean;
  glow?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = "#cafd00",
  bgColor = "#1e1e1e",
  height = 4,
  animated = true,
  glow = false,
  className = "",
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{ height, backgroundColor: bgColor }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      aria-valuemin={0}
    >
      <motion.div
        style={{
          height: "100%",
          backgroundColor: color,
          boxShadow: glow ? `0 0 8px ${color}` : "none",
        }}
        initial={animated ? { width: 0 } : { width: `${pct}%` }}
        animate={{ width: `${pct}%` }}
        transition={animated ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
      />
    </div>
  );
};

// ── Timer bar — CSS-driven for GPU smoothness ──────────────────────────────
interface TimerBarProps {
  value: number;   // 0–1 (fraction remaining)
  duration: number; // total seconds
}

export const TimerBar: React.FC<TimerBarProps> = ({ value, duration }) => {
  const barRef = useRef<HTMLDivElement>(null);

  // Derive color from value
  const color =
    value > 0.6 ? "#cafd00"
    : value > 0.3 ? "#ffd166"
    : value > 0.1 ? "#ff5c3a"
    : "#ff2200";

  const isLow      = value <= 0.3;
  const isCritical = value <= 0.1;

  // CSS custom property update — no React re-render on every tick
  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty("--timer-pct", `${value * 100}%`);
      barRef.current.style.setProperty("--timer-color", color);
    }
  }, [value, color]);

  return (
    <div className="relative w-full" style={{ height: 6 }}>
      {/* Track */}
      <div className="absolute inset-0 bg-[#1e1e1e]" />
      {/* Fill — CSS driven */}
      <div
        ref={barRef}
        className={`absolute top-0 left-0 h-full timer-bar ${isCritical ? "heartbeat" : ""}`}
        style={{
          width: `${value * 100}%`,
          backgroundColor: color,
          boxShadow: isLow ? `0 0 10px ${color}` : "none",
          transition: "width 100ms linear, background-color 300ms ease, box-shadow 300ms ease",
        }}
      />
      {/* Screen vignette when low */}
      {isLow && (
        <div
          className="pointer-events-none fixed inset-0 z-[999]"
          style={{
            boxShadow: `inset 0 0 ${isCritical ? 120 : 60}px rgba(255, 92, 58, ${isCritical ? 0.35 : 0.18})`,
            transition: "box-shadow 300ms ease",
          }}
        />
      )}
    </div>
  );
};
