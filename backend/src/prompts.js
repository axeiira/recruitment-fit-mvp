// ============================================================
// Prompts: the two LLM jobs that power the MVP.
//   1) deriveRubric  — extraction: messy text -> scorable rubric
//   2) evaluate      — generation: rubric + candidate -> scores,
//                      gap analysis, and a client-specific prep brief
// Both demand strict JSON so the output drops straight into Postgres.
// ============================================================

// ---- 1. Rubric derivation (structure the measurement) -------------------

export function buildRubricPrompt(client, outcomes) {
  const history = outcomes.length
    ? outcomes
        .map(
          (o) =>
            `- [${o.outcome.toUpperCase()}] ${o.candidate_name}: "${o.raw_feedback}"`
        )
        .join("\n")
    : "(no historical outcomes yet — infer the rubric from the stated requirements alone)";

  const system = `You are a recruitment analyst. Your job is to turn a client's vague, stated preferences and their messy historical interview feedback into an explicit, scorable rubric.

You operationalize fuzzy constructs ("executive presence", "culture fit", "communication") into concrete, observable dimensions. You infer the RELATIVE WEIGHT of each dimension from what actually drove accept/reject decisions in the history, not just from what the client claims to want.

Return ONLY a JSON object, no prose, no markdown fences. Schema:
{
  "dimensions": [
    {
      "name": "string (short, e.g. 'Executive communication')",
      "description": "string (what this dimension measures, one sentence)",
      "weight": number (0 to 1; all weights sum to ~1.0),
      "strong_signal": "string (what a strong candidate looks like on this dimension)",
      "weak_signal": "string (what a weak candidate looks like)"
    }
  ]
}
Produce 4 to 6 dimensions. Weights must reflect what separated accepts from rejects in the history.`;

  const user = `CLIENT: ${client.name} (${client.industry || "n/a"})
Stated interview style: ${client.interview_style || "n/a"}

STATED REQUIREMENTS (as received, unstructured):
"""
${client.raw_requirements}
"""

HISTORICAL OUTCOMES AND FEEDBACK (vague, inconsistent — this is the signal to mine):
${history}

Derive this client's rubric as JSON.`;

  return { system, user };
}

// ---- 2. Candidate evaluation (generate the value) -----------------------

export function buildEvaluationPrompt(client, dimensions, candidate) {
  const rubricText = dimensions
    .map(
      (d, i) =>
        `${i + 1}. ${d.name} (weight ${d.weight}) — ${d.description}\n   strong: ${d.strong_signal}\n   weak: ${d.weak_signal}`
    )
    .join("\n");

  const system = `You are an interview-prep coach for a recruitment agency. Given a CLIENT'S RUBRIC and a CANDIDATE'S profile, you do three things:
1. Score the candidate on each rubric dimension (1-5) with a one-line rationale grounded in the candidate's profile.
2. Identify where the candidate is most likely to fall short FOR THIS SPECIFIC CLIENT (the gap analysis).
3. Write a concrete, client-specific prep brief: what this candidate should do differently to present well for THIS client. Be specific and actionable, not generic advice.

The same candidate may be a great fit for one client and a poor fit for another — your scoring and advice must be tailored to this client's rubric and style.

Return ONLY a JSON object, no prose, no markdown fences. Schema:
{
  "overall_fit": number (0-100, weighted by the rubric),
  "scores": [ { "dimension": "string (matches a rubric dimension name)", "score": number (1-5), "rationale": "string" } ],
  "gap_analysis": "string (2-4 sentences on the biggest risks for this client)",
  "prep_brief": "string (3-6 concrete, client-specific coaching points; plain text, use line breaks between points)"
}`;

  const user = `CLIENT: ${client.name}
Interview style: ${client.interview_style || "n/a"}

CLIENT RUBRIC:
${rubricText}

CANDIDATE: ${candidate.name} — ${candidate.role || "n/a"}
Internal score (uncalibrated): ${candidate.internal_score ?? "n/a"}
Profile / interview notes:
"""
${candidate.raw_profile}
"""

Evaluate this candidate against this client's rubric and return JSON.`;

  return { system, user };
}
