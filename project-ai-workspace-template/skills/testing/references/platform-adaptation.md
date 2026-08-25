# Platform adaptation for testing

Use repository evidence to select only relevant concerns.

## Backend/service

Test validation, domain rules, authorization, idempotency, transactions, concurrency, pagination, error mapping, retry/timeouts, schema/event compatibility, and dependency failure at appropriate boundaries.

## Web/frontend

Test user-observable states and semantics: loading, empty, success, validation, failure/retry, focus/keyboard, accessibility roles/names, responsive boundaries, routing, caching, hydration, and request races. Prefer role/label/user interactions over fragile DOM structure.

## Mobile/desktop client

Test lifecycle, process recreation, offline/online transitions, storage migration, permissions, background/foreground work, cancellation, deep links, localization, accessibility, device/runtime versions, and platform integration. Separate deterministic logic from emulator/device-only evidence.

## Data/pipelines

Test schema/contract, completeness, uniqueness, ordering, late/duplicate input, idempotency, backfill, partition boundaries, data-quality rules, replay, and partial failure with synthetic datasets.

## Infrastructure/configuration

Test static validation, policy, plan/diff, least privilege, environment parameterization, rollout ordering, health checks, failure/rollback, and drift without touching production.

## Libraries/CLI/tooling

Test public API/CLI contract, exit status, stdout/stderr, filesystem effects, configuration precedence, platform paths, compatibility, and packaging/install behavior.

Across all types, use the project's supported commands and CI topology. Record environment-dependent gaps rather than fabricating success.
