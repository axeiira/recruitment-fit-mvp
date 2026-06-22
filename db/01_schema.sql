-- ============================================================
-- Schema: the "measurement substrate"
-- Turns scattered, unstructured recruitment data into a
-- structured, per-client, rubric-based dataset.
-- ============================================================

DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS client_rubrics CASCADE;
DROP TABLE IF EXISTS interview_outcomes CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Raw client requirements (deliberately unstructured input)
CREATE TABLE clients (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  industry         TEXT,
  interview_style  TEXT,             -- short human label, e.g. "polished consulting"
  raw_requirements TEXT NOT NULL,    -- messy stated requirements, as received
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Candidates with their existing (uncalibrated) internal score + messy notes
CREATE TABLE candidates (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  role           TEXT,
  internal_score NUMERIC,            -- the existing internal score (never validated vs. client outcome)
  raw_profile    TEXT NOT NULL,      -- interview notes / profile, as written by recruiters
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Historical outcomes: the (vague) client feedback + accept/reject.
-- This is the signal we want to make structured.
CREATE TABLE interview_outcomes (
  id           SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  client_id    INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  outcome      TEXT CHECK (outcome IN ('accepted', 'rejected')),
  raw_feedback TEXT,                 -- the vague feedback ("didn't show up well", etc.)
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Derived rubric: the vague constructs operationalized into scorable dimensions.
-- One current rubric per client (upserted on re-derive).
CREATE TABLE client_rubrics (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  dimensions  JSONB NOT NULL,        -- [{name, description, weight, strong_signal, weak_signal}]
  model       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Generated candidate-vs-client evaluation: scores + gap analysis + prep brief.
CREATE TABLE evaluations (
  id           SERIAL PRIMARY KEY,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  client_id    INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  overall_fit  NUMERIC,              -- 0-100
  scores       JSONB,                -- [{dimension, score (1-5), rationale}]
  gap_analysis TEXT,
  prep_brief   TEXT,
  model        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_outcomes_client ON interview_outcomes(client_id);
CREATE INDEX idx_outcomes_candidate ON interview_outcomes(candidate_id);
CREATE INDEX idx_evaluations_pair ON evaluations(candidate_id, client_id);
