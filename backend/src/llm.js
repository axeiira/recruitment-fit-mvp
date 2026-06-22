import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

let client = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to backend/.env (see .env.example)."
    );
  }
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

// Pull the first valid JSON object out of a model response, tolerating
// stray prose or ```json fences. Throws if nothing parseable is found.
function parseJsonLoose(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice);
}

/**
 * Call the model and return parsed JSON.
 * @returns {Promise<{data: object, model: string}>}
 */
export async function completeJSON({ system, user, maxTokens = 2000 }) {
  const res = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const text = res.choices[0]?.message?.content || "";

  try {
    return { data: parseJsonLoose(text), model: MODEL };
  } catch (err) {
    throw new Error(`Model did not return valid JSON: ${err.message}\nRaw: ${text.slice(0, 500)}`);
  }
}

export { MODEL };
