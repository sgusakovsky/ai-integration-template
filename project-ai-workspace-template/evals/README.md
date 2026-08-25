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
├── failures/       accepted sanitized observations
└── cases/          behavioral regression cases
```

`cases/` ships with cross-archetype baseline cases. Create `failures/` only when the first reviewed sanitized observation is accepted; do not add empty records merely for appearance.

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

Run `aiw improve AIW-<number>` to open a guided native Codex/Claude session in the AI-repo. The command must not modify the project worktree and never performs Git delivery.

Use exact-output matching only for real machine-readable contracts. Evaluate decisions and observable behavior, allowing legitimate stack-specific variation.
