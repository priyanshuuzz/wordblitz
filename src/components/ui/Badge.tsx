import React from "react";

type RankTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master" | "grandmaster";

interface RankBadgeProps {
  tier: RankTier;
  division?: "I" | "II" | "III";
  size?: "sm" | "md" | "lg";
  showDivision?: boolean;
}

const tierConfig: Record<RankTier, { label: string; className: string; bg: string }> = {
  bronze:      { label: "BRONZE",      className: "rank-bronze",  bg: "rgba(205,127,50,0.12)"  },
  silver:      { label: "SILVER",      className: "rank-silver",  bg: "rgba(192,192,192,0.12)" },
  gold:        { label: "GOLD",        className: "rank-gold",    bg: "rgba(255,215,0,0.12)"   },
  platinum:    { label: "PLATINUM",    className: "rank-plat",    bg: "rgba(229,228,226,0.12)" },
  diamond:     { label: "DIAMOND",     className: "rank-diamond", bg: "rgba(185,242,255,0.12)" },
  master:      { label: "MASTER",      className: "rank-master",  bg: "rgba(255,81,250,0.12)"  },
  grandmaster: { label: "GRANDMASTER", className: "rank-master",  bg: "rgba(255,81,250,0.15)"  },
};

const sizeClasses = {
  sm: "text-[9px]  px-2   py-0.5",
  md: "text-[10px] px-2.5 py-1",
  lg: "text-[12px] px-3   py-1.5",
};

export const RankBadge: React.FC<RankBadgeProps> = ({
  tier,
  division = "I",
  size = "md",
  showDivision = true,
}) => {
  const config = tierConfig[tier];
  return (
    <span
      className={`inline-flex items-center font-headline font-black uppercase tracking-widest ${config.className} ${sizeClasses[size]}`}
      style={{ backgroundColor: config.bg, border: "1px solid currentColor", borderOpacity: 0.3 }}
    >
      {config.label}{showDivision && tier !== "master" && tier !== "grandmaster" ? ` ${division}` : ""}
    </span>
  );
};

// ── XP Badge ───────────────────────────────────────────────────────────────
interface XPBadgeProps {
  value: number;
  positive?: boolean;
  size?: "sm" | "md";
}

export const XPBadge: React.FC<XPBadgeProps> = ({ value, positive = true, size = "sm" }) => (
  <span
    className={`font-headline font-black uppercase tracking-widest ${
      size === "sm" ? "text-[10px]" : "text-[12px]"
    } ${positive ? "text-[#cafd00]" : "text-[#ff5c3a]"}`}
  >
    {positive ? "+" : ""}{value} XP
  </span>
);

// ── Status Badge ───────────────────────────────────────────────────────────
interface StatusBadgeProps {
  label: string;
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "muted";
}

const statusColors = {
  primary:   "bg-[rgba(202,253,0,0.12)]  text-[#cafd00]  border-[rgba(202,253,0,0.3)]",
  secondary: "bg-[rgba(255,81,250,0.12)] text-[#ff51fa]  border-[rgba(255,81,250,0.3)]",
  success:   "bg-[rgba(6,214,160,0.12)]  text-[#06d6a0]  border-[rgba(6,214,160,0.3)]",
  warning:   "bg-[rgba(255,209,102,0.12)]text-[#ffd166]  border-[rgba(255,209,102,0.3)]",
  error:     "bg-[rgba(255,92,58,0.12)]  text-[#ff5c3a]  border-[rgba(255,92,58,0.3)]",
  muted:     "bg-[rgba(255,255,255,0.06)]text-[#8a8a8a]  border-[rgba(255,255,255,0.1)]",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, color = "muted" }) => (
  <span
    className={`inline-flex items-center font-headline font-black text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border ${statusColors[color]}`}
  >
    {label}
  </span>
);
