import React from "react";
import { motion } from "motion/react";

interface AvatarProps {
  src: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isActive?: boolean;
  isEliminated?: boolean;
  isForfeited?: boolean;
  showRing?: boolean;
  className?: string;
}

const sizes = {
  xs: "w-7 h-7",
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

const ringColors = {
  active:     "border-[#cafd00] shadow-[0_0_12px_rgba(202,253,0,0.5)]",
  inactive:   "border-[#3a3a3a]",
  eliminated: "border-[#ff5c3a] opacity-40",
  forfeited:  "border-[#3a3a3a] opacity-40",
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "avatar",
  size = "md",
  isActive = false,
  isEliminated = false,
  isForfeited = false,
  showRing = true,
  className = "",
}) => {
  const ringClass = isEliminated
    ? ringColors.eliminated
    : isForfeited
    ? ringColors.forfeited
    : isActive
    ? ringColors.active
    : ringColors.inactive;

  return (
    <div className={`relative flex-shrink-0 ${sizes[size]} ${className}`}>
      <div
        className={`w-full h-full overflow-hidden ${showRing ? `border-2 ${ringClass}` : ""} ${
          isEliminated || isForfeited ? "grayscale" : ""
        }`}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>

      {/* Active pulse ring */}
      {isActive && !isEliminated && !isForfeited && (
        <motion.div
          className="absolute inset-0 border-2 border-[#cafd00] pointer-events-none"
          animate={{ opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Eliminated X overlay */}
      {isEliminated && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="text-[#ff5c3a] font-headline font-black text-lg">✕</span>
        </div>
      )}

      {/* Forfeited overlay */}
      {isForfeited && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="text-[8px] font-black text-white bg-[#3a3a3a] px-1 py-0.5 uppercase tracking-tighter">OUT</span>
        </div>
      )}
    </div>
  );
};
