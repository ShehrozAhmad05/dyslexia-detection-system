# GPT Project Context: Dyslexia Detection System

Use this file as the single source of truth when asking GPT for UI/UX and product/design suggestions.

## 1) Project Goal

Build a **multimodal dyslexia screening web app** that combines:
- Handwriting assessment
- Reading assessment
- Keystroke dynamics assessment
- Memory assessment

The app should provide clear, child-friendly, explainable results and practical recommendations.

## 2) Current Stack (Actual Codebase)

- **Frontend:** React + Vite + Material UI + React Router + Axios
- **Backend:** Node.js + Express + MongoDB (Mongoose) + JWT auth
- **ML Layer:** Python FastAPI service in `ml-models/main.py` (partly placeholder)

## 3) Current Architecture

- `frontend/` → user-facing app
- `backend/` → auth + assessment APIs + data persistence
- `ml-models/` → ML inference endpoints (currently basic/placeholder in parts)
- `analysis/` → ETDD70 analysis outputs and threshold config generation artifacts
- `docs/` → project documentation

## 4) Frontend (Implemented Routes)

From `frontend/src/App.jsx`:

- Public:
  - `/` → Home
  - `/login` → Login
  - `/register` → Register
- Protected:
  - `/dashboard`
  - `/assessment/handwriting`
  - `/assessment/handwriting/results/:id`
  - `/reading-test`
  - `/reading-results/:id`
  - `/memory-test`
  - `/memory/sequence`
  - `/memory/word`
  - `/memory-results`

## 5) Backend (Implemented API Surface)

From `backend/src/server.js`:
- `/api/auth`
- `/api/handwriting`
- `/api/reading`
- `/api/keystroke`
- `/api/memory`

### Key routes currently available

#### Auth (`/api/auth`)
- `POST /register`
- `POST /login`
- `GET /me`
- `POST /logout`

#### Handwriting (`/api/handwriting`)
- `POST /upload`
- `POST /analyze/:id` (currently mock analysis)
- `GET /results/:id`
- `GET /history`
- `DELETE /:id`

#### Reading (`/api/reading`)
- `POST /start`
- `POST /submit`
- `GET /results/:id`
- `GET /thresholds`
- (history endpoint may exist depending on branch evolution)

#### Memory (`/api/memory`)
- `POST /start`
- `POST /submit`
- `GET /results/:id`
- `GET /history`

#### Keystroke (`/api/keystroke`)
- `POST /start`
- `POST /submit`
- `GET /results/:id`
- `GET /history`

## 6) Important Current Gaps / Mismatches

These are important so GPT suggestions stay realistic:

1. **Dashboard route mismatch:**
   - Dashboard button uses `/assessment/keystroke`
   - No matching frontend route currently defined in `App.jsx`

2. **Keystroke API mismatch in frontend service:**
   - `frontend/src/services/index.js` uses `POST /keystroke/analyze`
   - Backend expects `POST /api/keystroke/submit`

3. **Some service methods are planned but not yet backed by existing backend routes** (e.g., user profile/therapy/assessment endpoints in frontend service file).

4. **Handwriting analysis is still mock/stubbed** in backend route (not fully integrated with production ML inference flow).

## 7) Product/UX Direction Needed Now

I want to **start with UI design first**, then implement feature-by-feature.

Primary UI priorities:
- Clean, modern, professional look (health/education context)
- Simple and accessible for students and parents
- Clear progress and step-by-step assessment flow
- Friendly risk/result presentation (non-alarming tone)
- Mobile-responsive layouts

## 8) Design Constraints for Suggestions

When giving suggestions, keep these constraints:
- Keep existing stack (React + MUI)
- Prefer incremental improvements, not full rewrite
- Reuse existing route structure where possible
- Keep JWT auth flow and current backend structure
- Use practical components that can be built quickly in this repo

## 9) What I Want GPT To Deliver

When I ask for design help, I want:
- Information architecture (pages + navigation)
- Wireframe-level layout suggestions per page
- Component hierarchy for each screen
- Design system proposal (colors, typography, spacing, states)
- Accessibility checklist (contrast, focus, readable text)
- Prioritized implementation plan (MVP first)
- Exact file-level changes in this repo

## 10) Ready-to-Paste Prompt for GPT

Copy the text below when asking for suggestions:

---

You are helping me design and improve the UI of my existing Dyslexia Detection System project.

Project context:
- React + Vite + Material UI frontend
- Node + Express + MongoDB backend
- Modules: handwriting, reading, keystroke, memory
- Existing routes and APIs are documented in my `docs/GPT_PROJECT_CONTEXT.md`
- I want UI-first improvements, then phased implementation

Your task:
1. Propose a modern, accessible UI direction for this project.
2. Give a page-by-page layout plan for Home, Login/Register, Dashboard, Handwriting, Reading, Memory, Results.
3. Define a reusable design system (palette, typography, spacing, cards, buttons, alerts, charts).
4. Identify UX issues likely in my current flow and propose fixes.
5. Provide a prioritized implementation roadmap for my existing codebase (no full rewrite).
6. Include concrete file-level suggestions for `frontend/src`.

Please keep suggestions practical and compatible with my current architecture.

---

## 11) Notes For Future Contributors

Before proposing changes, always validate:
- Existing route names and API endpoints
- Auth-protected flows
- Current module completion status (some modules are partial)
- Non-breaking incremental upgrades over large refactors
