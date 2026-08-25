---
name: project-documentation
description: Create, update, or review project-facing developer, API, architecture, operational, release, or user documentation from verified project behavior. Use when documentation is the primary deliverable; do not invent undocumented product or compliance commitments.
---

# Project documentation

Produce documentation that remains correct and useful without access to AI prompts, transcripts, or the private AI workspace.

## Establish document intent

Identify audience, task the reader must complete, document type, approved location, ownership, and supported versions. Update the smallest coherent documentation surface; do not rewrite unrelated material for style.

## Evidence hierarchy

Use, in order appropriate to the claim:

- approved requirements and human decisions;
- public interfaces, schemas, configuration definitions, and types;
- implemented behavior and tests;
- verified build/CI/operational procedures;
- current architecture decisions and release policy.

Resolve conflicts rather than choosing silently. Code is not authority for product intent when it contradicts an approved contract.

## Universal invariants

1. Do not invent parameters, defaults, compatibility, SLA/SLO, performance, security, privacy, compliance, licensing, support, migration, rollback, or production-access claims.
2. Execute commands and examples where practical in a safe environment. Mark illustrative or unverified material explicitly.
3. Preserve project terminology, information architecture, style, links, versioning, and generated-doc boundaries.
4. Explain prerequisites, success, failure, recovery, and safety where readers need them.
5. Avoid client secrets, production identifiers, personal data, internal AI process, and confidential ticket text.
6. Do not edit generated documentation directly when an authoritative source/generator exists.
7. Documentation describing changed behavior is complete only after that behavior is implemented and verified, unless clearly labeled as a proposal.

## Adapt the deliverable

Read [references/document-types.md](references/document-types.md) to select content and verification for the document type.

Read [references/fact-checking.md](references/fact-checking.md) before finalizing examples, operational/security claims, cross-links, or version-specific instructions.

## Completion contract

Report audience, changed documents, authoritative sources used, commands/examples verified, intentionally unverified claims, version scope, and remaining owner decisions.

Do not add AI attribution, prompts, or AI-workspace references to project deliverables unless the project explicitly requires disclosure in that artifact.
