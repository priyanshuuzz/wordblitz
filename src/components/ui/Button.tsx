import React from "react";
import { motion } from "motion/react";
import { buttonTap } from "../../lib/animations";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "google";
type Size    = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:   "btn-primary bg-[#cafd00] text-[#516700]",
  secondary: "btn-secondary border border-[#3a3a3a] text-white hover:border-[#f3ffca] hover:bg-[rgba(243,255,202,0.05)]",
  danger:    "border border-[rgba(255,92,58,0.35)] text-[#ff5c3a] hover:bg-[rgba(255,92,58,0.08)] hover:border-[#ff5c3a] transition-all font-headline font-bold uppercase tracking-widest",
  ghost:     "text-[#8a8a8a] hover:text-white transition-colors font-bold uppercase tracking-widest",
  google:    "bg-[#141414] border border-[#3a3a3a] text-white hover:border-[#f3ffca] hover:bg-[#1e1e1e] transition-all font-bold uppercase tracking-widest",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9  px-4  text-[11px]",
  md: "h-11 px-5  text-[12px]",
  lg: "h-14 px-6  text-[13px]",
  xl: "h-16 px-8  text-[15px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "lg", loading, icon, iconRight, fullWidth, children, className = "", disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref as any}
        whileTap={isDisabled ? {} : buttonTap}
        disabled={isDisabled}
        className={[
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? "w-full" : "",
          "flex items-center justify-center gap-2.5 font-headline font-black",
          isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
          className,
        ].join(" ")}
        {...(props as any)}
      >
        {loading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
          </>
        )}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
