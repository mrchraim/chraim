# PROMPT v4 (Creative + Founder branding + Comfort-first design): Build "chrvvim.alailm" - a learning world, not just a website

You are a senior full-stack engineer AND a creative product designer AND a UX specialist. Build the complete project from scratch, step by step. I am a total beginner and cannot code: run commands yourself when you can, tell me exactly what to click or paste when you can't, never skip a step, and test everything before saying it works.

## 0. Founder and branding (include everywhere it makes sense)
The platform is created by **Mohamed Chraim | محمد شرايم**, founder. Brand mark / logo: **@chrvvim**.

**Site name: `chrvvim.alailm`** (exact spelling, lowercase, with the dot). Use it as the product name everywhere: page titles, header, landing hero, PWA name, metadata, Open Graph, emails, README, and the package/project name. Display it as a wordmark where "chrvvim" is the strong part and ".alailm" is a lighter/accent part. Suggested tagline (Arabic): "عالمك للتعلم". Try to use `chrvvim-alailm` as the project/repo/Vercel slug.

**Logo rules**
- Build the logo as a clean SVG wordmark reading exactly `@chrvvim` (lowercase, modern, elegant, works in light/dark). Also create a compact icon version (the "@c" or "c" monogram) for favicon, PWA icon and loading screen.
- Show it in: header, footer ("Created by @chrvvim"), loading screen, login page, PWA icon, Open Graph share image, and a subtle watermark on exported summaries/cheat sheets/PDFs.
- If I later add my own logo in `/public/brand/`, use it instead.

**"About the Founder" page** (Arabic default, also fr/en), tone: professional, warm, short:
- Mohamed Chraim | محمد شرايم. Moroccan. Law student (legal sciences) at Ibn Zohr University, Agadir, with special interest in criminal sciences and Moroccan law. Baccalaureate in Humanities.
- Boarding-school supervisor (معلّم داخلية) at the preparatory classes center Reda Slaoui, Agadir: a role built on responsibility, discipline, patience and communication with students.
- Writer and content creator. Book: "السلطة الخفية", plus literary/philosophical ideas about power, the human being, social inequality, psychological conflict and existential questions.
- Projects: (1) **chrvvim, legal content:** simplifying Moroccan law through cinematic-style legal videos, accurate and clear, Instagram @chrvvim. (2) **CHRVVIM CAMPUS:** helps students (especially Faculty of Legal and Political Sciences, Agadir) find groups, timetables, subjects, rooms and professors. (3) **chrvvim.alailm** (this platform).
- Interests: Moroccan law and criminal sciences, literary writing, legal awareness, technology and AI, web projects, entrepreneurship.
- Vision: combine legal knowledge, creativity, technology and writing into digital initiatives with real practical and social value.
- "Follow @chrvvim" button. Do NOT publish exact home address or age; keep only the city (Agadir) if needed.

**Integration with my projects**
- "Law & Moroccan Legal Studies" district ("Justice Hall") as a flagship subject: Moroccan law, criminal sciences, constitutional law, legal terms in Arabic/French; AI explains cases and articles simply and accurately, always adding "educational information, not legal advice".
- Phase 2 placeholders: CHRVVIM CAMPUS (timetables, groups, rooms, professors), Legal Awareness feed, Writer's corner with a "Write with AI" tool for essays and Arabic composition.

## 1. Vision
Students should feel like they are PLAYING a world they want to come back to, not opening a boring school site. Learning = exploring a living map, meeting characters, winning quests, building a personal "brain garden". Serious learning underneath, joyful and CALM experience on top.

Audience: ALL levels (primary to university), ALL subjects. Languages: Arabic (default, RTL), Moroccan Darija (AI understands and can answer in it), French, English. Default curriculum: Morocco, changeable.

## 2. Constraints
- 100% FREE tiers: Vercel, Supabase, Google Gemini free API (best free flash model; fall back to Groq free tier when rate-limited).
- API keys only in server-side env vars. Per-user daily AI quota + caching + streaming.
- Mobile-first, fast, installable PWA, offline for flashcards and saved lessons.

## 3. Tech stack
Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion + next-intl (ar/fr/en, full RTL) + Supabase + KaTeX + Mermaid/SVG/Canvas + pdf-parse + zod (validate all AI JSON).

## 4. DESIGN, UI and BROWSING COMFORT (highest priority: the visitor must feel relaxed)

### 4.1 Design philosophy
Calm, clean, elegant, cinematic. "Quiet confidence": lots of breathing space, one clear action per screen, no visual noise. The site should feel like a beautiful study room, never like a crowded ad-filled page. Brand feel matches @chrvvim: modern, refined, slightly cinematic, with subtle Moroccan geometric (zellige) accents used sparingly.

