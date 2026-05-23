import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, UserPlus, Search, MessageCircle, Trophy, Swords,
  Check, X, Clock, Flame, ChevronRight, Globe, Users,
} from "lucide-react";
import { useGameStore } from "../../store";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { StatusBadge } from "../ui/Badge";
import { listContainerVariants, listItemVariants, buttonTap } from "../../lib/animations";
import { sfx } from "../../lib/sound";

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_FRIENDS = [
  { uid: "f1", username: "VIPER_99",    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Viper",  mmr: 1420, rank: "platinum", status: "online",  streak: 7  },
  { uid: "f2", username: "SWIFT_KEY",   avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Swift",  mmr: 1280, rank: "gold",     status: "playing", streak: 3  },
  { uid: "f3", username: "LEX_KING",    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lex",    mmr: 1650, rank: "diamond",  status: "offline", streak: 0  },
  { uid: "f4", username: "BYTE_ME",     avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Byte",   mmr: 1100, rank: "silver",   status: "online",  streak: 12 },
  { uid: "f5", username: "NEON_KING",   avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neon",   mmr: 1820, rank: "master",   status: "online",  streak: 21 },
];

const MOCK_REQUESTS = [
  { uid: "r1", username: "FAST_FIN",  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fast",  mmr: 980,  rank: "silver"  },
  { uid: "r2", username: "WORD_WOLF", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wolf",  mmr: 1350, rank: "gold"    },
];

const MOCK_CHAT: Record<string, { from: "me" | "them"; text: string; ts: number }[]> = {
  f1: [
    { from: "them", text: "GG last match! That QUARTZ play was insane 🔥", ts: Date.now() - 3600_000 },
    { from: "me",   text: "Thanks! You almost had me with XENON though", ts: Date.now() - 3500_000 },
    { from: "them", text: "Rematch?", ts: Date.now() - 60_000 },
  ],
  f2: [
    { from: "them", text: "Wanna do a private room?", ts: Date.now() - 7200_000 },
  ],
};

const statusColor: Record<string, string> = {
  online:  "bg-[#06d6a0]",
  playing: "bg-[#cafd00]",
  offline: "bg-[#3a3a3a]",
};

const rankColor: Record<string, string> = {
  bronze:      "text-[#cd7f32]",
  silver:      "text-[#c0c0c0]",
  gold:        "text-[#ffd700]",
  platinum:    "text-[#e5e4e2]",
  diamond:     "text-[#b9f2ff]",
  master:      "text-[#ff51fa]",
  grandmaster: "text-[#ff51fa]",
};

// ── Chat Modal ─────────────────────────────────────────────────────────────
const ChatModal = ({ friend, onClose }: { friend: typeof MOCK_FRIENDS[0]; onClose: () => void }) => {
  const [messages, setMessages] = useState(MOCK_CHAT[friend.uid] ?? []);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    sfx.click();
    setMessages(m => [...m, { from: "me", text: input.trim(), ts: Date.now() }]);
    setInput("");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="relative w-full max-w-md bg-[#141414] border border-[#2a2a2a] flex flex-col"
        style={{ height: "60dvh" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[#1e1e1e]">
          <div className="relative">
            <img src={friend.avatar} alt="" className="w-9 h-9 object-cover" />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#141414] ${statusColor[friend.status]}`} />
          </div>
          <div>
            <p className="font-headline font-black text-[13px] uppercase tracking-tight">{friend.username}</p>
            <p className={`text-[9px] font-bold uppercase tracking-widest ${rankColor[friend.rank]}`}>{friend.rank}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-[#5a5a5a] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3 no-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 text-[12px] font-bold ${
                m.from === "me"
                  ? "bg-[#cafd00] text-[#516700]"
                  : "bg-[#1e1e1e] text-white border border-[#2a2a2a]"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-[#1e1e1e] flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message..."
            className="flex-grow bg-[#0f0f0f] border border-[#2a2a2a] px-3 py-2 text-white text-[12px] font-mono focus:outline-none focus:border-[#cafd00] placeholder-[#3a3a3a]"
          />
          <button
            onClick={send}
            className="bg-[#cafd00] text-[#516700] px-4 font-headline font-black text-[11px] uppercase hover:brightness-110 transition-all"
          >
            Send
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Social Screen ─────────────────────────────────────────────────────
export const SocialScreen: React.FC = () => {
  const { setGameState, username, avatar } = useGameStore();
  const [tab, setTab] = useState<"friends" | "requests" | "discover">("friends");
  const [friends, setFriends] = useState(MOCK_FRIENDS);
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [chatFriend, setChatFriend] = useState<typeof MOCK_FRIENDS[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const onlineFriends = friends.filter(f => f.status !== "offline");
  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const acceptRequest = (uid: string) => {
    sfx.achievement();
    const req = requests.find(r => r.uid === uid);
    if (req) {
      setFriends(f => [...f, { ...req, status: "online" as const, streak: 0 }]);
      setRequests(r => r.filter(x => x.uid !== uid));
    }
  };

  const declineRequest = (uid: string) => {
    sfx.click();
    setRequests(r => r.filter(x => x.uid !== uid));
  };

  const challengeFriend = (f: typeof MOCK_FRIENDS[0]) => {
    sfx.click();
    setGameState({ status: "private_room" });
  };

  return (
    <div className="flex flex-col">
      {/* Sub-tabs */}
      <div className="flex w-full bg-[#0f0f0f] border-b border-[#1a1a1a] sticky top-16 z-20">
        {(["friends", "requests", "discover"] as const).map(t => (
          <button
            key={t}
            onClick={() => { sfx.click(); setTab(t); }}
            className={`flex-1 py-3.5 font-headline font-black text-[10px] tracking-widest uppercase transition-all relative ${
              tab === t ? "bg-[#cafd00] text-[#516700]" : "text-[#5a5a5a] hover:text-white"
            }`}
          >
            {t}
            {t === "requests" && requests.length > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-[#ff51fa] text-[#400040] text-[8px] font-black flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {tab === "friends" && (
        <div className="flex flex-col gap-0">
          {/* Search */}
          <div className="px-4 pt-4 pb-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a5a]" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full bg-[#141414] border border-[#2a2a2a] pl-9 pr-4 py-2.5 text-white text-[12px] font-mono focus:outline-none focus:border-[#cafd00] placeholder-[#3a3a3a]"
              />
            </div>
          </div>

          {/* Online count */}
          <div className="px-4 pb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#06d6a0]" />
            <span className="text-[10px] font-headline font-bold text-[#5a5a5a] uppercase tracking-widest">
              {onlineFriends.length} online
            </span>
          </div>

          {/* Friends list */}
          <motion.div variants={listContainerVariants} initial="initial" animate="animate" className="flex flex-col gap-1 px-4 pb-6">
            {filteredFriends.map(f => (
              <motion.div
                key={f.uid}
                variants={listItemVariants}
                className="flex items-center gap-3 p-3 bg-[#141414] border border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <img src={f.avatar} alt="" className="w-10 h-10 object-cover" />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#141414] ${statusColor[f.status]}`} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-black text-[12px] uppercase tracking-tight truncate">{f.username}</span>
                    {f.streak > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Flame size={10} className="text-[#ff5c3a] streak-fire" />
                        <span className="text-[9px] font-bold text-[#ff5c3a]">{f.streak}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-bold uppercase ${rankColor[f.rank]}`}>{f.rank}</span>
                    <span className="text-[9px] text-[#3a3a3a]">·</span>
                    <span className="text-[9px] text-[#5a5a5a] font-mono">{f.mmr} MMR</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {f.status !== "offline" && (
                    <motion.button
                      whileTap={buttonTap}
                      onClick={() => challengeFriend(f)}
                      className="w-8 h-8 bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center text-[#cafd00] hover:bg-[#282828] transition-colors"
                      title="Challenge"
                    >
                      <Swords size={13} />
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={buttonTap}
                    onClick={() => setChatFriend(f)}
                    className="w-8 h-8 bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center text-[#ff51fa] hover:bg-[#282828] transition-colors"
                    title="Chat"
                  >
                    <MessageCircle size={13} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
            {filteredFriends.length === 0 && (
              <div className="py-12 text-center">
                <Users size={32} className="text-[#2a2a2a] mx-auto mb-3" />
                <p className="font-headline font-bold text-[#3a3a3a] text-[11px] uppercase tracking-widest">No friends found</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Requests tab */}
      {tab === "requests" && (
        <div className="px-4 pt-4 flex flex-col gap-3 pb-6">
          {requests.length === 0 ? (
            <div className="py-12 text-center">
              <UserPlus size={32} className="text-[#2a2a2a] mx-auto mb-3" />
              <p className="font-headline font-bold text-[#3a3a3a] text-[11px] uppercase tracking-widest">No pending requests</p>
            </div>
          ) : (
            <motion.div variants={listContainerVariants} initial="initial" animate="animate" className="space-y-2">
              {requests.map(r => (
                <motion.div key={r.uid} variants={listItemVariants}
                  className="flex items-center gap-3 p-4 bg-[#141414] border border-[#1e1e1e] border-l-4 border-l-[#ff51fa]">
                  <img src={r.avatar} alt="" className="w-10 h-10 object-cover flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <p className="font-headline font-black text-[13px] uppercase tracking-tight">{r.username}</p>
                    <p className={`text-[9px] font-bold uppercase ${rankColor[r.rank]}`}>{r.rank} · {r.mmr} MMR</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => acceptRequest(r.uid)}
                      className="w-9 h-9 bg-[#cafd00] text-[#516700] flex items-center justify-center hover:brightness-110 transition-all">
                      <Check size={16} />
                    </button>
                    <button onClick={() => declineRequest(r.uid)}
                      className="w-9 h-9 bg-[#1e1e1e] border border-[#2a2a2a] text-[#ff5c3a] flex items-center justify-center hover:bg-[#282828] transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Discover tab */}
      {tab === "discover" && (
        <div className="px-4 pt-4 flex flex-col gap-4 pb-6">
          <p className="text-[10px] font-headline font-bold text-[#5a5a5a] uppercase tracking-widest">Players Near Your MMR</p>
          {[
            { uid: "d1", username: "SYNTAX_X",   avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Syntax", mmr: 1050, rank: "silver",   wins: 42  },
            { uid: "d2", username: "BLITZ_ACE",  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Blitz",  mmr: 1180, rank: "gold",     wins: 87  },
            { uid: "d3", username: "WORD_STORM",  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Storm",  mmr: 1320, rank: "gold",     wins: 134 },
            { uid: "d4", username: "CIPHER_9",   avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cipher", mmr: 980,  rank: "silver",   wins: 28  },
          ].map(p => (
            <div key={p.uid} className="flex items-center gap-3 p-4 bg-[#141414] border border-[#1e1e1e]">
              <img src={p.avatar} alt="" className="w-10 h-10 object-cover flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <p className="font-headline font-black text-[13px] uppercase tracking-tight">{p.username}</p>
                <p className={`text-[9px] font-bold uppercase ${rankColor[p.rank]}`}>{p.rank} · {p.mmr} MMR · {p.wins} wins</p>
              </div>
              <button
                onClick={() => { sfx.click(); setAddedIds(s => new Set([...s, p.uid])); }}
                disabled={addedIds.has(p.uid)}
                className={`flex items-center gap-1.5 px-3 py-2 font-headline font-black text-[10px] uppercase tracking-widest transition-all ${
                  addedIds.has(p.uid)
                    ? "bg-[#1e1e1e] text-[#5a5a5a] border border-[#2a2a2a] cursor-default"
                    : "bg-[#cafd00] text-[#516700] hover:brightness-110"
                }`}
              >
                {addedIds.has(p.uid) ? <><Check size={11} /> Added</> : <><UserPlus size={11} /> Add</>}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Chat modal */}
      <AnimatePresence>
        {chatFriend && (
          <ChatModal friend={chatFriend} onClose={() => setChatFriend(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
