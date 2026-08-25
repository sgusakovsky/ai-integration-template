# Defect diagnosis

## Create a minimal reproduction

Record exact input and preconditions, expected and observed output/state, relevant environment/version, reproducibility rate, earliest observable divergence, and evidence source. Reduce the scenario only while preserving the same failure mechanism.

## Localize before editing

1. Confirm input entering the system.
2. Identify the first incorrect state or output.
3. Compare successful and failing paths.
4. Inspect validation, state transitions, lifecycle, persistence, external boundaries, and error propagation.
5. Form a falsifiable hypothesis.
6. Perform the least invasive experiment that can disprove it.

Use logs, debugger, traces, test instrumentation, or controlled probes according to the stack. Remove temporary instrumentation unless it is approved operational observability.

## Evidence-driven dimensions

Consider only dimensions supported by symptoms: boundary values, encoding, locale, timezone, precision, stale/cache state, ordering, concurrency, retries, duplicate delivery, partial failure, cancellation, lifecycle, offline/online, process restart, browser/device/runtime versions, permissions, schema/config skew, exhaustion, timeouts, and rate limits.

## When reproduction is unavailable

Do not make an irreversible speculative patch. Validate diagnostic quality, rank hypotheses by evidence and consequence, add safe observability or a controlled test when approved, define confirming evidence, and stop if production or sensitive-data access would be required.
