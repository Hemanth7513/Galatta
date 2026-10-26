# 🕹️ GALATTA

> **The Neo-Arcade Coin-Operated Indian Cinema Game Center**

**GALATTA** is an arcade-style web application built with React, React Router, and authentic 1984 coin-op aesthetics. It features an Indian cinema guessing game (**BOMMA**), rapid countdown trivia, millisecond reaction tests, versus duels, and an all-time arcade Hall of Fame.

---

## 🌟 Key Highlights

- **🎬 BOMMA (బొమ్మ)**: 74 cryptic Indian movie plot riddles across 5 major film industries:
  - **Tollywood (Telugu)** — 18 Master Riddles
  - **Kollywood (Tamil)** — 18 Master Riddles
  - **Mollywood (Malayalam)** — 15 Master Riddles
  - **Bollywood (Hindi)** — 14 Master Riddles
  - **Sandalwood (Kannada)** — 9 Master Riddles
- **🗣️ 100% Native Script Regional Feedback**: Correct and wrong guesses receive feedback strictly in the language of the movie (Telugu, Tamil, Malayalam, Hindi, Kannada) with zero English words!
- **⚡ TURBO TRIVIA 10S**: 10-second blitz countdown with combo streak multipliers (up to 3x).
- **🧠 REFLEX & MATRIX**:
  - **Mode A**: 15s Whack-a-Spark millisecond reaction test.
  - **Mode B**: 9-Pad Simon Memory recall sequence.
- **🥊 VERSUS DUEL**: Player 1 (Red Corner) vs Player 2 (Blue Corner) dilemma battleground with live tug-of-war meter.
- **🏆 HALL OF FAME**: High score rankings, best combo streaks, and customizable 3-to-4 character classic arcade initials (e.g., `[ACE]`, `[YOU]`).
- **📺 Authentic Retro Shader & Audio**:
  - Toggleable CRT glass curvature & phosphor scanline shader.
  - Built-in Web Audio API 8-bit chiptune synthesizer (coin chimes, stage beeps, win fanfares).
  - 10-Segment LED boredom meter transitioning from 100% bored to OVERDRIVE.
- **⌨️ Keyboard Controls**: Play using keys `[1]`, `[2]`, `[3]`, `[4]` to pick options and `[Enter]` or `[Space]` to advance.

---

## 🗺️ Routes & Deep Links

Powered by `react-router-dom`:

| Route | View | Query Parameters |
| :--- | :--- | :--- |
| **`/`** | 🕹️ Main Cabinet Hub | Arcade marquee, 4 game cabinets, credits, boredom meter |
| **`/bomma`** | 🎬 BOMMA Movie Riddles | `?industry=TOLLYWOOD`<br>`?industry=KOLLYWOOD`<br>`?industry=MOLLYWOOD`<br>`?industry=BOLLYWOOD`<br>`?industry=SANDALWOOD` |
| **`/trivia`** | ⚡ Turbo Trivia 10S | Countdown trivia blitz |
| **`/reflex`** | 🧠 Reflex & Matrix | Millisecond test & 9-pad memory |
| **`/duel`** | 🥊 Versus Duel | Dilemma arena & tug-of-war |
| **`/hall-of-fame`** | 🏆 Hall of Fame | All-time pilot leaderboards & player tag |

---

## 🚀 Quick Start (Local Development)

```bash
# Clone or navigate to the directory
cd boredom-buster-arcade

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 📦 Production Build

```bash
# Compile optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🚢 Launch & One-Click Deployment

GALATTA is pre-configured for zero-config deployment on all major modern hosting platforms:

### 1. Vercel
Configured via `vercel.json` with SPA catch-all rewrites:
```bash
npm i -g vercel
vercel
```

### 2. Netlify
Configured via `public/_redirects`:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### 3. Cloudflare Pages
1. Build Command: `npm run build`
2. Output Directory: `dist`
3. Single Page Application (SPA) routing is handled automatically by `public/_redirects`.

---

## 📱 Progressive Web App (PWA)

GALATTA includes a Web App Manifest (`public/manifest.json`), touch icons, and standalone display mode. On mobile browsers (Safari / Chrome), tap **"Add to Home Screen"** to install GALATTA as a native fullscreen arcade machine on your device.

---

## 📜 Tech Stack

- **React 19**
- **React Router 7 (`react-router-dom`)**
- **Vite 8**
- **Vanilla CSS3** (Custom retro arcade design system, CRT shaders, neon glows)
- **Web Audio API** (Hardware-accelerated 8-bit chiptune synthesis)
- **Google Fonts** (`Press Start 2P`, `VT323`, `Orbitron`, `Noto Sans Telugu/Tamil/Malayalam/Devanagari/Kannada`)
- **Canvas Confetti**
- **Lucide Icons**
