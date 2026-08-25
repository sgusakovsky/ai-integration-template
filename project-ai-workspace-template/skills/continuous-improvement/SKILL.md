---
name: project-skill-improvement
description: Improve this project's agents, skills, workflows, profiles, or adapters after a demonstrated poor outcome or repeated friction. Use for the AI operating layer itself, not for ordinary customer feature implementation.
---

# Project skill improvement

Turn observed AI delivery failures into narrow, reviewable, regression-tested improvements of the private AI workspace.

This is operational learning through versioned instructions and evals. It does not train model weights, create autonomous memory, or permit storage of customer code, prompts, transcripts, personal data, production data, or secrets.

## Diagnose before editing

Classify the failure using evidence. The correction may belong in:

- `project/profile.json` — project facts, commands, paths, tool/data settings;
- `project/glossary.md` or base instructions — stable project context/invariant;
- `agents/` — role ownership, procedure, or output contract;
- `skills/` — reusable decision guidance for a task class;
- `workflows/` — ordering, gates, handoffs, or lifecycle;
- `templates/` — missing output fields;
- `adapters/` or `bin/` — enforcement, tool invocation, or deterministic mechanics;
- no AIW change — unclear task, missing human decision, tool outage, model limitation, or one-off execution mistake.

Do not add a universal skill rule merely because one output was disliked. Require a concrete failure mode and a plausible decision-level correction.

## Improvement loop

1. Create a sanitized failure record using `evals/templates/failure-record.md`.
2. Reproduce the decision failure with a synthetic or anonymized case when possible.
3. State the desired behavior and a falsifiable change hypothesis.
4. Choose the narrowest correct layer and smallest instruction/mechanism change.
5. Add or update an eval that fails before the change for the right reason.
6. Apply the change without encoding customer-specific source or brittle wording.
7. Validate skill structure and forward-test realistic behavior.
8. Check for regressions: over-triggering, excessive refusal, lost autonomy, larger context, conflicting rules, and impact on other project types.
9. Obtain human review and merge through the private AI-repo process.
10. Observe later use; revert or refine if the expected decision does not improve.

Read [references/failure-analysis.md](references/failure-analysis.md) to classify cause and choose the correct configuration layer.

Read [references/evaluation-and-release.md](references/evaluation-and-release.md) to design regression cases, score behavior, and release safely.

## Guardrails

- Generalize from the decision pattern, not customer nouns, file names, code, or ticket wording.
- Prefer replacing an unclear rule over appending another overlapping rule.
- Preserve human authority and task scope; a skill improvement cannot grant new permissions.
- Keep skills concise. Move conditional details into references and deterministic repetition into scripts.
- Never edit the customer repository while improving AIW instructions.
- Never commit or push without explicit human authorization.

## Completion contract

Report failure classification, sanitized evidence, changed layer/files, hypothesis, before/after eval result, regression checks, limitations, reviewer/approval required, and rollback method.
