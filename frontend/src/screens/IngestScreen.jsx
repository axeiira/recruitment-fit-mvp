import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function IngestScreen({ goTo }) {
  const [clients, setClients] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.clients(), api.candidates(), api.outcomes()])
      .then(([c, ca, o]) => {
        setClients(c);
        setCandidates(ca);
        setOutcomes(o);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="eyebrow">Step 1 — the problem, made visible</div>
      <h2>The signal we have is scattered and unstructured</h2>
      <p className="lede">
        Client requirements, candidate notes, and historical feedback live in different places and
        different shapes. None of it is scorable yet. This is why we cannot diagnose why candidates
        fail — and why measurement comes first.
      </p>

      {error && <div className="error">{error}</div>}

      {loading && (
        <div className="loading">
          <span className="spinner" />
          Loading scattered data…
        </div>
      )}

      {!loading && !error && (
        <>
      <div className="grid-label">Client requirements ({clients.length})</div>
      {clients.map((c) => (
        <div key={c.id} className="card">
          <h3>{c.name}</h3>
          <div className="sub">
            {c.industry} · style: {c.interview_style}
          </div>
          <p className="raw">{c.raw_requirements}</p>
        </div>
      ))}

      <div className="grid-label">Candidate notes ({candidates.length})</div>
      {candidates.map((c) => (
        <div key={c.id} className="card">
          <h3>{c.name}</h3>
          <div className="sub">
            {c.role} · internal score {c.internal_score} (uncalibrated)
          </div>
          <p className="raw">{c.raw_profile}</p>
        </div>
      ))}

      <div className="grid-label">Historical client feedback ({outcomes.length})</div>
      <div className="card">
        {outcomes.map((o) => (
          <div key={o.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <span className={`pill ${o.outcome}`}>{o.outcome}</span>{" "}
            <b>{o.candidate_name}</b> <span className="sub">→ {o.client_name}</span>
            <p className="raw" style={{ marginTop: 4 }}>
              &ldquo;{o.raw_feedback}&rdquo;
            </p>
          </div>
        ))}
      </div>
        </>
      )}

      <div className="row" style={{ marginTop: 24 }}>
        <button className="btn" onClick={() => goTo("rubric")}>
          Structure this into rubrics →
        </button>
      </div>
    </section>
  );
}
