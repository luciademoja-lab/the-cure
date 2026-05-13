# The Cure

A simple, emotionally intelligent journaling experience—built with React, TypeScript, Vite, and focused on what matters most.

## 🌟 Vision

The Cure is a 1-minute journaling ritual that starts with how you feel, not what you think. No pressure, no complexity—just presence and compassionate AI support.

## ✨ Core Experience (MVP)

### Emotional Check-In
- Mood slider (1-10)
- Energy level (low/medium/high)
- Body sensation awareness

### Guided Writing
- One AI prompt based on your mood
- Simple text area for free journaling
- One gentle elaboration suggestion

### Elayra Response
- Short, compassionate feedback
- Personalized to mood and writing
- Human tone, not engine jargon

### Simple Loop
- Start from feeling
- Write whenever you want
- No streaks, no leaderboard, no pressure

## 🏗️ Simplified Architecture

**Atomic Design**:
- `atoms/` — MoodSlider, EnergySelector, Button, TextArea
- `molecules/` — CheckInForm, ElaborationCard, ElayraMessageCard
- `organisms/` — EntryEditor
- `pages/` — LandingPage, JournalPage
- `services/` — journalAIService, elayraService
- `hooks/` — useJournalEntries
- `types/` — journal.ts

**Storage**: LocalStorage MVP

**Styling**: Clean minimal dark theme

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or Yarn

### Install & Run

```bash
cd /Users/luciademoja/the-cure
npm install
npm run dev
```

Open http://localhost:4174

### Build & Test

```bash
npm run build
npm run test
```

## 🧠 Core Services

**journalAIService**:
- `generateAIPrompt(mood)` — Mood-aware prompts
- `suggestElaborations(text)` — One gentle writing idea
- `generateAITags(content)` — Basic theme detection

**elayraService**:
- `generateElayraResponse(entry)` — Short empathetic response

## 📱 MVP User Flow

1. Landing page: “Non devi sapere cosa scrivere. Inizia da come ti senti.”
2. Check-in: Mood, energy, body sensation → “Continua”
3. Transition: “Ok. Restiamo qui un attimo.”
4. Writing: Prompt + textarea + one suggestion → “Ho finito”
5. Elayra response: Short compassionate message
6. Close: “Ci torniamo quando vuoi.”

## ✅ Testing

**109 tests** covering core journaling, mood check-in, AI prompts, and response behavior.

## 🛣️ Product Focus & Application State

**Currently Active & Accessible Pages:**
- **Landing Page (`/`)**: Vision and entry point.
- **Authentication**: Login, Register, Forgot Password.
- **Journal (`/journal`)**: Core MVP experience (emotional check-in, guided journaling, simple Elayra response, save and return).

**Developed but Hidden Pages (Not in UI Navigation):**
These pages exist in the codebase and are registered in the routing system but are currently hidden to maintain focus on the core journaling experience:
- **Daily Light Practice (`/daily-light`)**: Daily routines and habits.
- **The Forge (`/forge`)**: Skill-building and focused work.
- **Synchronicities (`/synchronicities`)**: Tracking meaningful coincidences.
- **Collective (`/collective`)**: Community and shared experiences.
- **Gaming (`/gaming`)**: Light Points gamification.
- **Contatti (`/contatti`)**: Public contact page.

## 🎨 Design

- Theme: Minimal dark ambient
- Language: Warm, simple, human
- Experience: Slow, attentive, non-pressured

---

**Less is more. Presence is everything.**
