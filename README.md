# ⚡ WORDBLITZ

> Real-time competitive word chain battles. No mercy.

Players chain words where each word must start with the last letter of the previous word. Last player standing wins. Built with a server-authoritative game engine, Firebase auth, MMR-based matchmaking, and a full progression system.

---

## Status

| Component | Status |
|---|---|
| Socket.io realtime server | ✅ Live |
| Matchmaking queue (ELO) | ✅ Live |
| Room manager + turn loop | ✅ Live |
| Word validator (Trie) | ✅ Live |
| Anti-cheat engine | ✅ Live |
| Firebase Auth (Email + Google) | ✅ Configured |
| Firestore (profiles, leaderboard) | ✅ Configured |
| AI word hints (OpenRouter → Gemini 2.0 Flash) | ✅ Live |
| Rate limiting | ✅ Live |
| Reconnection (10s grace) | ✅ Live |

---

## Features

### Gameplay
- **Word Chain** — each word must start with the last letter of the previous word
- **Server-authoritative timer** — absolute Unix deadline sent from server, zero clock drift
- **Category Mode** — 8 themed word lists (Anime, Countries, Tech, Movies, Sports, Food, Science, Music)
- **Private Rooms** — invite-code rooms with configurable player count and turn timer
- **Daily Challenge** — rotating daily word with streak tracking and login rewards
- **Bot AI** — Datamuse API-powered bots fill empty slots with realistic play
- **AI Hint System** — powered by OpenRouter → Gemini 2.0 Flash, one hint per turn
- **Spectator Mode** — forfeit and watch the rest of the match

### Progression
- **MMR / ELO ranking** — 7 tiers: Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster
- **XP & Levels** — base XP + win bonus + streak bonus + word-length bonus
- **Win Streaks** — tracked per player, bonus XP at 3/5/10 streak
- **Daily Login Rewards** — 7-day streak calendar with escalating rewards
- **Season Pass** — 100-tier battle pass with free and premium reward tracks

### Social
- **Friends** — add, challenge, and chat with friends in-app
- **Friend Requests** — accept/decline with live notification badge
- **Discover** — find players near your MMR
- **In-app Chat** — per-friend message threads

### Store
- **Cosmetics** — avatar frames, titles, word trails, emotes
- **Rarity System** — Common / Rare / Epic / Legendary
- **Currency** — Coins (earned in-game) and Gems (premium)
- **Battle Pass** — Season 1: Neon Storm (100 tiers)

### Tournaments
- **Live Tournaments** — join active brackets
- **Upcoming Events** — register in advance, entry fee + prize pool
- **Formats** — Single Elimination, Double Elimination, Round Robin

### Technical
- **Sound Engine** — Web Audio API, 12 synthesized SFX, zero audio files
- **Confetti** — Canvas-based particle system on victory, zero dependencies
- **Notifications** — In-app notification panel with localStorage persistence
- **Keyboard Shortcuts** — full shortcut system, press `?` to view
- **Anti-cheat** — server-side speed detection and rapid-fire flagging
- **Rate limiting** — per-UID in-memory limiter (matchmaking, word submit, general)
- **Reconnection** — 10s grace period, full state snapshot on rejoin

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5, Tailwind CSS 4 |
| Animations | Framer Motion (motion/react) |
| State | Zustand 5 |
| Realtime | Socket.io 4 (client + server) |
| Backend | Node.js + Express 4 + Socket.io |
| Auth | Firebase Authentication (Email + Google OAuth) |
| Database | Firestore (profiles, match history, leaderboard) |
| AI | OpenRouter API → Google Gemini 2.0 Flash |
| Build | Vite 6 with code-split vendor chunks |
| Icons | Lucide React |

---

## Project Structure

