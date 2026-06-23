import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function MatchScreen() {
  const [clients, setClients] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [clientId, setClientId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.clients().then((c) => {
      setClients(c);
      if (c[0]) setClientId(String(c[0].id));
    });
    api.candidates().then((c) => {
      setCandidates(c);
      if (c[0]) setCandidateId(String(c[0].id));
    });
  }, []);

  useEffect(() => {
    if (!candidateId || !clientId) return;

    let cancelled = false;
    setError(null);

    api
      .getEvaluation(Number(candidateId), Number(clientId))
      .then((saved) => {
        if (!cancelled) setResult(saved);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [candidateId, clientId]);

  async function evaluate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api.evaluate(Number(candidateId), Number(clientId)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const scores = result
    ? typeof result.scores === "string"
      ? JSON.parse(result.scores)
      : result.scores
    : [];

  return (
    <section>
      <div className="eyebrow">Step 3 — turn measurement into value</div>
      <h2>Fit score and a client-specific prep brief</h2>
      <p className="lede">
        Score a candidate against a specific client&rsquo;s rubric, see where they are likely to fall
        short, and generate concrete coaching for that client. The same candidate scores differently
        across clients — that is the point.
      </p>

      <div className="row">
        <div className="field">
          <label>Candidate</label>
          <select value={candidateId} onChange={(e) => setCandidateId(e.target.value)}>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.role}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" onClick={evaluate} disabled={loading} style={{ alignSelf: "flex-end" }}>
          {loading ? "Generating…" : "Generate fit brief"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {result && (
        <>
          <div className="card" style={{ marginTop: 18 }}>
            <div className="fit">
              <div className="score">
                {Math.round(result.overall_fit)}
                <small>/100 fit</small>
              </div>
              <div className="sub">
                {result.candidate.name} → {result.client.name}
              </div>
            </div>
            {scores.map((s, i) => (
              <div key={i}>
                <div className="score-row">
                  <span className="dn">{s.dimension}</span>
                  <span className="sb">
                    <span style={{ width: `${(s.score / 5) * 100}%` }} />
                  </span>
                  <span className="sv">{s.score}/5</span>
                </div>
                <p className="rationale">{s.rationale}</p>
              </div>
            ))}
          </div>

          <div className="grid-label">Gap analysis</div>
          <div className="card brief">{result.gap_analysis}</div>

          <div className="grid-label">Prep brief for {result.client.name}</div>
          <div className="card brief">{result.prep_brief}</div>

          <p className="note">
            Scoring is illustrative on synthetic data — validation requires real structured outcomes,
            which is exactly the measurement loop this tool is built to create.
          </p>
        </>
      )}
    </section>
  );
}
