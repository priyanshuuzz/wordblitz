import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag, Star, Lock, Check, Zap, Crown, Sparkles,
  ChevronRight, X, Trophy, Flame,
} from "lucide-react";
import { useGameStore } from "../../store";
import { Button } from "../ui/Button";
import { gridContainerVariants, gridItemVariants, backdropVariants, modalVariants, buttonTap } from "../../lib/animations";
import { sfx } from "../../lib/sound";

// ── Types ──────────────────────────────────────────────────────────────────
interface StoreItem {
  id: string;
  name: string;
  description: string;
  type: "avatar_frame" | "title" | "trail" | "emote" | "bundle";
  price: number;
  currency: "coins" | "gems" | "free";
  rarity: "common" | "rare" | "epic" | "legendary";
  owned?: boolean;
  preview?: string;
  new?: boolean;
  limited?: boolean;
}

const RARITY_CONFIG = {
  common:    { label: "Common",    color: "text-[#8a8a8a]",  bg: "bg-[rgba(138,138,138,0.1)]",  border: "border-[rgba(138,138,138,0.3)]"  },
  rare:      { label: "Rare",      color: "text-[#b9f2ff]",  bg: "bg-[rgba(185,242,255,0.1)]",  border: "border-[rgba(185,242,255,0.3)]"  },
  epic:      { label: "Epic",      color: "text-[#ff51fa]",  bg: "bg-[rgba(255,81,250,0.1)]",   border: "border-[rgba(255,81,250,0.3)]"   },
  legendary: { label: "Legendary", color: "text-[#ffd700]",  bg: "bg-[rgba(255,215,0,0.1)]",    border: "border-[rgba(255,215,0,0.3)]"    },
};

const STORE_ITEMS: StoreItem[] = [
  // Frames
  { id: "frame_neon",    name: "Neon Storm",    description: "Electric lime frame from Season 1", type: "avatar_frame", price: 800,  currency: "coins",  rarity: "epic",      new: true  },
  { id: "frame_cyber",   name: "Cyber Grid",    description: "Glowing grid pattern frame",        type: "avatar_frame", price: 500,  currency: "coins",  rarity: "rare"                  },
  { id: "frame_gold",    name: "Gold Champion", description: "For the elite few",                 type: "avatar_frame", price: 2,    currency: "gems",   rarity: "legendary", limited: true },
  { id: "frame_basic",   name: "Basic Frame",   description: "Clean and simple",                  type: "avatar_frame", price: 0,    currency: "free",   rarity: "common",    owned: true },
  // Titles
  { id: "title_blitz",   name: "The Blitzer",   description: "For speed demons",                  type: "title",        price: 300,  currency: "coins",  rarity: "rare"                  },
  { id: "title_lexicon", name: "Lexicon Lord",  description: "Master of words",                   type: "title",        price: 600,  currency: "coins",  rarity: "epic"                  },
  { id: "title_storm",   name: "Neon Storm",    description: "Season 1 exclusive title",          type: "title",        price: 1,    currency: "gems",   rarity: "legendary", limited: true },
  // Trails
  { id: "trail_fire",    name: "Fire Trail",    description: "Leave flames behind your words",    type: "trail",        price: 400,  currency: "coins",  rarity: "rare",      new: true  },
  { id: "trail_neon",    name: "Neon Pulse",    description: "Electric trail effect",             type: "trail",        price: 700,  currency: "coins",  rarity: "epic"                  },
  // Emotes
  { id: "emote_gg",      name: "GG",            description: "Classic good game emote",           type: "emote",        price: 100,  currency: "coins",  rarity: "common",    owned: true },
  { id: "emote_fire",    name: "On Fire",       description: "Show them you're blazing",          type: "emote",        price: 200,  currency: "coins",  rarity: "common"                },
  { id: "emote_crown",   name: "Crown",         description: "For when you dominate",             type: "emote",        price: 350,  currency: "coins",  rarity: "rare"                  },
  // Bundle
  { id: "bundle_s1",     name: "Season 1 Pack", description: "Frame + Title + Trail bundle",      type: "bundle",       price: 3,    currency: "gems",   rarity: "legendary", limited: true, new: true },
];

