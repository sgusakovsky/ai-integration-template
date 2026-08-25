# Test design

## Map risk to an observable boundary

Start with consequences: incorrect result, unauthorized action, data loss/exposure, incompatible contract, outage, unusable interface, unrecoverable state, or misleading operations signal.

For each material risk identify:

- precondition and action;
- expected observable result;
- forbidden result;
- stable boundary where it can be observed;
- controlled dependencies and data;
- failure signal that makes diagnosis possible.

## Select the lowest sufficient level

| Level | Use when |
|---|---|
| pure/unit | deterministic rule can be proven without infrastructure |
| component/module | behavior depends on state and local collaborators |
| contract | producer/consumer or schema compatibility is the risk |
| integration | real boundary behavior is essential and controllable |
| UI/device/end-to-end | interaction, lifecycle, rendering, navigation, or packaging is the risk |
| migration/infrastructure | state/config transition, policy, or rollback is the behavior |

Use multiple levels only when they prove different risks. Avoid duplicating the same assertion through every layer.

## Design cases

Partition inputs and states, then select representatives for valid, invalid, absent, minimum/maximum, just-inside/outside boundaries, repeated/duplicate, reordered/concurrent, interrupted/retried, old/new version, permitted/forbidden, and degraded dependency behavior where applicable.

Prefer assertions on outputs, persisted state, emitted contracts, user-visible states, or externally meaningful side effects. Internal collaboration assertions are appropriate only when that collaboration is itself a contract.

## Test doubles and data

Use a real dependency when cheap, deterministic, and isolated. Use a fake for a controlled behavioral substitute, a stub for predefined data, and a mock/spies only when interaction is the required contract. Do not mock the unit's core logic.

Builders and fixtures should make relevant state explicit and irrelevant state defaulted. Keep credentials, production identifiers, personal data, and copied customer datasets out of tests.

## Demonstrate sensitivity

For critical behavior, show the test can fail through a pre-fix run, safe local mutation, changed fixture, counterexample, or equivalent evidence. Revert temporary mutations. If sensitivity cannot be demonstrated, state why and reduce confidence.
