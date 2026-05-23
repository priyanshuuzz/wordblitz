import React, { memo } from "react";
import { motion } from "motion/react";
import { Avatar } from "../ui/Avatar";

interface Player {
  id: string;
  username: string;
  avatar: string;
  status: "active" | "eliminated" | "forfeited";
  lives: number;
}

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  isMe: boolean;
  isThinking?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = memo(({ player, isCurrentTurn, isMe, isThinking = false }) => {
  const isOut = player.status === "eliminated" || player.status === "forfeited";

  return (
    <motion.div
      layout
      className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2 min-w-[148px] relative transition-all duration-200 ${
        isOut
          ? "opacity-30"
          : isCurrentTurn
          ? "bg-[#1e1e1e] border-l-2 border-[#cafd00]"
          : "bg-[#141414] border-l-2 border-transparent"
      }`}
    >
      <Avatar
        src={player.avatar}
        size="sm"
        isActive={isCurrentTurn && !isOut}
        isEliminated={player.status === "eliminated"}
        isForfeited={player.status === "forfeited"}
      />

      <div className="flex flex-col min-w-0">
        <span
          className={`font-headline font-bold text-[10px] uppercase tracking-wide truncate ${
            isMe ? "text-[#cafd00]" : isCurrentTurn ? "text-white" : "text-[#8a8a8a]"
          }`}
        >
          {player.username}
          {isMe && <span className="text-[#5a5a5a] ml-1">(you)</span>}
        </span>

        {/* Lives */}
        <div className="flex gap-0.5 mt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-1 transition-colors duration-300 ${
                i < player.lives && !isOut ? "bg-[#cafd00]" : "bg-[#2a2a2a]"
              }`}
            />
          ))}
        </div>

        {/* Thinking dots */}
        {isThinking && (
          <div className="flex gap-0.5 mt-1">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-[#cafd00]"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 0.8, repeat: Infinity, delay }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Current turn glow */}
      {isCurrentTurn && !isOut && (
        <motion.div
          className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#cafd00]"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
});

PlayerCard.displayName = "PlayerCard";
