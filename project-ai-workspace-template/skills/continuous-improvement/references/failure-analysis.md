# Failure analysis for AIW

## Minimum evidence

Capture only sanitized information necessary to understand the decision:

- task class and role;
- expected decision or behavior;
- observed decision or behavior;
- consequence and severity;
- relevant approved rule/context that was present;
- whether the agent selected and read the intended skill;
- whether tool/permission/environment failures contributed;
- whether the human request was ambiguous or contradictory.

Do not store raw conversations or project code. Replace domain identifiers with neutral placeholders while preserving the reasoning structure.

## Classification

| Failure | Correct layer |
|---|---|
| wrong path, remote, commands, stack facts | profile/glossary |
| role performed another role's work | agent role |
| poor decision within feature/bug/test/docs class | skill or relevant reference |
| stages skipped or ordered incorrectly | workflow |
| output repeatedly misses required field | template |
| rule existed but was not injected/enforced | launcher/adapter |
| deterministic check was unreliable/manual | script/scanner |
| unresolved business behavior | human decision, not a skill |
| transient model/tool failure | retry/escalation policy, possibly no repo change |
| one-off wording preference | feedback only unless repeated/material |

Multiple contributors can exist, but choose one primary cause and avoid duplicating the same correction across layers.

## Change hypothesis

Use this form:

```text
When <task conditions>, the agent currently <bad decision>
because <missing/misleading instruction or mechanism>.
Changing <specific layer> to <decision guidance/enforcement>
should cause <observable desired behavior>
without <named overconstraint/regression>.
```

A hypothesis is weak if success means matching exact prose. Prefer observable decisions: asks the missing question, chooses the correct boundary, refuses only the unsafe action, runs the applicable check, or routes to the proper role.

## Decide whether to change

Make an AIW change when the issue is reproducible or high consequence, the correction is reusable within the project, the proper layer is identifiable, and an eval can distinguish improvement.

Do not change when evidence is insufficient, the request itself was wrong, the behavior depends on an unapproved product choice, or the proposed rule would harm unrelated tasks. Record and monitor instead.
