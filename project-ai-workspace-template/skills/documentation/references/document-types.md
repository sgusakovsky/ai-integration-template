# Documentation types

Select only the sections needed for the reader's task.

## Developer onboarding / README

Include prerequisites, supported versions, setup, configuration without secrets, run/test/build commands, expected success, common failures, architecture orientation, and contribution path.

## API / SDK / library

Document stability and version, authentication, inputs, validation/defaults, outputs, errors, side effects, idempotency/pagination/rate limits where applicable, compatibility, and executable examples. Generate from source schema when the project defines that workflow.

## Architecture / ADR

Capture context and constraints, decision, alternatives, consequences, affected boundaries, compatibility/migration, operability, security/data implications, rollback, status, and supersession. Do not convert a proposal into an accepted decision.

## Operations / runbook

State purpose, prerequisites and permissions, safe diagnostics, expected signals, decision points, mitigation/recovery, rollback, verification, escalation, and cleanup. Never place credentials or unsafe production commands in examples.

## Release / migration

Document user/operator impact, prerequisites, compatibility window, order of operations, backup/rollback, validation, irreversible steps, and ownership. Separate confirmed changes from planned work.

## User-facing guide

Organize around user goals and observable outcomes. Include prerequisites, main path, relevant alternatives, errors/recovery, accessibility/localization considerations, and supported platforms without exposing implementation detail unnecessarily.
