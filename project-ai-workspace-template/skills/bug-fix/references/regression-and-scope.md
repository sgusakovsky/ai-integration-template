# Regression proof and patch scope

## Choose the oracle

Place the regression test at the lowest stable boundary that proves externally meaningful behavior:

- pure/unit for isolated deterministic logic;
- component/module for state and collaboration;
- contract/integration for boundary mismatch;
- UI/device/end-to-end when the defect exists only across the full interaction;
- migration/infrastructure validation for state transition or configuration defects.

Avoid internal-call assertions when public behavior is the contract. A high-level test is not better if it is flaky or cannot isolate the cause.

## Prove the regression test

1. Run it against the defective state, or otherwise demonstrate the relevant assertion fails.
2. Apply the correction.
3. Show the same test passes.
4. Run adjacent tests selected from the affected boundary and failure mode.

If the failing state cannot safely be reconstructed, explain substitute evidence and reduced confidence.

## Bound the correction

The smallest safe correction restores the full expected contract, not necessarily the fewest lines. Check sibling consumers, alternate platforms/versions, persisted or cached state, error/retry paths, authorization/data exposure, compatibility, and operational diagnostics.

Do not opportunistically refactor unrelated code. If safe correction requires broader restructuring, separate it and request the appropriate gate.