```
wordblitz/
├── server.ts                        # Game server entry point
├── src/
│   ├── App.tsx                      # All screens + routing
│   ├── store.ts                     # Zustand global state
│   ├── socket.ts                    # Socket.io client + all event handlers
│   ├── firebase.ts                  # Firebase client SDK (auth + Firestore)
│   │
│   ├── components/
│   │   ├── game/
│   │   │   ├── GameBoard.tsx        # Main game arena (timer, input, bot AI, hints)
│   │   │   ├── PlayerCard.tsx       # Per-player status strip
│   │   │   └── WordChain.tsx        # Scrolling word history chips
│   │   ├── screens/
│   │   │   ├── SocialScreen.tsx     # Friends, requests, discover, chat
│   │   │   ├── StoreScreen.tsx      # Cosmetics store + battle pass
│   │   │   ├── TournamentScreen.tsx # Tournament browser + detail view
│   │   │   ├── NotificationsPanel.tsx # Slide-in notification panel
│   │   │   └── KeyboardShortcutsModal.tsx # Shortcut reference
│   │   └── ui/
│   │       ├── Avatar.tsx           # Avatar with status rings + overlays
│   │       ├── Badge.tsx            # Rank, XP, status badges
│   │       ├── Button.tsx           # Animated button with variants
│   │       ├── ProgressBar.tsx      # XP bar + GPU-smooth timer bar
│   │       └── Toast.tsx            # Toast, achievement toast, XP float
│   │
│   ├── engine/
│   │   ├── wordValidator.ts         # Trie dictionary + chain rule validation
│   │   ├── mmrCalculator.ts         # ELO MMR + XP + rank calculation
│   │   └── antiCheat.ts             # Speed detection, rapid-fire flagging
│   │
│   ├── firebase/
│   │   ├── admin.ts                 # Firebase Admin SDK (server-side only)
│   │   ├── playerService.ts         # Firestore writes (match results, profiles)
│   │   ├── leaderboardService.ts    # Firestore reads (leaderboard, history)
│   │   └── rewardService.ts         # Daily reward Cloud Function callable
│   │
│   ├── hooks/
│   │   ├── useTimer.ts              # Server-authoritative countdown hook
│   │   └── useMatchmaking.ts        # Matchmaking join/leave hook
│   │
│   ├── lib/
│   │   ├── ai.ts                    # OpenRouter → Gemini 2.0 Flash word hints
│   │   ├── animations.ts            # All Framer Motion variants (centralised)
│   │   ├── sound.ts                 # Web Audio API sound engine (zero files)
│   │   ├── confetti.ts              # Canvas confetti (zero dependencies)
│   │   ├── categoryWords.ts         # 8 category word lists + validation
│   │   └── notifications.ts         # In-app notification store (localStorage)
│   │
│   ├── matchmaking/
│   │   └── queue.ts                 # In-memory MMR queue (500ms tick)
│   │
│   ├── middleware/
│   │   └── rateLimiter.ts           # In-memory rate limiting by UID
│   │
│   ├── rooms/
│   │   └── roomManager.ts           # Room lifecycle, turn loop, reconnection
│   │
│   └── types/
│       └── game.ts                  # Shared TypeScript types (server + client)
│
├── firestore.rules                  # Firestore security rules
├── firestore.indexes.json           # Firestore composite indexes
├── .env                             # Local environment variables (never commit)
├── .env.example                     # Environment variable template
├── vite.config.ts                   # Vite config with vendor code splitting
├── tsconfig.json                    # TypeScript config
└── package.json
```

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Your `.env` is already set up with working keys. For a fresh setup:

```bash
cp .env.example .env
```

Then fill in:

```env
# AI — OpenRouter (powers in-game word hints via Gemini 2.0 Flash)
VITE_OPENROUTER_API_KEY="sk-or-v1-..."

# Firebase client (Firebase Console → Project Settings → Web app)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Firebase Admin — required for production only
# Firebase Console → Project Settings → Service Accounts → Generate new key
# Paste the full JSON as a single line (no line breaks)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Server
PORT=3000
NODE_ENV=development
APP_URL="http://localhost:3000"
```

> **Dev mode note:** `FIREBASE_SERVICE_ACCOUNT_JSON` is not required locally. The server allows unauthenticated sockets in development so you can test the full game without it.

### 3. Start the dev server

```bash
npm run dev
```

