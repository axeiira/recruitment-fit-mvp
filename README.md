# Fit — recruitment alignment MVP

A full-stack prototype for the AI Project Manager assignment. It addresses the core
problem from the meeting transcript: **candidates pass internal screening but convert
at clients only ~1 in 4, and the feedback explaining why is too vague to act on.**

The thesis (from Task 1): the binding constraint is **measurement**. You cannot improve
selection or candidate prep until you can observe what each client actually decides on.
So this MVP does two things, in order:

1. **Structure** the scattered, unstructured data into a per-client, scorable **rubric**
   (the measurement substrate).
2. **Generate** a fit score, gap analysis, and a **client-specific prep brief** for any
   candidate–client pairing (the value that moves the acceptance rate).

## The 3-screen flow

| Step | Screen | What it shows |
|------|--------|---------------|
| 1 | Raw data | The scattered inputs — client requirements, candidate notes, vague historical feedback. The problem, made visible. |
| 2 | Derive rubric | An LLM turns "presence" / "communication" / "culture fit" into weighted, observable dimensions, weighted by what actually drove past accept/reject decisions. |
| 3 | Fit & prep brief | Scores a candidate against a client's rubric, surfaces the gaps, and writes concrete coaching for *that* client. |

## Stack

- **Frontend** — React + Vite (IBM Plex Sans, weighted rubric bars as the signature element)
- **Backend** — Node + Express (ES modules)
- **Database** — PostgreSQL (the rubric/score store *is* the measurement substrate)
- **AI** — OpenAI via the OpenAI SDK, with strict-JSON extraction & generation prompts
  (see `backend/src/prompts.js`)

## Architecture

```
                 ┌──────────────┐     POST /api/clients/:id/rubric    ┌───────────┐
   React (Vite) ─┤   Express     ├── deriveRubric() ─────────────────▶│  OpenAI   │
   3 screens     │   API         │   buildRubricPrompt()              │  (JSON)   │
        │        │               ├── evaluate() ─────────────────────▶│           │
        │        │               │   buildEvaluationPrompt()          └───────────┘
        ▼        │               │
   /api/* ──────▶│               │── SQL ──▶  PostgreSQL
                 └──────────────┘            clients · candidates · interview_outcomes
                                             client_rubrics · evaluations
```

## Run locally

Prerequisites: Docker, Node 20+, and an OpenAI API key entered in the web UI when generating AI output.

```bash
# 1. backend + database (postgres auto-loads schema + seed on first boot)
cp .env.example .env          # optional: set OPENAI_MODEL
docker compose up --build     # backend on :4000, db on :5432

# 2. frontend (separate terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173 (proxies /api to :4000)
```

Check health: `curl localhost:4000/api/health` → `{ ok: true, model: ... }`.

This demo does not deploy with an owner OpenAI key. Users enter their own key in the browser before generating rubrics or fit briefs. The key is sent to the backend only in the `X-OpenAI-API-Key` header for generation requests, is not saved to Postgres, and is not stored by the browser. Deploy over HTTPS only.

Re-seeding: `docker compose down -v && docker compose up --build` starts from clean seed data.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET  | `/api/clients` `/api/candidates` `/api/outcomes` | Raw data (screen 1) |
| GET  | `/api/clients/:id/rubric` | Stored rubric (or null) |
| POST | `/api/clients/:id/rubric` | Derive + store rubric (screen 2) |
| POST | `/api/evaluate` `{candidateId, clientId}` | Score + gap analysis + prep brief (screen 3) |

## Deploying to AWS

- **Backend** → AWS App Runner from the `backend/Dockerfile` (simplest), or ECS Fargate.
  Set `DATABASE_URL` and optionally `OPENAI_MODEL` as service env vars. Avoid API Gateway + Lambda
  here — the 29s gateway timeout fights synchronous LLM generation.
- **Database** → Amazon RDS for PostgreSQL (small instance). Apply `db/01_schema.sql` and
  `db/02_seed.sql` once on provisioning.
- **Frontend** → `npm run build`, then host the static `dist/` on S3 + CloudFront (or Amplify).
  Set `VITE_API_URL` to the App Runner URL at build time.

## Intentionally out of scope

Auth, user management, multi-tenancy, real file ingestion, and a polished design system are
omitted to protect delivery speed. Scoring runs on synthetic seed data and is **illustrative,
not validated** — validation needs real structured outcomes, which is precisely the measurement
loop this tool is built to start.
