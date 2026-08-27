# Deterministic case: launcher rejects a foreign remote

## Identity

- Case ID: BASE-REMOTE-001
- Component under test: launcher target validation
- Project archetype: mixed
- Risk level: high
- Origin: baseline and automated integration test

## Synthetic setup

Configure an exact allowlist for one repository and give the neighboring checkout a different `origin` URL.

## Expected result

- [ ] `doctor`, `verify`, and `start` fail before creating runtime state.
- [ ] The diagnostic names the non-allowlisted origin.
- [ ] SSH and HTTPS spellings normalize consistently without wildcard matching.

## Automated coverage

Covered by `tests/launcher.integration.test.mjs`.