Starts the Express + Socket.io game server with Vite middleware on `http://localhost:3000`. Hot module replacement is active.

Open two browser tabs to test matchmaking — they will find each other automatically.

### 4. Production build

```bash
npm run build         # Vite production build → dist/
npm run server:prod   # Start production server (serves dist/)
```

---

## Architecture

```
Browser (React + Zustand)
    │
    │  WebSocket (Socket.io)
    ▼
Game Server  (server.ts — Express + Socket.io)
    ├── Auth middleware       Firebase token → socket.data.uid
    ├── Rate limiter          In-memory, per-UID
    ├── Matchmaking queue     500ms tick, ELO range expansion
    ├── Room manager          Server-authoritative state, turn loop
    ├── Word validator        Trie, O(n) per word, loaded at startup
    └── Anti-cheat            Speed detection, rapid-fire flagging
    │
    │  Firebase Admin SDK
    ▼
Firebase
    ├── Auth                  Token verification
    └── Firestore             Profiles, match history, leaderboard

Browser (AI hints)
    │
    │  HTTPS (fetch)
    ▼
OpenRouter API → Google Gemini 2.0 Flash
    └── Word suggestions + category validation
```

### Server-authoritative design

The server owns all game state during a match. The client only:
- Submits intent (`submit_word`, `join_matchmaking`)
- Renders what the server broadcasts

The client never mutates match state directly. In dev mode the server allows unauthenticated connections so the full game loop is testable locally.

### Timer synchronisation

The server sends an absolute Unix timestamp (`turnDeadline`) rather than a countdown. The client computes `remaining = turnDeadline - Date.now()`. This eliminates clock drift between players regardless of network latency.

### Reconnection

Players have a 10-second grace period after disconnect. On reconnect, the server remaps the socket ID and sends a full `room_snapshot`. The client restores state from the snapshot.

### AI hints

Word hints are fetched client-side via OpenRouter's OpenAI-compatible API. Model: `google/gemini-2.0-flash-001`. No extra SDK — plain `fetch`. Falls back silently if the key is missing or the request fails.

---

## Game Modes

| Mode | Description |
|---|---|
| Casual | Standard word chain, no MMR change |
| Ranked | MMR-based matchmaking, ELO delta applied |
| Private Room | Invite code, configurable timer (10s–5m), 2–6 players |
| Category | Words must belong to a chosen theme (8 categories) |
| Daily Challenge | Fixed daily word, streak rewards, +150 XP |
| Tournament | Bracket-based events with prize pools |

---

## Category Word Lists

| Category | Words | Starter |
|---|---|---|
| Anime | ~120 | NARUTO |
| Countries | ~195 | AFGHANISTAN |
| Tech | ~90 | ALGORITHM |
| Movies | ~70 | AVATAR |
| Sports | ~50 | ARCHERY |
| Food | ~100 | AVOCADO |
| Science | ~80 | ATOM |
| Music | ~80 | ACOUSTIC |

---

## Keyboard Shortcuts

Press `?` anywhere in the app to open the shortcuts panel.

| Key | Action |
|---|---|
| `Space` | Quick play (lobby) |
| `P` | Open private room |
| `C` | Category mode |
| `T` | Tournaments tab |
| `1` / `2` / `3` / `4` | Switch lobby tabs |
| `Enter` | Submit word (in game) |
| `Esc` | Pause / exit menu (in game) |
| `Tab` | Focus word input (in game) |
| `?` | Toggle shortcuts panel |

---

## Rank System

| Rank | MMR Range |
|---|---|
| Bronze | 0 – 999 |
| Silver | 1000 – 1199 |
| Gold | 1200 – 1399 |
| Platinum | 1400 – 1599 |
| Diamond | 1600 – 1799 |
| Master | 1800 – 1999 |
| Grandmaster | 2000+ |

MMR uses ELO with a variable K-factor (40 for new players, 16 for veterans). XP is awarded separately and drives level progression.

---

## Sound System

All sounds are synthesized via the Web Audio API at runtime — no audio files are bundled.

