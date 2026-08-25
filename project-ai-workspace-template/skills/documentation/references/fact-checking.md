# Documentation fact-checking

## Claim ledger

For material claims, know the authority and verification status:

| Claim | Preferred evidence |
|---|---|
| command and flags | actual help/script plus safe execution |
| configuration/default | schema/type/parser and test |
| API request/response/error | contract/schema and implementation/contract test |
| supported version/platform | build matrix, release policy, package metadata |
| migration/rollback | approved plan and rehearsed procedure |
| security/permission | enforced policy/config plus responsible owner |
| SLA/compliance/support | approved organizational source only |

If evidence conflicts, describe the conflict to the owner. Do not normalize it away in prose.

## Verify examples

Use synthetic identifiers and data. Run commands at the documented location with documented prerequisites when safe. Check exit status, produced files/state, cleanup, and copy/paste correctness on applicable shells/platforms.

For code examples, prefer a compile/typecheck/test or the project's snippet validation. For links and cross-references, check targets and anchors. For screenshots/UI labels, confirm the supported version and avoid sensitive content.

## Review for delivery

Confirm the document does not mention private AI instructions, expose internal paths, promise unsupported behavior, contradict the implementation, modify generated outputs incorrectly, or leave the reader without recovery steps for a risky operation.
