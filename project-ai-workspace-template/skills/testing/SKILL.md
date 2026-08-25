---
name: project-testing
description: Design, implement, execute, or review tests for observable behavior across backend, frontend, mobile, data, or infrastructure projects. Use for test-focused work or an independent test oracle; do not use as a substitute for specifying unknown product behavior.
---

# Project testing

Produce trustworthy evidence about behavior and risk, using the project's real test architecture and controlled data.

## Establish the oracle first

Derive expected behavior from approved requirements, contracts, existing supported behavior, or an explicit human decision. Keep the oracle independent of the implementation being tested. If expected behavior is ambiguous, stop and ask; a test must not silently decide the product contract.

## Universal invariants

1. Select tests by risk and stable observable boundaries, not by framework fashion or raw coverage percentage.
2. Include applicable positive, negative, boundary, authorization, failure, recovery, compatibility, concurrency, lifecycle, accessibility, and regression behavior.
3. Reuse project fixtures/builders and conventions when they preserve isolation and readability.
4. Use synthetic or approved sanitized data. Do not call production services, mutate shared environments, or embed secrets and personal data.
5. Control time, randomness, network, storage, process state, locale, and concurrency when they affect repeatability.
6. Important tests need defect-detection evidence: demonstrate a meaningful failure state, mutation, counterexample, or pre-fix failure where safe.
7. Do not weaken assertions, add arbitrary sleeps/retries, ignore failures, over-mock the behavior under test, or rewrite production logic merely to satisfy a test.
8. Report executed scope, environment, results, flakiness, skipped cases, and residual gaps truthfully.

## Choose the test strategy

Read [references/test-design.md](references/test-design.md) when selecting test boundaries, cases, data, doubles, and defect proof.

Read [references/platform-adaptation.md](references/platform-adaptation.md) when adapting the strategy to service, web, mobile, data, infrastructure, or tooling repositories.

## Completion contract

Report the behavior/risk map, chosen oracle, tests added or reviewed, defect-detection evidence, exact commands and results, isolation/flakiness assessment, and remaining coverage gaps.

`aiw verify` is required for delivery hygiene but does not run the project's test suite. Do not commit, push, merge, deploy, or add AI-operational artifacts to the customer repository.
