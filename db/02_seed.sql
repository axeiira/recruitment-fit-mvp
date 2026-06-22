-- ============================================================
-- Synthetic seed data
-- No real recruitment data exists, so we seed realistic, messy
-- inputs. Three clients with deliberately DIFFERENT styles so
-- the per-client rubric actually diverges.
-- ============================================================

INSERT INTO clients (name, industry, interview_style, raw_requirements) VALUES
('Meridian Strategy', 'Management Consulting', 'polished / executive',
 'We place candidates in front of C-level stakeholders. They must communicate with structure and poise, handle pushback gracefully, and frame answers around business impact. We have passed on people who were technically excellent but rambled or could not hold the room. Slides and clarity matter. Think "trusted advisor".'),
('Voltkraft Labs', 'Seed-stage Startup', 'scrappy / hands-on',
 'Early team, move fast, wear many hats. We want builders who are energetic, opinionated, and comfortable with ambiguity. Over-polished consulting types tend to flop here. Show us you have actually shipped things and can get your hands dirty. Culture and drive over formality.'),
('Nexa Bank', 'Financial Services', 'formal / risk-aware',
 'Regulated environment. Candidates must demonstrate rigor, attention to compliance, and careful, measured communication. We value people who think before they speak and can document decisions. Casual or overconfident candidates raise flags with our panel.');

INSERT INTO candidates (name, role, internal_score, raw_profile) VALUES
('Andra W.', 'Backend Engineer', 8.5,
 'Very strong technically. 6 yrs Go/Node. In our behavioral interview gave long, detailed answers, sometimes went deep into the weeds. Quiet, modest. Did a take-home that was clean. Not very flashy in conversation.'),
('Bea S.', 'Product Manager', 7.8,
 'Excellent communicator, structured, presents well. Consulting background. Some concern she is more polish than depth, but references are good. Comfortable with executives.'),
('Citra R.', 'Full-stack Engineer', 8.0,
 'High energy, ships fast, lots of side projects. Informal, jumps between ideas. Great culture-add for a startup vibe. Communication is casual, occasionally scattered.'),
('Dimas P.', 'Data Analyst', 7.5,
 'Methodical, careful, documents everything. Slightly nervous in interviews, measured speaker. Strong on rigor and compliance topics. Not a natural self-promoter.'),
('Eka N.', 'Engineering Lead', 8.2,
 'Confident, fast talker, very persuasive. Strong opinions. Can come across as overconfident. Good at rallying a room, lighter on detailed follow-through.');

-- Historical outcomes with vague client feedback (the signal we will structure)
INSERT INTO interview_outcomes (candidate_id, client_id, outcome, raw_feedback) VALUES
(1, 1, 'rejected', 'Knew his stuff but did not show up well. Lost the room, too in the weeds.'),
(1, 2, 'accepted', 'Loved that he just builds. No fluff. Good fit for the team.'),
(2, 1, 'accepted', 'Polished, clear, handled our partners nicely. Trusted-advisor feel.'),
(2, 2, 'rejected', 'Felt a bit corporate for us, not sure she would roll up her sleeves.'),
(3, 2, 'accepted', 'Tons of energy, clearly a builder. Exactly our vibe.'),
(3, 1, 'rejected', 'Bright but came across scattered, not enough executive presence.'),
(4, 3, 'accepted', 'Careful and rigorous, exactly what our compliance panel wants.'),
(4, 1, 'rejected', 'Technically fine but too timid in front of stakeholders.'),
(5, 2, 'accepted', 'Great drive and confidence, will push things forward.'),
(5, 3, 'rejected', 'Came across as overconfident, glossed over the risk questions.');