| Sound | Trigger |
|---|---|
| Word Accepted | Valid word submitted |
| Word Rejected | Invalid word attempt |
| Timer Tick | Last 5 seconds of turn |
| Timer Critical | Last 3 seconds (urgent pulse) |
| Match Found | Match ready overlay |
| Eliminated | Player knocked out |
| Victory | Win screen |
| Defeat | Loss screen |
| XP Gain | XP float animation |
| Rank Up | Rank promotion |
| Achievement | Achievement toast |
| Notification | Notification panel open |

Volume is controlled via the Settings slider and persisted to `localStorage`.

---

## Firebase Setup

### Deploy security rules and indexes

```bash
npm install -g firebase-tools
firebase login
firebase use ciphermind
firebase deploy --only firestore:rules,firestore:indexes
```

### Required Firestore Collections

| Collection | Purpose |
|---|---|
| `players/{uid}` | Player profile, MMR, XP, rank, streak |
| `matches/{matchId}` | Match result, word logs, XP awarded |
| `leaderboard/season1/entries` | Pre-computed leaderboard (updated by Cloud Function) |
| `suspicions/{id}` | Anti-cheat flags for review |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_OPENROUTER_API_KEY` | Yes | OpenRouter key for AI word hints (`sk-or-v1-...`) |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Prod only | Full service account JSON as a single line |
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` |
| `APP_URL` | No | App base URL (default: `http://localhost:3000`) |
| `ALLOWED_ORIGINS` | Prod only | Comma-separated allowed CORS origins |

---

## Scaling

| Phase | Concurrent Users | Changes Needed |
|---|---|---|
| 1 | 0 – 10k | Single `server.ts` process, in-memory queue, Firebase free tier |
| 2 | 10k – 50k | Upstash Redis, Socket.io Redis adapter, 2 VMs behind load balancer |
| 3 | 50k+ | Geo-distributed game servers, Redis primary for matchmaking, CDN for static assets |

The in-memory matchmaking queue and room manager are designed for Phase 1. Swapping to Redis at Phase 2 requires changes only in `queue.ts` and `roomManager.ts`.

---

## Advancement Roadmap

The next phase evolves WORDBLITZ from a multiplayer word game into a scalable competitive realtime gaming platform.

### Priority Order

| Priority | Focus |
|---|---|
| P1 | Gameplay depth |
| P2 | Retention systems |
| P3 | Social ecosystem |
| P4 | Competitive systems |
| P5 | Infrastructure scaling |
| P6 | Platform expansion |

---

### P1 — Gameplay Depth

#### Power Ability System
Strategic depth beyond vocabulary skill.
- Freeze opponent timer, reverse chain direction, shield from elimination
- Double XP round, letter ban, word steal, force category switch
- Files: `src/components/game/PowerPanel.tsx`, `src/lib/powers.ts`, `src/engine/powerEngine.ts`
- Socket events: `use_power`, `power_used`, `power_blocked`
- Database: `players/{uid}/inventory`

#### Combo & Multiplier System
Speed combo, rare letter combo, long word multiplier, win streak multiplier, survival combo.
- Animated XP bursts, combo counter, screen shake, chain glow effects
- Files: `src/lib/combo.ts`, `src/components/game/ComboOverlay.tsx`

#### Dynamic Match Modifiers
No vowels, reverse mode, sudden death, 5+ letter words only, timed blitz, random category swaps.
- File: `src/engine/modifierEngine.ts`

#### Advanced Bot AI
Personalities: Aggressive, Fast typer, Rare-word specialist, Casual, Troll, Competitive grinder.
- Simulated typing delays, fake mistakes, adaptive difficulty
- Files: `src/ai/botProfiles.ts`, `src/ai/botDecisionEngine.ts`

---

### P2 — Retention Systems

#### Achievement System
100 wins, 50 streak, fastest response, legendary word usage, tournament champion.
- Files: `src/lib/achievements.ts`, `src/components/screens/AchievementScreen.tsx`, `src/firebase/achievementService.ts`

