import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function RubricScreen() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [client, setClient] = useState(null);
  const [rubric, setRubric] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.clients().then((c) => {
      setClients(c);
      if (c[0]) setClientId(String(c[0].id));
    });
  }, []);

  useEffect(() => {
    if (!clientId) return;
    setRubric(null);
    setError(null);
    setClient(clients.find((c) => String(c.id) === clientId) || null);
    api.getRubric(clientId).then(setRubric).catch(() => {});
  }, [clientId, clients]);

  async function derive() {
    setLoading(true);
    setError(null);
    try {
      setRubric(await api.deriveRubric(clientId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const dims = rubric
    ? typeof rubric.dimensions === "string"
      ? JSON.parse(rubric.dimensions)
      : rubric.dimensions
    : [];

  return (
    <section>
      <div className="eyebrow">Step 2 — operationalize the vague constructs</div>
      <h2>Derive a scorable rubric per client</h2>
      <p className="lede">
        The model reads the stated requirements and the messy history, then turns &ldquo;presence&rdquo;,
        &ldquo;communication&rdquo;, and &ldquo;culture fit&rdquo; into weighted, observable dimensions —
        weighted by what actually drove past accept / reject decisions.
      </p>

      <div className="row">
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
        <button className="btn" onClick={derive} disabled={loading} style={{ alignSelf: "flex-end" }}>
          {loading ? "Deriving…" : rubric ? "Re-derive rubric" : "Derive rubric"}
        </button>
      </div>

      {client && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="sub">Stated requirements (before)</div>
          <p className="raw">{client.raw_requirements}</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {dims.length > 0 && (
        <>
          <div className="grid-label">Derived rubric (after)</div>
          <div className="card">
            {dims.map((d, i) => (
              <div key={i} className="dim">
                <div className="dim-head">
                  <span className="dim-name">{d.name}</span>
                  <span className="dim-weight">{Math.round((d.weight || 0) * 100)}%</span>
                </div>
                <div className="bar">
                  <span style={{ width: `${Math.min(100, (d.weight || 0) * 100)}%` }} />
                </div>
                <div className="dim-desc">{d.description}</div>
                <div className="signals">
                  <div className="s">
                    <b>Strong</b>
                    {d.strong_signal}
                  </div>
                  <div className="w">
                    <b>Weak</b>
                    {d.weak_signal}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="note">
            Weights are inferred from historical outcomes, not just stated preferences — that is the
            difference between what a client says they want and what they actually select on.
          </p>
        </>
      )}

      {!dims.length && !loading && !error && (
        <div className="empty">No rubric yet. Derive one to see the dimensions.</div>
      )}
    </section>
  );
}