### 4.2 Color and theme (eye comfort)
- Three themes: **Light** (warm off-white, never pure #FFF), **Dark** (soft charcoal/deep navy, never pure #000), and **Night-Study / Sepia** (warm, low blue light for reading late). Follow system preference by default, remember the choice.
- One primary accent (deep teal or emerald) + one warm secondary accent (soft gold/terracotta) for rewards. Calm neutrals for everything else.
- Define everything as design tokens (CSS variables): colors, radii, spacing, shadows, motion durations. Contrast must meet WCAG AA at minimum (AAA for body text).
- Avoid harsh saturated colors, avoid red as a decoration (use it only for real errors).

### 4.3 Typography and reading comfort
- Arabic: a modern readable font (e.g. Cairo, Tajawal or IBM Plex Sans Arabic). Latin: Inter or similar. Load with `next/font`, no layout shift.
- Body text 17-18px on mobile, line-height 1.8 for Arabic, comfortable line length (max ~65 characters), generous paragraph spacing.
- Reading mode for lessons/summaries: distraction-free, adjustable font size, adjustable line spacing, optional dyslexia-friendly font.
- Math (KaTeX) and code always rendered crisp and sized consistently with text.

### 4.4 Layout and navigation
- True RTL-first layout (logical CSS properties, not left/right hacks); flips perfectly for fr/en.
- Mobile: bottom navigation bar (Home, Tutor, Practice, Review, Me) reachable with the thumb; big tap targets (min 44px); no hover-only features.
- Desktop: slim collapsible side navigation + split view (chat on one side, whiteboard on the other).
- Command palette / smart search (Ctrl+K and a search icon): find any lesson, deck, feature or past conversation instantly.
- Breadcrumbs and a clear "Back" everywhere; the user is never lost. Max 2 taps to reach any core feature.
- Sticky, minimal header that hides on scroll-down and returns on scroll-up. Footer light with the @chrvvim credit.

### 4.5 Motion and feedback (smooth, never annoying)
- Subtle, fast animations (150-300ms), easing that feels natural; page transitions that are gentle fades/slides.
- Respect `prefers-reduced-motion`: turn animations off automatically.
- Skeleton loaders instead of spinners; streaming AI text appears smoothly; optimistic UI so actions feel instant.
- Friendly empty states with a small illustration and a clear next step; helpful, kind error messages (never technical jargon).
- Celebrations (confetti, garden growth) only on real achievements, short, and can be turned off.
- Sounds: off by default, optional.

### 4.6 Calm-experience features ("comfort mode")
- **Focus Mode:** hides everything except the current task; built-in Pomodoro timer with soft chime and gentle break reminders ("drink water, rest your eyes").
- **Eye-rest reminder** (20-20-20 rule) as an optional toggle.
- **No dark patterns:** no pop-ups on arrival, no aggressive notifications, no guilt-tripping streak messages. Streaks are encouraging, with a "streak freeze".
- **Do-not-disturb hours** for notifications.
- Zero intrusive ads; no cookie-banner maze (one minimal, clear consent bar).
- Optional soft ambient study sounds (rain, library, off by default).

### 4.7 Personalization
- At first visit, a 4-step friendly onboarding (language, level, goals, theme) that takes under a minute and can be skipped.
- Remember: language, theme, font size, last subject, last lesson. "Continue where you left off" button on the home screen.
- Greeting by time of day and name, short and warm.

### 4.8 Accessibility (for everyone)
- Full keyboard navigation, visible focus rings, semantic HTML, ARIA labels, skip-to-content link.
- Screen-reader friendly, alt text for every image, captions for any audio.
- Colors never the only signal (icons/text too). Works for color-blind users.
- Text can be enlarged up to 200% without breaking layout.

### 4.9 Performance (comfort = speed)
- Target Lighthouse 90+ on mobile: fast first load, image optimization (`next/image`, WebP/AVIF), lazy-load heavy parts (whiteboard, charts), code splitting, edge caching.
- Works on slow Moroccan mobile networks: lightweight pages, offline PWA caching, "low-data mode" toggle that disables animations and heavy images.
- No layout jumps; instant-feeling interactions.

### 4.10 Landing page (first impression)
Hero with a short warm headline in Arabic, one sentence of value, ONE main button ("ابدأ التعلم" / Start learning) and a gentle animated preview of the World Map. Then 4 clear feature blocks, a short "about the founder @chrvvim" block, a few honest FAQs, and a calm footer. No clutter, no walls of text.

### 4.11 Design deliverables to produce BEFORE coding screens
1. A design system page in the app (`/design`) showing colors, fonts, buttons, cards, inputs, states, in all 3 themes and RTL/LTR.
2. A reusable component library (Button, Card, Input, Modal, Toast, Tabs, Tooltip, Skeleton, EmptyState, ProgressRing...).
3. Wireframes (simple) for: Landing, World Map home, Tutor (chat + whiteboard), Generator, Flashcards, Summarizer, Dashboard, About the Founder, Settings.
Show me these and wait for my approval of the look before building features.

## 5. Creative design identity
- **The World Map:** illustrated map home screen; each subject is a district (Math = "Numbers Valley", Physics = "Energy Tower", Biology = "Living Forest", History = "Time Library", Languages = "Word Harbor", Law = "Justice Hall"...). Progress unlocks areas and the map grows. Must stay calm and readable on a small phone, with a simple "list view" alternative.
- **Brain Garden:** each mastered concept becomes a plant; forgotten topics wilt, reviewing revives them (tied to spaced repetition).
- **Guide characters:** an original mascot plus one original guide per subject with distinct personalities. Fully original, no copyrighted characters.

## 6. Phase 1 features (build ALL now)

### 6.1 AI Tutor: chat + living whiteboard
- Choose level and subject (or auto-detect) and ask anything. Step-by-step explanation in the student's language; the whiteboard animates each step (KaTeX equations, diagrams, graphs, timelines, highlighted key parts).
- **Explain-it-my-way modes:** "like I'm 10", "football analogy", "as a short story", "like a Moroccan street seller explaining", "exam-focused", "visual mind map".
- **Feynman Mode:** the student teaches a "beginner" AI that asks naive questions.
- **Socratic mode:** guiding questions and gradual hints.
- **Mistake detector:** identifies the TYPE of mistake and logs it in a "Mistakes Museum".

### 6.2 Exam, Exercise and Quest Generator
- Level, subject, lesson, difficulty, number, type (MCQ, short answer, problem, true/false, fill-the-blank, law case study).
- **Boss Battles** at chapter end; **Daily Quest** (3 challenges, 5 minutes); adaptive difficulty; detailed correction with the "why" and "retry a similar question".

### 6.3 Flashcards + Smart Review Plan
- Generate flashcards from lessons/PDFs; manual creation; images supported; SM-2 spaced repetition; daily "Review today".
- **Exam Countdown Planner:** exam dates + subjects produce an adaptive day-by-day plan with a Pomodoro timer.

### 6.4 Summarizer and Lesson Transformer
- PDF/text to summary, key points, definitions, formulas.
- One-click transform to: mind map, story, comic-style storyboard (text panels), mnemonic, one-page cheat sheet, flashcards, or quiz.

### 6.5 Gamification (light)
XP, streak with freeze, levels, badges, Brain Garden. No toxic leaderboards: compare only with your own past and optional friends.

## 7. Core pages
Landing (with @chrvvim branding), Sign up/Login (email + Google), World Map home, Dashboard, Tutor, Generator, Flashcards, Summarizer, Mistakes Museum, About the Founder, Settings (language, level, country, theme, font size, accessibility, comfort mode), Design system (`/design`).

## 8. Database (Supabase)
profiles, conversations, messages, quizzes, quiz_attempts, mistakes, flashcard_decks, flashcards (SM-2 fields), review_plans, documents, xp_events, badges, garden_plants, user_preferences (theme, font size, comfort settings). Row Level Security so each student only sees their own data. Provide the SQL.

## 9. AI design rules
- System prompt: patient, encouraging teacher who explains reasoning first and checks understanding; never just dumps homework answers.
- Law topics: base answers on Moroccan law, cite the relevant text when sure, say clearly when unsure, add a short disclaimer (educational, not legal advice).
- All whiteboard/quiz/flashcard outputs are structured JSON validated with zod, with a retry on invalid JSON.
- Safe for minors: refuse inappropriate content, no personal data sent to the model, no manipulative engagement tricks.

## 10. Later phases (design code so they plug in easily, do NOT build yet)
Voice tutor, homework-photo solving, student community, essay grading, mock national exams, virtual labs, live study rooms, personal memory tutor, teacher/parent dashboard, CHRVVIM CAMPUS integration, Legal Awareness feed, Writer's corner.

## 11. How to work with me
1. Show a short plan, folder structure, the @chrvvim logo concept, and the design system + wireframes (section 4.11) FIRST. Wait for my approval of the look.
2. Create the project and run it locally.
3. Build one feature at a time; after each, tell me exactly how to test it on phone and desktop.
4. Walk me through creating the free accounts and keys (Supabase, Gemini, Vercel) with exact clicks.
5. Before deploying, run an accessibility and performance check (Lighthouse) and fix issues.
6. Deploy to Vercel and give me the public link.
7. Write a short README in simple English.

Start now with step 1.
