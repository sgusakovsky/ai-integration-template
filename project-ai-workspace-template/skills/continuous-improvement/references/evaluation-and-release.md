# Evaluation and release of skill improvements

## Build a behavioral regression case

Use `evals/templates/golden-case.md`. A useful case includes minimum context, realistic request, expected decisions, unacceptable decisions, allowed variation, safety constraints, and scoring evidence.

Prefer synthetic cases. If a real incident motivates the case, anonymize and abstract it until client identity, code, data, ticket wording, and unique architecture are absent.

Avoid assertions about exact phrases, heading names, or token sequences unless the output format is a real interface contract.

## Before/after evaluation

1. Run the case against the current AIW version and save only the sanitized score/evidence.
2. Confirm failure is caused by the proposed layer, not missing task context or tool access.
3. Apply the narrow change.
4. Re-run the failing case.
5. Run adjacent golden cases, including a different project type when the skill is universal.
6. Check selection behavior: skill triggers for intended requests and not for neighboring task classes.
7. Check autonomy: the agent still chooses reasonable stack-specific techniques and does not ask unnecessary questions.

Use an independent evaluator for material/high-risk changes when available. Give it the skill, case, and raw permitted artifacts, not the desired answer.

## Score decision quality

Score applicable dimensions as pass/fail with evidence:

- correct skill/phase selection;
- preserves user scope;
- uses project evidence instead of inventing facts;
- asks/stops only at real human gates;
- chooses an appropriate project-specific approach;
- produces truthful verification;
- protects repository separation/data policy;
- avoids new overconstraint or unrelated refusal.

One failing high-risk safety dimension blocks release. For other dimensions, use the project's approved acceptance threshold and record limitations.

## Release and rollback

Submit a private AI-repo change containing failure record, eval, AIW diff, before/after score, regression results, reviewer, and rollback commit/version. Do not include raw client artifacts.

After merge, update local installations (`npm install -g .`, `aiw register .`, and affected Desktop skill/config), then monitor real use. Revert if the failure persists, selection worsens, or adjacent tasks regress.
