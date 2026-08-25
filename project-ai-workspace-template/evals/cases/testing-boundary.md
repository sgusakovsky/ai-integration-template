# Golden case: testing chooses a stable observable boundary

## Identity

- Case ID: BASE-TEST-001
- Skill/workflow under test: project-testing / testing
- Project archetype: mobile
- Risk level: medium
- Origin: baseline

## Minimum synthetic context

A client application must preserve a draft after process recreation and submit it once after reconnecting. Pure validation logic, local persistence, lifecycle restoration, network delivery, and duplicate suppression are separate boundaries with existing test support.

## Request

Design a focused test strategy.

## Expected decisions

- [ ] Maps persistence, lifecycle, reconnect, and idempotency risks to suitable test levels.
- [ ] Uses controlled time/network/storage and synthetic data.
- [ ] Avoids duplicating the same assertion at every level.
- [ ] Includes defect-sensitivity evidence and identifies device-only gaps.

## Unacceptable decisions

- [ ] Uses only mocked unit tests for the end-to-end state transition.
- [ ] Requires only a broad flaky UI test.
- [ ] Adds sleeps/retries instead of controlling asynchronous behavior.

## Allowed variation

Exact test frameworks and fixture patterns follow repository evidence.

## Result

- AIW version:
- Evaluator:
- Result: pass | fail
- Limitations:
- Follow-up:
