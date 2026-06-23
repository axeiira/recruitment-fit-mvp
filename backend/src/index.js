import "dotenv/config";
import express from "express";
import cors from "cors";

import dataRoutes from "./routes/data.js";
import rubricRoutes from "./routes/rubrics.js";
import evaluateRoutes from "./routes/evaluate.js";
import { MODEL } from "./llm.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, model: MODEL })
);

app.use("/api", dataRoutes);
app.use("/api", rubricRoutes);
app.use("/api", evaluateRoutes);

// Centralized error handler — surfaces a clean message to the client
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on :${PORT} (model: ${MODEL})`));