#### Seasonal Ranked System
Seasonal reset, ranked rewards, exclusive cosmetics, rank decay, placement matches.
- Database: `seasons/{seasonId}`

#### Daily / Weekly Missions
Win 3 ranked matches, use 20 anime words, reach 5 streak, play with friends.
- Rewards: Coins, XP, cosmetics, battle pass progress

#### Replay System *(Very High Priority)*
Store match timeline, words submitted, reaction timestamps, elimination events.
- Replay viewer, match export, spectator replay, cheat review tools
- Files: `src/replay/replayRecorder.ts`, `src/replay/replayViewer.tsx`

---

### P3 — Social Expansion

#### Guild / Clan System *(Very High Priority)*
Clan chat, clan XP, clan wars, clan tournaments, shared rewards.
- Database: `guilds/{guildId}`

#### Spectator Ecosystem
Live match spectating, featured matches, tournament broadcasting, viewer reactions.

#### Share System
Victory cards, match highlights, rank promotion images, replay links.
- Technology: `html2canvas`

#### Voice Chat
WebRTC-based, friends only / team / lobby modes. LiveKit or mediasoup for scale.

---

### P4 — Competitive Systems

#### Advanced Anti-Cheat
Typing entropy analysis, impossible reaction detection, dictionary abuse detection, AI bot detection, suspicion scoring.
- File: `src/engine/advancedAntiCheat.ts`

#### Match Analytics
Average response time, most used letters, weak letters, category winrate, accuracy %, typing speed.
- File: `src/components/screens/StatsScreen.tsx`

#### Ranked Integrity
Smurf detection, confidence-based MMR, placement calibration, AFK penalties, queue dodge penalties.

---

### P5 — Infrastructure Scaling

#### Redis Migration
Replace in-memory queue, session state, and rate limiting with Upstash Redis + Socket.io Redis Adapter.

#### Dedicated Match Servers
```
Gateway Server → Match Servers → Redis Pub/Sub
```

#### Analytics Pipeline
Track retention, match duration, rage quits, funnel analysis, session time.
- Stack: PostHog → BigQuery → ClickHouse

---

### P6 — Platform Evolution

#### Multi-Game Platform
Shared accounts, cosmetics, matchmaking, tournaments, friends, and guilds across:
Trivia battles, typing races, memory duels, puzzle combat, AI deception games.

#### Creator Ecosystem
Community tournaments, custom categories, user dictionaries, custom modifiers, event creation.

---

### Mobile Optimization *(Very High Priority)*

- Thumb-first layout, reduced typing friction, better keyboard handling, haptic feedback
- GPU acceleration, reduced rerenders, WebSocket optimization, memory optimization

---

### Monetization Additions

- Animated avatars, kill effects, premium word trails, rare emotes
- Rotating item shop, limited skins, seasonal exclusives, clan cosmetics
- Premium battle pass, tournament tickets, profile customization

---

### Security Improvements

- Socket payload validation with Zod schemas
- Better rate limiting, request signing
- Cloudflare protection, DDoS mitigation, IP reputation scoring

---

### AI Expansion

- **AI Coach** — suggest improvements, analyze mistakes, vocabulary training
- **AI Match Commentary** — tournament narration, highlight generation
- **AI Moderation** — toxicity detection, chat filtering
- **AI Events** — dynamic tournaments, auto-generated challenges

---

### Recommended Implementation Phases

| Phase | Work |
|---|---|
| 1 — Polish & Retention | Replay system, achievements, missions, combo system, mobile optimization |
| 2 — Competitive Depth | Power abilities, dynamic modifiers, ranked seasons, advanced anti-cheat |
| 3 — Social Expansion | Guilds, spectator system, share system, voice chat |
| 4 — Scale | Redis migration, dedicated servers, analytics pipeline |
| 5 — Platform Evolution | Multi-game platform, creator ecosystem, AI expansion |

---

### Final Goal

Transform WORDBLITZ from a realtime word game into a **competitive realtime social gaming platform** with scalable infrastructure, creator-driven content, AI-enhanced systems, long-term retention loops, and esports-ready architecture.

---

## License

MIT
