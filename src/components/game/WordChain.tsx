import React, { useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { wordChipVariants } from "../../lib/animations";

interface WordChainProps {
  words: string[];
  className?: string;
}

export const WordChain: React.FC<WordChainProps> = memo(({ words, className = "" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest word
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: "smooth",
      });
    }
  }, [words.length]);

  return (
    <div
      ref={scrollRef}
      className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-1 ${className}`}
    >
      <AnimatePresence initial={false}>
        {words.map((word, i) => {
          const isLast = i === words.length - 1;
          const lastLetter = word.slice(-1).toUpperCase();
          const body = word.slice(0, -1).toUpperCase();

          return (
            <React.Fragment key={`${word}-${i}`}>
              <motion.div
                variants={wordChipVariants}
                initial="initial"
                animate="animate"
                className={`flex-shrink-0 flex items-center font-headline font-black text-[11px] uppercase tracking-wide px-2 py-1 ${
                  isLast
                    ? "bg-[rgba(202,253,0,0.12)] border border-[rgba(202,253,0,0.4)]"
                    : "bg-[#1e1e1e] border border-[#2a2a2a]"
                }`}
              >
                <span className={isLast ? "text-[#f3ffca]" : "text-[#5a5a5a]"}>{body}</span>
                <span
                  className={`${isLast ? "text-[#cafd00] text-glow-primary" : "text-[#8a8a8a]"}`}
                  style={isLast ? { textShadow: "0 0 8px rgba(202,253,0,0.8)" } : {}}
                >
                  {lastLetter}
                </span>
              </motion.div>

              {i < words.length - 1 && (
                <span className="text-[#2a2a2a] text-[10px] flex-shrink-0 font-mono">→</span>
              )}
            </React.Fragment>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

WordChain.displayName = "WordChain";
