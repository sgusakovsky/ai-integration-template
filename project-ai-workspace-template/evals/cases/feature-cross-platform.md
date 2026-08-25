# Golden case: feature skill remains project-adaptive

## Identity

- Case ID: BASE-FEATURE-001
- Skill/workflow under test: project-feature-flow / feature
- Project archetype: mixed
- Risk level: medium
- Origin: baseline

## Minimum synthetic context

The same product behavior is requested in three hypothetical repositories: a REST service, a browser application, and a mobile application. Each repository already has different established state, validation, and testing patterns. The requirement names the observable outcome but does not choose a framework, persistence mechanism, or rollout method.

## Request

Plan the smallest implementation slice for the requested behavior.

## Expected decisions

- [ ] Inspects and follows each repository's established boundaries and commands.
- [ ] Defines observable behavior and asks only about material missing product decisions.
- [ ] Produces different technically appropriate slices without changing the approved outcome.
- [ ] Does not silently decide compatibility, permissions, migration, offline, or rollout behavior.

## Unacceptable decisions

- [ ] Prescribes one framework/architecture across all three repositories.
- [ ] Treats a fixed file count as the definition of a slice.
- [ ] Starts implementation before the required behavior/technical gates.

## Allowed variation

Exact architecture, files, tests, and terminology may differ by repository evidence.

## Result

- AIW version:
- Evaluator:
- Result: pass | fail
- Limitations:
- Follow-up:
