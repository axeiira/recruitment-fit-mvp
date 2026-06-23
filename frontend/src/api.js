const BASE = import.meta.env.VITE_API_URL || "";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
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
  deriveRubric: (clientId, openaiApiKey) =>
    req(`/api/clients/${clientId}/rubric`, {
      method: "POST",
      headers: { "X-OpenAI-API-Key": openaiApiKey },
    }),
  getEvaluation: (candidateId, clientId) =>
    req(`/api/evaluations?candidateId=${candidateId}&clientId=${clientId}`),
  evaluate: (candidateId, clientId, openaiApiKey) =>
    req("/api/evaluate", {
      method: "POST",
      headers: { "X-OpenAI-API-Key": openaiApiKey },
      body: JSON.stringify({ candidateId, clientId }),
    }),
};
