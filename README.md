# PAL 2.0 — Personalized Adaptive Learning

Gamified adaptive learning platform by **Ulipsu / Kidvento Education**.  
1-skill POC: **Finance & Entrepreneurship (FE)** · ILM: L2AI02 (Rock Paper Scissors AI)

## Project Structure

```
pal2/
  frontend/         — Next.js 14 (App Router) + Tailwind + Zustand + TanStack Query
  backend/          — FastAPI Python 3.12 + Motor (MongoDB async) + Pydantic v2
  flow_diagrams.html — Standalone submission doc with all 4 system flow diagrams
```

## Quick Start

### 1. MongoDB Atlas
1. Create a cluster at cloud.mongodb.com
2. Enable Atlas Vector Search on the `lesson_chunks` collection
3. Note your connection string

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in MONGODB_URL, MONGODB_DB, JWT_SECRET_KEY, GEMINI_API_KEY
uvicorn app.main:app --reload
# API docs: http://localhost:8000/api/docs
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:3000
```

## Architecture

```
Browser (Next.js 14)
  ├── /login              → JWT auth (bcrypt + python-jose, 7-day tokens)
  ├── / (home)            → Skill selection (1 skill cap — FE only)
  ├── /skills/[id]        → Classes (ILMs) list
  ├── /skills/[id]/classes/[ilmId]  → Rank selection (Cadet→Commander)
  └── /mission/[id]       → RUAH adaptive assessment + Dynamic Applet

FastAPI Backend
  ├── POST /api/v1/auth/register         → Register student
  ├── POST /api/v1/auth/login            → Login → JWT
  ├── GET  /api/v1/profile/me            → Authenticated profile
  ├── POST /api/v1/missions              → Start mission
  ├── POST /api/v1/missions/:id/question → Next question (3-tier cascade)
  ├── POST /api/v1/missions/:id/answer   → Submit answer + RUAH engine
  ├── POST /api/v1/missions/:id/applet/generate  → AI-generate applet (F9)
  └── POST /api/v1/missions/:id/applet/complete  → Unlock rank

MongoDB (Motor async)
  ├── student_profiles   — user accounts + JWT auth
  ├── skills / ilms      — skill & class catalogue
  ├── missions           — session state + RUAH counters
  ├── lesson_chunks      — Atlas Vector Search (text-embedding-004, 768 dims)
  ├── content_bank       — pre-authored questions (Tier 1)
  └── rank_progress      — per-student rank unlock records
```

## RUAH Block Engine

```
R (1 correct) → U (1 correct) → A (2 consecutive correct) → H (6 consecutive correct)
                                                              ↓
                                              Ideal: 2 R/U + 2 A + 6 H = 10 total
                                              If 10 reached without ideal → Dynamic Applet (F9)
```

## AI Stack
- **Question generation**: Gemini 2.0 Flash (grounded with Atlas Vector Search RAG)
- **Embeddings**: Google text-embedding-004 (768 dims)
- **Applet generation**: Gemini 2.0 Flash → structured JSON spec (schema-constrained)
- **Fallback**: Static content bank (Tier 1) + local question pool (Tier 3)

## Flow Diagrams

Open `flow_diagrams.html` in any browser for all 4 system diagrams:

| ID  | Title |
|-----|-------|
| FD1 | System Request Flow — Layer Overview |
| FD2 | RUAH Mission Engine — Decision Flow |
| FD3 | AI Question Generation Cascade |
| FD4 | Applet Generation Pipeline (F9) |

## Deployment
- **Frontend**: Vercel (`vercel deploy`)
- **Backend**: Railway (`railway up`)
- **Database**: MongoDB Atlas (free tier M0+)
