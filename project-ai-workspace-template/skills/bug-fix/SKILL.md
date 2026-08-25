---
name: project-bug-fix
description: Diagnose, correct, and verify a reproducible defect across backend, frontend, mobile, data, or infrastructure code. Use when observed behavior violates an existing expectation; do not use when the request primarily defines a new capability.
---

# Project bug fix

Restore expected behavior with evidence for the failure mechanism and the smallest safe correction.

## Required evidence chain

Keep these claims distinct:

1. expected behavior — supported by requirement, contract, test, prior behavior, or human decision;
2. observed behavior — reproduced or supported by trustworthy diagnostics;
3. root cause — explains why the observation occurs;
4. correction — changes the cause rather than concealing the symptom;
5. regression proof — fails for the defect and passes after the correction;
6. adjacent confidence — relevant nearby behavior remains intact.

If reproduction is impossible, do not present a hypothesis as root cause. State confidence and collect the smallest additional evidence.

## Universal invariants

- Preserve unrelated behavior, compatibility, validation, security controls, and observability.
- Inspect recent/local patterns before patching, but do not assume the nearest code is correct.
- Prefer controlled input and synthetic data. Do not access production or unrelated sensitive logs.
- Do not “fix” by deleting tests, weakening assertions or validation, swallowing exceptions, adding broad retries, increasing timeouts, or disabling warnings without causal evidence.
- Add defensive handling only when the expected contract for that failure is known.
- Stop for human decisions when expected behavior is ambiguous or the correction changes a public contract, schema, dependency, permissions, data handling, or release policy.

## Adapt to the failure

Read [references/diagnosis.md](references/diagnosis.md) when reproduction, localization, causality, concurrency, environment, or intermittent behavior requires investigation.

Read [references/regression-and-scope.md](references/regression-and-scope.md) before choosing the regression test and adjacent checks.

## Completion contract

Report expected/observed behavior, reproduction evidence, root cause with confidence, correction rationale, regression evidence, adjacent checks, changed scope, residual risk, and any unverified environment.

Do not commit, push, merge, deploy, or add AI-operational artifacts to the customer repository.
