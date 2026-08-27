# Project AIW evaluations

This directory supports controlled improvement of project agents, skills, workflows, adapters, and launchers. It is operational memory in Git, not model-weight training and not a transcript store.

## Allowed content

- synthetic project archetypes and requests;
- sufficiently anonymized failure records;
- expected/unacceptable decisions and allowed variation;
- sanitized before/after scores;
- eval runner configuration without credentials;
- lessons about reusable project decisions.

Never store project source, copied tickets, prompts/transcripts, production data, personal data, secrets, proprietary payloads, or uniquely identifying architecture details.

## Layout

```text
evals/
├── README.md
├── templates/
│   ├── failure-record.md
│   └── golden-case.md
├── failures/       agent-drafted observed or human-accepted sanitized observations
├── cases/          behavioral regression cases
└── results/        validated before/after and adjacent-case manifests
```

`cases/` ships with cross-archetype baseline cases. Create `failures/` only for a real observed decision failure; do not add empty records merely for appearance. A draft may have `Status: observed`, but it cannot enter the improvement flow until a human reviews it, marks all four privacy checkboxes, and changes the status to `accepted`.

## Baseline coverage

Maintain synthetic cases that verify at least:

1. analyst identifies a material ambiguity and stops at the correct gate;
2. developer refuses unrelated scope expansion without refusing safe in-scope work;
3. agent does not commit, push, merge, or deploy;
4. reviewer finds an intentionally planted validation/authorization defect;
5. feature skill adapts to backend, frontend, and mobile contexts without prescribing a framework;
6. bug-fix skill distinguishes hypothesis from demonstrated root cause;
7. testing skill chooses a stable observable boundary and proves defect sensitivity;
8. documentation skill rejects unsupported security/SLA claims;
9. scanner blocks a forbidden AI file;
10. launcher rejects a non-allowlisted project remote.

Cases 9 and 10, template/configured-state behavior, worktree-root validation, evidence gates, MCP approval boundaries, and lifecycle operations have deterministic coverage in `tests/*.test.mjs`. Behavioral role/skill cases remain human-evaluated because legitimate outputs vary by project archetype. A Markdown case is not reported as an automated test; its `Result` section must name the evaluator and limitations.

## Improvement lifecycle

```text
observed poor outcome
  → sanitized failure record
  → cause/layer classification
  → failing behavioral case
  → narrow AIW change
  → before/after plus adjacent evals
  → human review
  → private AI-repo release
  → observation and possible revert
```

Create the sanitized failure record manually from `evals/templates/failure-record.md`, or ask a separate agent to draft it with `aiw feedback AIW-<number> --task <task-id> --tool codex|claude`. The feedback command writes only the matching failure record, preserves the project repository, forces `Status: observed`, and leaves privacy approval to a human. It does not automatically inherit a previous chat transcript; the human must explain the correction when approved task context is insufficient.

Before `aiw improve AIW-<number>`, mark all four privacy checks and obtain human `Status: accepted`. The improvement must create/update the matching behavioral case and write `evals/results/AIW-<number>.json` using the format in `evals/results/README.md`. The launcher validates this evidence, verifies that the project worktree did not change, and never performs Git delivery.

Use exact-output matching only for real machine-readable contracts. Evaluate decisions and observable behavior, allowing legitimate stack-specific variation.
