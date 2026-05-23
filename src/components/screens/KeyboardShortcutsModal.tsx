import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Keyboard, X } from "lucide-react";
import { backdropVariants, modalVariants } from "../../lib/animations";

const SHORTCUTS = [
  { category: "Game",
    items: [
      { keys: ["Enter"],        action: "Submit word"           },
      { keys: ["Esc"],          action: "Pause / Exit menu"     },
      { keys: ["Tab"],          action: "Focus input"           },
      { keys: ["Ctrl", "Z"],    action: "Clear input"           },
    ],
  },
  { category: "Navigation",
    items: [
      { keys: ["1"],            action: "Home tab"              },
      { keys: ["2"],            action: "Rankings tab"          },
      { keys: ["3"],            action: "Social tab"            },
      { keys: ["4"],            action: "Store tab"             },
    ],
  },
  { category: "Lobby",
    items: [
      { keys: ["Space"],        action: "Quick play"            },
      { keys: ["P"],            action: "Private room"          },
      { keys: ["C"],            action: "Category mode"         },
      { keys: ["T"],            action: "Tournaments"           },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div variants={backdropVariants} initial="initial" animate="animate" exit="exit"
          onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
        <motion.div variants={modalVariants} initial="initial" animate="animate" exit="exit"
          className="relative w-full max-w-sm bg-[#141414] border border-[#1e1e1e] p-6 max-h-[85dvh] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Keyboard size={16} className="text-[#cafd00]" />
              <h2 className="font-headline font-black text-[15px] uppercase tracking-tighter text-[#cafd00]">Shortcuts</h2>
            </div>
            <button onClick={onClose} className="text-[#5a5a5a] hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6">
            {SHORTCUTS.map(section => (
              <div key={section.category}>
                <p className="font-headline font-bold text-[9px] text-[#5a5a5a] uppercase tracking-[0.3em] mb-3">
                  {section.category}
                </p>
                <div className="space-y-2">
                  {section.items.map(item => (
                    <div key={item.action} className="flex items-center justify-between">
                      <span className="text-[12px] text-[#8a8a8a]">{item.action}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((k, i) => (
                          <React.Fragment key={k}>
                            <kbd className="bg-[#1e1e1e] border border-[#3a3a3a] px-2 py-0.5 font-mono text-[10px] text-white font-bold">
                              {k}
                            </kbd>
                            {i < item.keys.length - 1 && (
                              <span className="text-[#3a3a3a] text-[9px]">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[9px] text-[#3a3a3a] font-bold uppercase tracking-widest mt-6">
            Press ? anywhere to toggle this panel
          </p>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
