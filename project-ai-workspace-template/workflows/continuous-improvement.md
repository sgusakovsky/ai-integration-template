# Continuous-improvement workflow

1. Intake a sanitized observation and assign an `AIW-<number>` record ID.
2. Classify severity, reproducibility, and the layer that caused the poor decision.
3. Create a synthetic/anonymized failure record and behavioral golden case.
4. Run or score the case against the current AIW version.
5. State a narrow change hypothesis and name possible adjacent regressions.
6. Modify the smallest correct AIW layer.
7. Validate skill structure and re-run the failing plus adjacent cases.
8. Obtain independent/human review for material changes.
9. Merge through the private AI-repo process and update local CLI/Desktop installations.
10. Observe later use; refine or revert when evidence contradicts the hypothesis.
