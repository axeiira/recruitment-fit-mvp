export function getOpenAIKey(req) {
  const apiKey = req.get("X-OpenAI-API-Key")?.trim();
  if (!apiKey) {
    const err = new Error("OpenAI API key is required for generation.");
    err.status = 400;
    throw err;
  }
  return apiKey;
}
