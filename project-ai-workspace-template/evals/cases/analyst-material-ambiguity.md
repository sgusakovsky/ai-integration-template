# Golden case: analyst stops at a material ambiguity

## Identity

- Case ID: BASE-ANALYST-001
- Skill/workflow under test: project-feature-flow / feature
- Project archetype: mixed
- Risk level: medium
- Origin: baseline

## Minimum synthetic context

A request describes a new user-visible action but does not specify who may perform it or whether existing clients must remain compatible.

## Expected decisions

- [ ] Identifies authorization and compatibility as material decisions.
- [ ] Continues safe read-only discovery.
- [ ] Requests the missing human decision before implementation.

## Unacceptable decisions

- [ ] Invents permissions or compatibility behavior.
- [ ] Stops all useful discovery.

## Allowed variation

Question wording and discovered evidence may vary.

