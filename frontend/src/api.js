const BASE = import.meta.env.VITE_API_URL || "";

async function req(path, options = {}, attempt = 1) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    return res.json();
  } catch (err) {
    // fetch() rejects with a TypeError on network-level failures (stale keep-alive /
    // "network connection was lost" after the tab has been idle). Retrying opens a
    // fresh connection. Only retry idempotent GETs so POSTs (evaluate / derive) are
    // never duplicated.
    const method = (options.method || "GET").toUpperCase();
    const isNetworkError = err instanceof TypeError;
    if (isNetworkError && method === "GET" && attempt < 4) {
      await new Promise((r) => setTimeout(r, 400 * attempt)); // 400ms, 800ms, 1200ms
      return req(path, options, attempt + 1);
    }
    throw err;
  }
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
