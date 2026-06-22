const BASE = import.meta.env.VITE_API_URL || "";

async function req(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  clients: () => req("/api/clients"),
  candidates: () => req("/api/candidates"),
  outcomes: () => req("/api/outcomes"),
  getRubric: (clientId) => req(`/api/clients/${clientId}/rubric`),
  deriveRubric: (clientId) => req(`/api/clients/${clientId}/rubric`, { method: "POST" }),
  evaluate: (candidateId, clientId) =>
    req("/api/evaluate", { method: "POST", body: JSON.stringify({ candidateId, clientId }) }),
};
