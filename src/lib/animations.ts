// Shared Framer Motion variants — import from here, never define inline
import type { Variants, Transition } from "motion/react";

// ── Easings ────────────────────────────────────────────────────────────────
export const ease = {
  snap:   [0.34, 1.56, 0.64, 1]  as [number,number,number,number],
  out:    [0.16, 1,    0.3,  1]  as [number,number,number,number],
  inOut:  [0.65, 0,    0.35, 1]  as [number,number,number,number],
  linear: [0,    0,    1,    1]  as [number,number,number,number],
};

// ── Transitions ────────────────────────────────────────────────────────────
export const t = {
  instant: { duration: 0.08 } satisfies Transition,
  fast:    { duration: 0.15, ease: ease.out } satisfies Transition,
  normal:  { duration: 0.25, ease: ease.out } satisfies Transition,
  slow:    { duration: 0.4,  ease: ease.out } satisfies Transition,
  snap:    { duration: 0.2,  ease: ease.snap } satisfies Transition,
  spring:  { type: "spring", stiffness: 400, damping: 30 } satisfies Transition,
};

// ── Page transitions ───────────────────────────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: ease.out } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: ease.inOut } },
};

export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: t.normal },
  exit:    { opacity: 0, y: 24, transition: t.fast },
};

export const slideDownVariants: Variants = {
  initial: { opacity: 0, y: -24 },
  animate: { opacity: 1, y: 0, transition: t.normal },
  exit:    { opacity: 0, y: -24, transition: t.fast },
};

// ── Modal ──────────────────────────────────────────────────────────────────
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 16 },
  animate: { opacity: 1, scale: 1,    y: 0,  transition: t.snap },
  exit:    { opacity: 0, scale: 0.94, y: 8,  transition: t.fast },
};

export const bottomSheetVariants: Variants = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: ease.out } },
  exit:    { opacity: 0, y: "100%", transition: { duration: 0.2, ease: ease.inOut } },
};

// ── List stagger ───────────────────────────────────────────────────────────
export const listContainerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: t.normal },
};

export const gridContainerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const gridItemVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: t.snap },
};

// ── Word chip ──────────────────────────────────────────────────────────────
export const wordChipVariants: Variants = {
  initial: { opacity: 0, scale: 0.7, y: 4 },
  animate: { opacity: 1, scale: 1,   y: 0, transition: { duration: 0.2, ease: ease.snap } },
};

// ── Card hover ─────────────────────────────────────────────────────────────
export const cardHoverVariants: Variants = {
  rest:  { y: 0,  transition: t.fast },
  hover: { y: -4, transition: t.fast },
};

// ── Button press ───────────────────────────────────────────────────────────
export const buttonTap = { scale: 0.97 };
export const buttonHoverPrimary = {
  filter: "brightness(1.08)",
  boxShadow: "0 0 24px rgba(202, 253, 0, 0.35)",
};
export const buttonHoverSecondary = {
  borderColor: "#f3ffca",
  backgroundColor: "rgba(243, 255, 202, 0.05)",
};

// ── Match found ────────────────────────────────────────────────────────────
export const matchFoundVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit:    { opacity: 0, transition: { duration: 0.4 } },
};

export const matchFoundTextVariants: Variants = {
  initial: { scale: 0.4, letterSpacing: "0.5em", opacity: 0 },
  animate: {
    scale: 1,
    letterSpacing: "0.05em",
    opacity: 1,
    transition: { duration: 0.5, ease: ease.snap },
  },
};

// ── Victory / Defeat ───────────────────────────────────────────────────────
export const victoryTextVariants: Variants = {
  initial: { scale: 1.6, opacity: 0 },
  animate: { scale: 1,   opacity: 1, transition: { duration: 0.6, ease: ease.snap } },
};

export const xpRowVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
};

export const xpContainerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } },
};

// ── Rank up ────────────────────────────────────────────────────────────────
export const rankUpVariants: Variants = {
  initial: { opacity: 0, scale: 0.5, rotate: -10 },
  animate: {
    opacity: 1, scale: 1, rotate: 0,
    transition: { duration: 0.5, ease: ease.snap },
  },
};

// ── Shake (error) ──────────────────────────────────────────────────────────
export const shakeVariants: Variants = {
  shake: {
    x: [-8, 8, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 },
  },
  rest: { x: 0 },
};

// ── Splash ─────────────────────────────────────────────────────────────────
export const splashVariants: Variants = {
  initial: { opacity: 1 },
  exit:    { opacity: 0, transition: { duration: 0.5, ease: ease.inOut } },
};

export const splashLogoVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1,   opacity: 1, transition: t.snap },
};
