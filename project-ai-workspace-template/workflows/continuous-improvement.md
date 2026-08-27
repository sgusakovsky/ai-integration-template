# Continuous-improvement workflow

1. Intake a sanitized observation manually or through an `aiw feedback` draft and assign an `AIW-<number>` record ID.
2. Require a human to review anonymization, mark all four privacy checks, and set `Status: accepted`; an agent cannot approve intake.
3. Classify severity, reproducibility, and the layer that caused the poor decision.
4. Create a synthetic/anonymized behavioral golden case.
5. Run or score the case against the current AIW version.
6. State a narrow change hypothesis and name possible adjacent regressions.
7. Modify the smallest correct AIW layer.
8. Validate skill structure and re-run the failing plus adjacent cases.
9. Obtain independent/human review for material changes.
10. Merge through the private AI-repo process and update local CLI/Desktop installations.
11. Observe later use; refine or revert when evidence contradicts the hypothesis.
