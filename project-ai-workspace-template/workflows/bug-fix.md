# Bug-fix workflow

1. Record expected and observed behavior.
2. Reproduce the defect in a controlled environment.
3. Add a regression test that fails for the defect.
4. Establish root cause and affected scope.
5. Apply the smallest safe patch.
6. Prove the regression test now passes and run adjacent regression checks.
7. Review for symptom masking, weakened validation, broad exception handling, and scope creep.
8. Run delivery hygiene checks and obtain human approval.
