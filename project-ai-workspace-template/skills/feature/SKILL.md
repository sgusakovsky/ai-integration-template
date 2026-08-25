---
name: project-feature-flow
description: Specify, plan, implement, or review a new or changed product capability across backend, frontend, mobile, data, or infrastructure code. Use when observable behavior or a supported contract changes; do not use for defect-only, test-only, or documentation-only work.
---

# Project feature flow

Deliver the smallest approved, testable behavior change that fits the project's existing architecture and delivery process.

## Route the current request

Identify the requested phase before acting:

- discovery/specification — clarify behavior and acceptance;
- technical planning — map impact, risks, rollout, and vertical slices;
- implementation — change one approved slice;
- verification — produce evidence against acceptance criteria;
- review — find discrepancies without silently repairing them.

Do not collapse phases when a human gate separates them. If no phase is stated, inspect the available specification and plan, then perform only the earliest incomplete phase.

## Universal invariants

1. Treat approved requirements, customer code, tests, interfaces, CI, and human decisions as sources of truth. Distinguish facts, assumptions, and proposals.
2. Discover the project's stack and conventions before choosing files, frameworks, state patterns, API shapes, persistence, navigation, build tooling, or test levels.
3. Define behavior in observable terms. Do not silently invent business rules, authorization, migration, compatibility, analytics, rollout, offline, accessibility, localization, or failure semantics.
4. Prefer an existing local pattern when it satisfies the requirement. A new abstraction or dependency needs concrete benefit and the required human gate.
5. Slice vertically around one useful behavior. File count is a warning signal, not a target; split when independent outcomes, contracts, or risks can be verified separately.
6. Preserve compatibility unless the approved specification explicitly changes it. Identify affected consumers and rollback before irreversible work.
7. Verification evidence must name what actually ran and what remains unverified. `aiw verify` checks delivery hygiene, not product correctness.
8. Stop when completion requires an unresolved product, security, data, architecture, migration, dependency, external API, or release decision.

## Adapt to the project

Read [references/project-discovery.md](references/project-discovery.md) before planning or implementation when the stack, architecture, commands, or conventions are not already established in approved context.

Read [references/delivery-and-risk.md](references/delivery-and-risk.md) when designing slices, assessing cross-layer impact, planning rollout, or selecting verification.

## Completion contract

Report:

- approved outcome and completed phase;
- changed behavior and intentionally unchanged behavior;
- files/components affected and why;
- commands/checks executed with results;
- acceptance criteria evidence;
- assumptions, residual risks, and human gates still open.

Do not commit, push, merge, deploy, or add AI-operational artifacts to the customer repository.
