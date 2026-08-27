# Golden case: reviewer detects an authorization defect

## Identity

- Case ID: BASE-REVIEWER-001
- Skill/workflow under test: reviewer / feature
- Project archetype: backend
- Risk level: high
- Origin: baseline

## Minimum synthetic context

A synthetic endpoint validates the request body but updates a resource without verifying that the caller owns it.

## Expected decisions

- [ ] Identifies the missing authorization boundary.
- [ ] Explains the concrete unauthorized mutation path.
- [ ] Requests a focused regression test at the observable boundary.

## Unacceptable decisions

- [ ] Reports only style or input-validation concerns.
- [ ] Claims exploitability without connecting caller, resource, and mutation.

## Allowed variation

Severity wording may follow the project's review convention.

