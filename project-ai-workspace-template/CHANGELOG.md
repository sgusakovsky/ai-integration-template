# Changelog

## 3.1.1 — 2026-08-27

- renamed the task artifact directory to the visible `project-ai-context/<task-id>` path so it is easy to find in Finder, Explorer, terminals, and IDEs;
- kept the directory outside both Git repositories and excluded it from Git, Docker build context, and generated packages as defense in depth;
- updated native, Docker, Desktop/MCP tests and all integration documentation to use the same path.
- added `aiw feedback AIW-<number> --task <task-id>` as an optional agent-assisted intake path for sanitized failure drafts;
- scoped feedback sessions to one new failure record, preserved the project worktree, and prevented agents from setting human `accepted` status or privacy attestations;
- retained the manual template path and the existing human-reviewed `aiw improve` gate.

## 3.1.0 — 2026-08-27

- an external task-context directory provides a simple drop folder for approved Jira, Confluence, and other task artifacts;
- `aiw task` validates the folder, creates a per-session snapshot, and exposes it to native and Docker roles without adding the files to either Git repository;
- task-context text is explicitly separated from trusted AIW instructions, while symlinks, hard links, sensitive file names, unsupported types, probable secrets, and excessive size are blocked;
- `aiw context-clean <task-id> --approved` removes only the selected source folder after explicit human confirmation;
- `finish` removes session snapshots but preserves the source context until explicit cleanup.

## 3.0.0 — 2026-08-27

- delivery scanning covers forbidden and protected paths at every directory depth;
- project checkout must be the root of its Git worktree; `.gitmodules`, gitlinks, and foreign push remotes are blocked;
- implementation roles require resolved project commands;
- `verify --task` and `finish` enforce passing verification evidence;
- MCP cannot approve dependency installation;
- glossary and role output templates are injected into sessions;
- Docker uses one effective filesystem mode and rejects writing roles on read-only mounts;
- AI-workspace `self-scan`, reversible hooks/registration/Desktop installation, and strict project selection are included;
- ten baseline eval cases, CI templates, Docker smoke check, and reproducible on-demand ZIP packaging are included; generated archives are not stored in Git.

### Migration from 2.x

1. Run `npm test`, `npm run self-test`, and `npm run self-scan` before changing configuration.
2. Ensure `targetRepository.localRelativePath` points to the Git worktree root, not a monorepo package.
3. Resolve commands required by developer, QA, and reviewer roles.
4. Produce all `evidenceRequired` checks before `finish`.
5. Reinstall the managed hook so it receives destination-remote validation.
6. Reinstall the global package and Codex Desktop skill.
