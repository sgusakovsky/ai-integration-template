# Project discovery for feature work

Use this reference when project-specific context is incomplete. Inspect narrowly; do not inventory the entire repository by default.

## Establish the delivery surface

Determine from repository evidence:

1. application type and deployable units;
2. languages, frameworks, package/build systems, and supported versions;
3. component boundaries and dependency direction;
4. public/internal contracts: APIs, events, schemas, navigation, storage, CLI, configuration;
5. state ownership and persistence;
6. authentication, authorization, privacy, and trust boundaries;
7. established unit/integration/contract/UI/device test locations;
8. formatter, lint, typecheck, test, build, packaging, and CI commands;
9. compatibility, feature flag, migration, release, observability, and rollback conventions.

Use documentation and CI as leads, then confirm against actual manifests and nearby implementation. Do not read secret-bearing files.

## Select the closest local precedent

Find one or two implemented behaviors with similar boundaries. Record where input is validated, how domain rules and failure states are represented, how data crosses layers, how dependencies are accessed, how tests observe behavior, and how rollout or migrations are guarded.

Reuse the principle, not accidental complexity. If precedents conflict, surface the conflict rather than blending patterns.

## Platform-neutral questions

Ask only applicable questions.

### Service/backend

- Which callers and contracts change?
- Are operations idempotent and transactionally safe?
- What are timeout, retry, concurrency, rate-limit, and partial-failure semantics?
- Are schema/event changes backward and forward compatible?

### Web/frontend

- Which server/client boundary owns data and state?
- What are loading, empty, error, retry, focus, responsive, and accessibility behaviors?
- Does routing, caching, hydration, analytics, or browser compatibility change?

### Mobile/desktop client

- What happens offline, after process death, and across app versions?
- Are permissions, lifecycle, background work, deep links, accessibility, localization, and device constraints relevant?
- Does the change require migration or store-release coordination?

### Data/infrastructure/tooling

- Is the change reversible and observable?
- Does it affect schema, retention, backfill, capacity, permissions, cost, or failure domains?
- Can rollout be staged without leaving incompatible states?

Produce a concise project map containing only facts needed for the feature. Put reusable, non-confidential conventions in the AI-workspace profile/glossary after human review; do not copy project source into the AI workspace.
