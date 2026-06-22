import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// All clients with their raw requirements
router.get("/clients", async (_req, res, next) => {
  try {
    res.json(await query("SELECT * FROM clients ORDER BY id"));
  } catch (e) {
    next(e);
  }
});

// All candidates
router.get("/candidates", async (_req, res, next) => {
  try {
    res.json(await query("SELECT * FROM candidates ORDER BY id"));
  } catch (e) {
    next(e);
  }
});

// Historical outcomes, joined with names — the messy raw signal
router.get("/outcomes", async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT o.id, o.outcome, o.raw_feedback,
              c.name AS candidate_name, cl.name AS client_name
         FROM interview_outcomes o
         JOIN candidates c  ON c.id  = o.candidate_id
         JOIN clients    cl ON cl.id = o.client_id
        ORDER BY o.id`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
