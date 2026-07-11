# CivicFlow 🏙️

**AI-powered citizen grievance tracking.**

We've all been there — you report a pothole or a water leak to your local municipality and then... nothing. No confirmation, no tracking number that actually means anything, no idea if someone's even looking at it. CivicFlow tries to fix that.

Citizens describe their complaint in plain language. An AI reads it, figures out what kind of issue it is (water, road, sanitation, electricity), how urgent it is, and which department should handle it — all automatically. The complaint gets a unique ID, gets assigned to the right officer, and if nobody touches it before the SLA deadline, it auto-escalates. No manual sorting, no complaints falling through the cracks.

## What it actually does

- **Submit a complaint** — just describe the issue, no dropdowns or category picking required
- **AI classification** — an LLM reads the complaint and tags it with category, priority, and department
- **Auto-assignment** — complaints get routed to the least-busy officer in the right department (real round-robin load balancing, not just "first available")
- **Live tracking** — citizens get a complaint ID and can check status anytime, with a full timeline of what happened and when
- **Auto-escalation** — if a complaint sits past its SLA deadline, it escalates on its own. No human has to notice and flag it.
- **Duplicate detection** — if five people report the same pothole, the system catches it and links them instead of creating five separate tickets
- **An actual reasoning AI agent** — not just classification. A separate agent periodically reviews at-risk complaints and reasons through what should happen next (escalate? reprioritize? just wait?), with its reasoning logged and visible. This is agentic AI in the real sense — it perceives, reasons, and recommends, not just responds to a single prompt.
- **RAG-powered assistant** — citizens can ask questions in plain language ("what's the status of my complaint?", "how do I report a pothole?") and get answers grounded in real data pulled from the database, not just generic AI guessing
- **Admin dashboard** — a separate, dedicated tool for officials to see everything, update statuses, and dig into analytics

## Why we built it this way

We split this into three pieces on purpose:
- **`backend/`** — FastAPI + MongoDB, does all the actual work
- **`frontend/`** — the citizen-facing app (Home, Submit, Track, AI Assistant)
- **`adminpage/`** — a separate app just for officials (Dashboard, Analytics)

Keeping citizen and admin interfaces as genuinely separate apps meant we could keep the public-facing side simple and fast, while giving admins a denser, more operational view — without either one compromising the other.

## Tech stack

- **Backend:** Python, FastAPI
- **Database:** MongoDB Atlas
- **AI:** LLM API for classification, the reasoning agent, and the RAG assistant
- **Frontend:** React (Vite)
- **Email:** SMTP for complaint confirmations
- **Deployed on:** Render (backend) + Vercel (both frontends)

## Honest limitations

Some corners were cut on purpose to keep this focused:
- **No real authentication** — the admin dashboard is protected by a basic shared password, not proper role-based login. A production version would need real auth.
- **SMS notifications** — we tried, ran into a provider approval delay we couldn't clear in time, and shipped email confirmations instead.
- **No photo uploads, no multilingual support, no feedback ratings** — all reasonable next steps, all cut to keep scope realistic for the timeline.

We'd rather ship something that actually works end-to-end than something ambitious that breaks under real use.

## Running it locally

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # or activate.fish on fish shell
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

**Citizen frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Admin app:**
```bash
cd adminpage
npm install
npm run dev
```

You'll need a `.env` file in `backend/` with your own MongoDB URI, AI API credentials, and email credentials — see `.env.example` for the full list.

## Team

Built by Ekaanksh Patil.

---

*Thanks for reading this far. The AI agent was the most fun part to build — go poke at the "AI Agent Insights" panel in the admin dashboard, it's the part we're proudest of.*
