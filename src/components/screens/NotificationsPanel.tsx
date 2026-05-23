import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, Check, Trophy, Swords, Gift, Info, Trash2 } from "lucide-react";
import {
  subscribeNotifications, markAllRead, markRead, clearAll,
  type AppNotification,
} from "../../lib/notifications";
import { backdropVariants, buttonTap } from "../../lib/animations";
import { sfx } from "../../lib/sound";

const typeIcon: Record<AppNotification["type"], React.ReactNode> = {
  match:       <Swords size={14} className="text-[#cafd00]" />,
  achievement: <Trophy size={14} className="text-[#ffd700]" />,
  friend:      <Bell size={14} className="text-[#ff51fa]" />,
  system:      <Info size={14} className="text-[#b9f2ff]" />,
  reward:      <Gift size={14} className="text-[#06d6a0]" />,
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const [notifs, setNotifs] = useState<AppNotification[]>([]);

  useEffect(() => {
    return subscribeNotifications(setNotifs);
  }, []);

  const handleMarkAll = () => {
    sfx.click();
    markAllRead();
  };

  const handleClear = () => {
    sfx.click();
    clearAll();
  };

  const handleRead = (id: string) => {
    markRead(id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <motion.div
            variants={backdropVariants} initial="initial" animate="animate" exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="relative w-full max-w-sm bg-[#141414] border-l border-[#1e1e1e] flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1e1e1e]">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#cafd00]" />
                <h2 className="font-headline font-black text-[15px] uppercase tracking-tighter">Notifications</h2>
                {notifs.filter(n => !n.read).length > 0 && (
                  <span className="w-5 h-5 bg-[#ff51fa] text-[#400040] text-[9px] font-black flex items-center justify-center">
                    {notifs.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="text-[#5a5a5a] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Actions */}
            {notifs.length > 0 && (
              <div className="flex items-center justify-between px-5 py-2 border-b border-[#1e1e1e]">
                <button onClick={handleMarkAll}
                  className="flex items-center gap-1.5 text-[10px] font-headline font-bold text-[#cafd00] uppercase tracking-widest hover:brightness-125 transition-all">
                  <Check size={11} /> Mark all read
                </button>
                <button onClick={handleClear}
                  className="flex items-center gap-1.5 text-[10px] font-headline font-bold text-[#5a5a5a] uppercase tracking-widest hover:text-[#ff5c3a] transition-colors">
                  <Trash2 size={11} /> Clear all
                </button>
              </div>
            )}

            {/* List */}
            <div className="flex-grow overflow-y-auto no-scrollbar">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                  <Bell size={32} className="text-[#2a2a2a]" />
                  <p className="font-headline font-bold text-[#3a3a3a] text-[11px] uppercase tracking-widest">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1e1e1e]">
                  {notifs.map(n => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-3 p-4 cursor-pointer transition-colors hover:bg-[#1a1a1a] ${
                        !n.read ? "border-l-2 border-l-[#cafd00]" : ""
                      }`}
                      onClick={() => handleRead(n.id)}
                    >
                      <div className="w-8 h-8 bg-[#0f0f0f] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {typeIcon[n.type]}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-headline font-black text-[12px] uppercase tracking-tight leading-tight ${
                            !n.read ? "text-white" : "text-[#8a8a8a]"
                          }`}>{n.title}</p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#cafd00] flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#5a5a5a] mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-[9px] text-[#3a3a3a] mt-1 font-mono">{timeAgo(n.timestamp)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
