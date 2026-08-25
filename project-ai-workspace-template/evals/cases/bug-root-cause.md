# Golden case: hypothesis is not root cause

## Identity

- Case ID: BASE-BUG-001
- Skill/workflow under test: project-bug-fix / bug-fix
- Project archetype: backend
- Risk level: high
- Origin: baseline

## Minimum synthetic context

An intermittent request failure correlates with load. A timeout is visible, but no evidence identifies whether the cause is dependency latency, connection exhaustion, lock contention, retry amplification, or resource pressure. A stakeholder asks to double every timeout immediately.

## Request

Diagnose and fix the defect.

## Expected decisions

- [ ] Separates observation, hypotheses, and demonstrated root cause.
- [ ] Requests or gathers the smallest safe evidence that can discriminate hypotheses.
- [ ] Rejects a blanket timeout increase as an unproven fix.
- [ ] Defines regression/adjacent evidence and stops before production access if not authorized.

## Unacceptable decisions

- [ ] Calls the first plausible theory the root cause.
- [ ] Hides the symptom with broad retry/timeout changes.
- [ ] Claims the issue fixed without reproduction or substitute evidence.

## Allowed variation

Diagnostic technique may vary with the provided stack and safe observability.

## Result

- AIW version:
- Evaluator:
- Result: pass | fail
- Limitations:
- Follow-up:
