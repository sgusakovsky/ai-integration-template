# Changelog

## 3.0.0 — 2026-08-27

- delivery scanning covers forbidden and protected paths at every directory depth;
- project checkout must be the root of its Git worktree; `.gitmodules`, gitlinks, and foreign push remotes are blocked;
- implementation roles require resolved project commands;
- `verify --task` and `finish` enforce passing verification evidence;
- MCP cannot approve dependency installation;
- glossary and role output templates are injected into sessions;
- Docker uses one effective filesystem mode and rejects writing roles on read-only mounts;
- AI-workspace `self-scan`, reversible hooks/registration/Desktop installation, and strict project selection are included;
- ten baseline eval cases, CI templates, Docker smoke check, reproducible ZIP packaging, and SHA-256 release checksum are included.

### Migration from 2.x

1. Run `npm test`, `npm run self-test`, and `npm run self-scan` before changing configuration.
2. Ensure `targetRepository.localRelativePath` points to the Git worktree root, not a monorepo package.
3. Resolve commands required by developer, QA, and reviewer roles.
4. Produce all `evidenceRequired` checks before `finish`.
5. Reinstall the managed hook so it receives destination-remote validation.
6. Reinstall the global package and Codex Desktop skill.