// ── Battle Pass Tiers ──────────────────────────────────────────────────────
const BATTLE_PASS_TIERS = Array.from({ length: 20 }, (_, i) => ({
  tier: i + 1,
  reward: i % 5 === 4
    ? { type: "epic", label: i === 9 ? "Neon Frame" : i === 19 ? "Storm Title" : "Epic Reward", icon: "👑" }
    : i % 2 === 0
    ? { type: "coins", label: `${(i + 1) * 50} Coins`, icon: "🪙" }
    : { type: "xp", label: `${(i + 1) * 25} XP`, icon: "⚡" },
  unlocked: i < 7,
  free: i % 3 === 0,
}));

// ── Purchase Modal ─────────────────────────────────────────────────────────
const PurchaseModal = ({
  item, onClose, onConfirm,
}: { item: StoreItem; onClose: () => void; onConfirm: () => void }) => {
  const cfg = RARITY_CONFIG[item.rarity];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div variants={backdropVariants} initial="initial" animate="animate" exit="exit"
        onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div variants={modalVariants} initial="initial" animate="animate" exit="exit"
        className={`relative w-full max-w-sm bg-[#141414] border ${cfg.border} p-7`}>
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 mb-4 ${cfg.bg} border ${cfg.border}`}>
          <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
        </div>
        <h2 className="font-headline font-black text-xl uppercase tracking-tighter mb-1">{item.name}</h2>
        <p className="text-[#8a8a8a] text-[12px] mb-6">{item.description}</p>
        <div className="flex items-center justify-between mb-6 p-4 bg-[#0f0f0f] border border-[#1e1e1e]">
          <span className="font-headline font-bold text-[11px] uppercase tracking-widest text-[#5a5a5a]">Price</span>
          <span className={`font-headline font-black text-xl ${item.currency === "gems" ? "text-[#ff51fa]" : item.currency === "free" ? "text-[#06d6a0]" : "text-[#cafd00]"}`}>
            {item.currency === "free" ? "FREE" : `${item.price} ${item.currency.toUpperCase()}`}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="primary" fullWidth onClick={onConfirm} className="h-12">
            {item.currency === "free" ? "Claim Free" : "Purchase"}
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose} className="h-10 text-[#5a5a5a]">Cancel</Button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Store Screen ──────────────────────────────────────────────────────
export const StoreScreen: React.FC = () => {
  const [tab, setTab] = useState<"featured" | "cosmetics" | "battlepass">("featured");
  const [filter, setFilter] = useState<"all" | "avatar_frame" | "title" | "trail" | "emote">("all");
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [ownedItems, setOwnedItems] = useState<Set<string>>(new Set(STORE_ITEMS.filter(i => i.owned).map(i => i.id)));
  const [coins] = useState(1250);
  const [gems] = useState(5);
  const [bpLevel] = useState(7);

  const handlePurchase = () => {
    if (!selectedItem) return;
    sfx.achievement();
    setOwnedItems(s => new Set([...s, selectedItem.id]));
    setSelectedItem(null);
  };

  const filteredItems = STORE_ITEMS.filter(i =>
    (filter === "all" || i.type === filter) && i.type !== "bundle"
  );

  return (
    <div className="flex flex-col">
      {/* Currency bar */}
      <div className="flex items-center justify-end gap-4 px-4 py-3 bg-[#0f0f0f] border-b border-[#1a1a1a]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#cafd00] text-[13px]">🪙</span>
          <span className="font-headline font-black text-[13px] text-[#cafd00]">{coins.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#ff51fa] text-[13px]">💎</span>
          <span className="font-headline font-black text-[13px] text-[#ff51fa]">{gems}</span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex w-full bg-[#0f0f0f] border-b border-[#1a1a1a] sticky top-16 z-20">
        {(["featured", "cosmetics", "battlepass"] as const).map(t => (
          <button key={t} onClick={() => { sfx.click(); setTab(t); }}
            className={`flex-1 py-3.5 font-headline font-black text-[10px] tracking-widest uppercase transition-all ${
              tab === t ? "bg-[#cafd00] text-[#516700]" : "text-[#5a5a5a] hover:text-white"
            }`}>
            {t === "battlepass" ? "Battle Pass" : t}
          </button>
        ))}
      </div>

      {/* Featured */}
      {tab === "featured" && (
        <div className="p-4 flex flex-col gap-4">
          {/* Hero banner */}
          <div className="relative bg-[#141414] border-2 border-[#ff51fa] p-6 overflow-hidden">
            <div className="absolute inset-0 shimmer pointer-events-none opacity-30" />
            <div className="absolute top-0 right-0 bg-[#ff51fa] text-[#400040] px-3 py-1 font-headline font-black text-[9px] uppercase tracking-widest">
              Limited Time
            </div>
            <div className="relative">
              <span className="text-[9px] font-headline font-black text-[#ff51fa] uppercase tracking-[0.3em] block mb-2">Season 1 Bundle</span>
              <h2 className="font-headline font-black text-2xl uppercase tracking-tighter mb-1">Neon Storm Pack</h2>
              <p className="text-[#8a8a8a] text-[11px] mb-4">Frame + Title + Trail — Save 40%</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#8a8a8a] line-through text-[12px]">5 💎</span>
                  <span className="font-headline font-black text-xl text-[#ff51fa]">3 💎</span>
                </div>
                <Button variant="secondary" size="sm"
                  className="border-[#ff51fa] text-[#ff51fa] hover:bg-[rgba(255,81,250,0.08)]"
                  onClick={() => { sfx.click(); setSelectedItem(STORE_ITEMS.find(i => i.id === "bundle_s1")!); }}>
                  Get Bundle
                </Button>
              </div>
            </div>
          </div>

          {/* New items */}
          <div>
            <p className="font-headline font-bold text-[10px] text-[#5a5a5a] uppercase tracking-widest mb-3">New This Week</p>
            <div className="grid grid-cols-2 gap-3">
              {STORE_ITEMS.filter(i => i.new).map(item => {
                const cfg = RARITY_CONFIG[item.rarity];
                const owned = ownedItems.has(item.id);
                return (
                  <motion.button key={item.id} whileTap={buttonTap}
                    onClick={() => { sfx.click(); setSelectedItem(item); }}
                    className={`p-4 text-left border-2 transition-all relative overflow-hidden ${
                      owned ? "border-[#2a2a2a] opacity-60" : `${cfg.border} hover:brightness-110`
                    } bg-[#141414]`}>
                    <div className="absolute top-0 right-0 bg-[#cafd00] text-[#516700] px-1.5 py-0.5 font-headline font-black text-[7px] uppercase tracking-widest">New</div>
                    <div className={`text-[9px] font-black uppercase tracking-widest mb-2 ${cfg.color}`}>{cfg.label}</div>
                    <p className="font-headline font-black text-[13px] uppercase tracking-tight mb-1">{item.name}</p>
                    <p className="text-[9px] text-[#5a5a5a] mb-3">{item.description}</p>
                    {owned ? (
                      <div className="flex items-center gap-1 text-[#06d6a0]">
                        <Check size={11} /><span className="text-[9px] font-bold uppercase">Owned</span>
                      </div>
                    ) : (
                      <span className={`font-headline font-black text-[12px] ${item.currency === "gems" ? "text-[#ff51fa]" : "text-[#cafd00]"}`}>
                        {item.price} {item.currency === "gems" ? "💎" : "🪙"}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cosmetics */}
      {tab === "cosmetics" && (
        <div className="p-4 flex flex-col gap-4">
          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(["all", "avatar_frame", "title", "trail", "emote"] as const).map(f => (
              <button key={f} onClick={() => { sfx.click(); setFilter(f); }}
                className={`flex-shrink-0 px-3 py-1.5 font-headline font-black text-[10px] uppercase tracking-widest transition-all ${
                  filter === f ? "bg-[#cafd00] text-[#516700]" : "bg-[#141414] border border-[#2a2a2a] text-[#5a5a5a] hover:text-white"
                }`}>
                {f === "avatar_frame" ? "Frames" : f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1) + "s"}
              </button>
            ))}
          </div>

          <motion.div variants={gridContainerVariants} initial="initial" animate="animate" className="grid grid-cols-2 gap-3">
            {filteredItems.map(item => {
              const cfg = RARITY_CONFIG[item.rarity];
              const owned = ownedItems.has(item.id);
              return (
                <motion.button key={item.id} variants={gridItemVariants} whileTap={buttonTap}
                  onClick={() => { sfx.click(); if (!owned) setSelectedItem(item); }}
                  className={`p-4 text-left border transition-all relative overflow-hidden bg-[#141414] ${
                    owned ? "border-[#2a2a2a]" : `${cfg.border} hover:brightness-110`
                  }`}>
                  {item.limited && (
                    <div className="absolute top-0 left-0 bg-[#ff5c3a] text-white px-1.5 py-0.5 font-headline font-black text-[7px] uppercase tracking-widest">Limited</div>
                  )}
                  <div className={`text-[8px] font-black uppercase tracking-widest mb-2 mt-1 ${cfg.color}`}>{cfg.label}</div>
                  <p className="font-headline font-black text-[12px] uppercase tracking-tight mb-1 leading-tight">{item.name}</p>
                  <p className="text-[9px] text-[#5a5a5a] mb-3 leading-snug">{item.description}</p>
                  {owned ? (
                    <div className="flex items-center gap-1 text-[#06d6a0]">
                      <Check size={10} /><span className="text-[9px] font-bold uppercase">Owned</span>
                    </div>
                  ) : (
                    <span className={`font-headline font-black text-[11px] ${
                      item.currency === "gems" ? "text-[#ff51fa]" : item.currency === "free" ? "text-[#06d6a0]" : "text-[#cafd00]"
                    }`}>
                      {item.currency === "free" ? "FREE" : `${item.price} ${item.currency === "gems" ? "💎" : "🪙"}`}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* Battle Pass */}
      {tab === "battlepass" && (
        <div className="p-4 flex flex-col gap-5 pb-8">
          {/* Header card */}
          <div className="bg-[#141414] border-2 border-[#ff51fa] p-5 relative overflow-hidden">
            <div className="absolute inset-0 shimmer pointer-events-none opacity-20" />
            <div className="relative flex items-center justify-between">
              <div>
                <span className="text-[9px] font-headline font-black text-[#ff51fa] uppercase tracking-[0.3em] block mb-1">Season 1</span>
                <h2 className="font-headline font-black text-2xl uppercase tracking-tighter">Neon Storm</h2>
                <p className="text-[#5a5a5a] text-[10px] mt-1">Level {bpLevel}/100 · Ends in 28 days</p>
              </div>
              <div className="text-right">
                <p className="font-headline font-black text-3xl text-[#ff51fa]">FREE</p>
                <p className="text-[9px] text-[#5a5a5a] uppercase">to play</p>
              </div>
            </div>
            <div className="relative mt-4">
              <div className="w-full h-2 bg-[#0f0f0f] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${(bpLevel / 100) * 100}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-[#ff51fa]"
                  style={{ boxShadow: "0 0 8px rgba(255,81,250,0.6)" }}
                />
              </div>
              <p className="text-[9px] text-[#5a5a5a] mt-1 text-right">{bpLevel}% complete</p>
            </div>
          </div>

          {/* Tiers */}
          <div>
            <p className="font-headline font-bold text-[10px] text-[#5a5a5a] uppercase tracking-widest mb-3">Reward Track</p>
            <div className="space-y-2">
              {BATTLE_PASS_TIERS.map(tier => (
                <div key={tier.tier}
                  className={`flex items-center gap-3 p-3 border transition-all ${
                    tier.unlocked
                      ? "bg-[#141414] border-[#cafd00] border-l-4"
                      : "bg-[#0f0f0f] border-[#1e1e1e] opacity-60"
                  }`}>
                  <div className={`w-8 h-8 flex items-center justify-center font-headline font-black text-[11px] flex-shrink-0 ${
                    tier.unlocked ? "bg-[#cafd00] text-[#516700]" : "bg-[#1e1e1e] text-[#5a5a5a]"
                  }`}>
                    {tier.unlocked ? <Check size={14} /> : tier.tier}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">{tier.reward.icon}</span>
                      <span className={`font-headline font-black text-[12px] uppercase tracking-tight ${
                        tier.reward.type === "epic" ? "text-[#ff51fa]" : tier.reward.type === "coins" ? "text-[#cafd00]" : "text-white"
                      }`}>{tier.reward.label}</span>
                      {tier.free && (
                        <span className="text-[8px] font-black text-[#06d6a0] bg-[rgba(6,214,160,0.1)] border border-[rgba(6,214,160,0.3)] px-1.5 py-0.5 uppercase">Free</span>
                      )}
                    </div>
                  </div>
                  {!tier.unlocked && <Lock size={12} className="text-[#3a3a3a] flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Purchase modal */}
      <AnimatePresence>
        {selectedItem && (
          <PurchaseModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onConfirm={handlePurchase}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
