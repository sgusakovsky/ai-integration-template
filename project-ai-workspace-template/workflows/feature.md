# Feature workflow

1. Intake task ID, owner, data lane, desired outcome, and explicit scope.
2. Analyst produces a specification and open questions.
3. Human product/analysis gate approves behavior.
4. Architect produces technical plan, risk assessment, rollback, and vertical tasks.
5. Human technical gate approves significant decisions.
6. QA fixes the independent test oracle.
7. Developer implements one approved slice.
8. Run targeted verification and inspect the diff.
9. Repeat one slice at a time.
10. Reviewer compares specification, plan, diff, tests, and documentation.
11. Human reviewer accepts or requests changes.
12. Run `aiw verify`, then `aiw finish`.
13. Human creates commit, push, pull/merge request, merge, and deployment.
