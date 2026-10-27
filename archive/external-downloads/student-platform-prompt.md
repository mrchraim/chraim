# PROMPT: Build "Taalim AI" - an AI-powered student learning platform

You are a senior full-stack engineer. Build the complete project from scratch, step by step, and explain each step simply. I am a total beginner and cannot code, so: run the commands yourself when you can, tell me exactly what to click or paste when you can't, and never skip a step.

## 1. Goal
A free, powerful educational website for students of ALL levels (primary, middle school, high school/Baccalaureate, university), ALL subjects, in Arabic (default, RTL), French and English. Default curriculum: Morocco (user can change country/level in settings).

## 2. Constraints
- Must run 100% on FREE tiers: Vercel (hosting), Supabase (database + auth), and the FREE Google Gemini API (gemini-2.5-flash or the best free model available; fall back to Groq free tier if rate-limited).
- API keys live only in server-side environment variables (.env.local), never in browser code.
- Add per-user daily rate limiting and caching of AI answers to stay inside free limits.
- Mobile-first, fast, beautiful, accessible. Dark/light mode.

## 3. Tech stack
Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui, next-intl for ar/fr/en with full RTL, Supabase (Postgres + Auth + Storage), KaTeX for math, Mermaid/SVG for diagrams, pdf-parse for PDFs.

## 4. Phase 1 features (build ALL of these now)
1. **AI Tutor (chat + whiteboard)**
   - Student picks level, subject, and asks a question (text).
   - Tutor explains step by step, adapts to the student's level, answers in the student's language.
   - Whiteboard panel next to the chat: shows the explanation as animated steps with math (KaTeX), simple diagrams and short examples.
   - Buttons: "Explain simpler", "Give an example", "Test me".
2. **Exam & Exercise Generator**
   - Choose level, subject, lesson, difficulty, number of questions, type (MCQ, short answer, problem).
   - AI returns structured JSON; the page renders it; student answers; AI grades with a clear correction and explanation.
   - Save results to the database.
3. **Flashcards + Smart Review Plan**
   - Generate flashcards from any lesson or text, or create manually.
   - Spaced repetition (SM-2 algorithm). Daily "Review today" page.
   - Smart plan: student enters exam date and subjects; app builds a day-by-day schedule and adjusts it to weak topics.
4. **Summarizer**
   - Upload a PDF or paste text; get a short summary, key points, key definitions, and optional flashcards/quiz from it.

## 5. Core pages
Landing page, Sign up/Login (email + Google), Dashboard (today's tasks, progress, streak), Tutor, Generator, Flashcards, Summarizer, Settings (language, level, country, theme).

## 6. Database (Supabase)
profiles, conversations, messages, quizzes, quiz_attempts, flashcard_decks, flashcards (with SM-2 fields), review_plans, documents. Enable Row Level Security so each student sees only their own data. Provide the SQL.

## 7. AI design rules
- System prompt: patient teacher, never just gives the final answer for homework: explains reasoning first, checks understanding.
- Always return structured JSON for the whiteboard, quizzes and flashcards, and validate it with zod.
- Safe for minors: refuse inappropriate content, no personal data in prompts.

## 8. Later phases (design the code so these are easy to add, but do NOT build yet)
Voice tutor (browser Web Speech API), homework-photo solving, student community, essay/homework grading, points & badges, personal memory tutor, live study rooms, mock exams, virtual labs.

## 9. How to work with me
1. First show a short plan and the folder structure.
2. Create the project and run it locally.
3. Build one feature at a time; after each, tell me how to test it.
4. Walk me through creating the free accounts and getting keys (Supabase, Gemini, Vercel), with exact clicks.
5. At the end, deploy to Vercel and give me the public link.
6. Write a short README in simple English.

Start now with step 1.
