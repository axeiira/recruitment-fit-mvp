import { Router } from "express";
import { query } from "../db.js";
import { completeJSON } from "../llm.js";
import { buildRubricPrompt } from "../prompts.js";
import { getOpenAIKey } from "../requestKey.js";

const router = Router();

// Get the stored rubric for a client (null if not derived yet)
router.get("/clients/:id/rubric", async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT * FROM client_rubrics WHERE client_id = $1",
      [req.params.id]
    );
    res.json(rows[0] || null);
  } catch (e) {
    next(e);
  }
});

// Derive (or re-derive) a client's rubric from requirements + history, then store it
router.post("/clients/:id/rubric", async (req, res, next) => {
  try {
    const id = req.params.id;
    const [client] = await query("SELECT * FROM clients WHERE id = $1", [id]);
    if (!client) return res.status(404).json({ error: "Client not found" });

    const outcomes = await query(
      `SELECT o.outcome, o.raw_feedback, c.name AS candidate_name
         FROM interview_outcomes o
         JOIN candidates c ON c.id = o.candidate_id
        WHERE o.client_id = $1`,
      [id]
    );

    const apiKey = getOpenAIKey(req);
    const { system, user } = buildRubricPrompt(client, outcomes);
    const { data, model } = await completeJSON({ system, user, maxTokens: 1500, apiKey });

    if (!data.dimensions || !Array.isArray(data.dimensions)) {
      return res.status(502).json({ error: "Model returned no dimensions" });
    }

    const [saved] = await query(
      `INSERT INTO client_rubrics (client_id, dimensions, model)
       VALUES ($1, $2, $3)
       ON CONFLICT (client_id)
       DO UPDATE SET dimensions = EXCLUDED.dimensions, model = EXCLUDED.model, created_at = now()
       RETURNING *`,
      [id, JSON.stringify(data.dimensions), model]
    );

    res.json(saved);
  } catch (e) {
    next(e);
  }
});

export default router;
