import { Router } from "express";
import { query } from "../db.js";
import { completeJSON } from "../llm.js";
import { buildRubricPrompt, buildEvaluationPrompt } from "../prompts.js";

const router = Router();

// Generate a candidate-vs-client evaluation: scores + gap analysis + prep brief.
// If the client has no rubric yet, derive it first (so the demo never dead-ends).
router.post("/evaluate", async (req, res, next) => {
  try {
    const { candidateId, clientId } = req.body;
    if (!candidateId || !clientId) {
      return res.status(400).json({ error: "candidateId and clientId are required" });
    }

    const [client] = await query("SELECT * FROM clients WHERE id = $1", [clientId]);
    const [candidate] = await query("SELECT * FROM candidates WHERE id = $1", [candidateId]);
    if (!client || !candidate) {
      return res.status(404).json({ error: "Client or candidate not found" });
    }

    // Ensure a rubric exists
    let [rubric] = await query("SELECT * FROM client_rubrics WHERE client_id = $1", [clientId]);
    if (!rubric) {
      const outcomes = await query(
        `SELECT o.outcome, o.raw_feedback, c.name AS candidate_name
           FROM interview_outcomes o JOIN candidates c ON c.id = o.candidate_id
          WHERE o.client_id = $1`,
        [clientId]
      );
      const rp = buildRubricPrompt(client, outcomes);
      const derived = await completeJSON({ system: rp.system, user: rp.user, maxTokens: 1500 });
      [rubric] = await query(
        `INSERT INTO client_rubrics (client_id, dimensions, model)
         VALUES ($1, $2, $3)
         ON CONFLICT (client_id) DO UPDATE SET dimensions = EXCLUDED.dimensions
         RETURNING *`,
        [clientId, JSON.stringify(derived.data.dimensions), derived.model]
      );
    }

    const dimensions =
      typeof rubric.dimensions === "string" ? JSON.parse(rubric.dimensions) : rubric.dimensions;

    const { system, user } = buildEvaluationPrompt(client, dimensions, candidate);
    const { data, model } = await completeJSON({ system, user, maxTokens: 2000 });

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
