import { Router } from "express";
import { query } from "../db.js";
import { completeJSON } from "../llm.js";
import { buildEvaluationPrompt } from "../prompts.js";
import { getOpenAIKey } from "../requestKey.js";

const router = Router();

router.get("/evaluations", async (req, res, next) => {
  try {
    const { candidateId, clientId } = req.query;
    if (!candidateId || !clientId) {
      return res.status(400).json({ error: "candidateId and clientId are required" });
    }

    const [client] = await query("SELECT * FROM clients WHERE id = $1", [clientId]);
    const [candidate] = await query("SELECT * FROM candidates WHERE id = $1", [candidateId]);
    if (!client || !candidate) {
      return res.status(404).json({ error: "Client or candidate not found" });
    }

    const [evaluation] = await query(
      `SELECT *
         FROM evaluations
        WHERE candidate_id = $1 AND client_id = $2
        ORDER BY created_at DESC
        LIMIT 1`,
      [candidateId, clientId]
    );

    res.json(evaluation ? { ...evaluation, candidate, client } : null);
  } catch (e) {
    next(e);
  }
});

// Generate a candidate-vs-client evaluation: scores + gap analysis + prep brief.
router.post("/evaluate", async (req, res, next) => {
  try {
    const { candidateId, clientId } = req.body || {};
    if (!candidateId || !clientId) {
      return res.status(400).json({ error: "candidateId and clientId are required" });
    }

    const [client] = await query("SELECT * FROM clients WHERE id = $1", [clientId]);
    const [candidate] = await query("SELECT * FROM candidates WHERE id = $1", [candidateId]);
    if (!client || !candidate) {
      return res.status(404).json({ error: "Client or candidate not found" });
    }

    const apiKey = getOpenAIKey(req);

    const [rubric] = await query("SELECT * FROM client_rubrics WHERE client_id = $1", [clientId]);
    if (!rubric) {
      return res.status(400).json({ error: "Generate a client rubric before evaluating candidates." });
    }

    const dimensions =
      typeof rubric.dimensions === "string" ? JSON.parse(rubric.dimensions) : rubric.dimensions;

    const { system, user } = buildEvaluationPrompt(client, dimensions, candidate);
    const { data, model } = await completeJSON({ system, user, maxTokens: 2000, apiKey });

    const [saved] = await query(
      `INSERT INTO evaluations (candidate_id, client_id, overall_fit, scores, gap_analysis, prep_brief, model)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        candidateId,
        clientId,
        data.overall_fit ?? null,
        JSON.stringify(data.scores ?? []),
        data.gap_analysis ?? "",
        data.prep_brief ?? "",
        model,
      ]
    );

    res.json({ ...saved, candidate, client });
  } catch (e) {
    next(e);
  }
});

export default router;
