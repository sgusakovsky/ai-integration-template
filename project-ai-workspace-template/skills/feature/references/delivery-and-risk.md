# Feature delivery and risk

## Convert intent into an executable contract

An implementable feature contract identifies actor and trigger, observable success, validation and rejection behavior, permissions and data boundaries, relevant failure/cancellation/retry/concurrency behavior, compatibility, migration, measurable acceptance criteria, and explicitly excluded behavior.

Use examples for ambiguous boundaries. Do not turn an example into a universal rule unless approved.

## Build vertical slices

A slice connects enough layers to demonstrate one behavior and leaves the project working. Useful boundaries often follow one user/system scenario, one contract with one consumer, one state transition, one migration step with compatibility protection, or one UI state backed by real domain behavior.

Split a slice when it combines independently releasable behavior, multiple unresolved decisions, unrelated subsystems, or verification that cannot be interpreted as one result.

For each slice state outcome, acceptance criteria, expected components, dependencies, human gates, test oracle, rollout/rollback implications, and definition of done.

## Risk-based depth

Increase planning and independent review for authentication/authorization, money, personal data, destructive actions, public contracts, persistence migrations, concurrency, cryptography, external integrations, infrastructure, and irreversible rollout.

For lower-risk local behavior, avoid speculative frameworks and exhaustive documents. Match evidence to consequence.

## Verification matrix

| Concern | Evidence |
|---|---|
| behavior | focused automated test or reproducible scenario |
| contract | schema/contract/consumer test |
| types/static rules | typecheck, compiler, lint |
| integration | boundary test using controlled dependencies |
| UI/client behavior | component/UI/device test plus targeted manual check |
| compatibility | old/new consumer or migration scenario |
| failure/recovery | forced error, retry, cancellation, rollback scenario |
| operability | logs/metrics/alerts/runbook evidence without sensitive data |
| delivery hygiene | `aiw verify` |

Never describe an unexecuted check as passing. If a check cannot run, give the reason, impact, and next owner.
