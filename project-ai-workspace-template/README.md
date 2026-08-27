# Project AI Workspace

Starter Kit version: **3.1.1**. The untouched template is intentionally non-operational but fully testable: `npm test`, `npm run self-test`, and `npm run self-scan` pass, while `doctor`, `start`, `verify`, and other project-bound commands fail closed until placeholders are replaced.

Release changes and migration notes are in `CHANGELOG.md`; incident containment and rollback are in `INCIDENT-RESPONSE-RU.md`.

This private repository contains the AI operating layer for one project. It must be cloned next to, never inside, the project repository.

## Required local layout

```text
workspaces/<project>/
├── project-repository/
├── project-ai-workspace/
├── project-ai-context/             # optional human-provided task artifacts
└── .ai-runtime/                    # launcher-managed session data
```

## Prerequisites

- Git;
- Node.js 20 or newer;
- Codex CLI and/or Claude Code;
- Docker Desktop only when Docker mode is used;
- corporate accounts for the selected AI tool and Git platform.

## First setup

1. Clone this repository as `project-ai-workspace`.
2. Clone the project repository next to it as `project-repository`.
3. Edit `project/profile.json`:
   - replace project id;
   - enter the exact project Git remotes;
   - change the default branch if necessary;
   - choose approved Codex and Claude models or leave model strings empty to use enterprise defaults;
   - configure every project command as `agent`, `manual`, `forbidden`, or `unresolved`.
4. Read `project/README.md`, then review all four JSON files in `project/`. The reference explains every key, supported values, exact JSON examples, and its runtime effect. Configuration is strict: unknown or unused keys fail validation.
5. Run the checks.

The supported target is the root of one Git worktree. Pointing `localRelativePath` at a monorepo package or any other subdirectory is rejected so that delivery scanning cannot silently lose repository-wide coverage.

For the simplified cross-project command and Desktop integrations, see `DESKTOP-AND-CLI-RU.md`.

For Jira, Confluence, and local task artifacts, see `TASK-CONTEXT-RU.md`. Put approved files in the visible sibling `project-ai-context/PROJECT-123/` directory; `aiw task PROJECT-123 --role analyst` discovers and snapshots them automatically.

To let Codex, Claude Code, or another coding agent configure this template for a concrete neighboring project checkout, give it `SETUP-PROJECT-WITH-AGENT-RU.md`. The agent must perform its read-only preflight before editing configuration.

macOS:

```bash
chmod +x bin/aiw
./bin/aiw doctor --tool codex --mode native
./bin/aiw self-test
./bin/aiw install-hooks
```

Windows PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\bin\aiw.ps1 doctor --tool codex --mode native
.\bin\aiw.ps1 self-test
.\bin\aiw.ps1 install-hooks
```

## Start a native session

Optional task context can be prepared before the session without adding anything to Git:

```bash
mkdir -p ../project-ai-context/PROJECT-123
# Copy approved Jira, Confluence, and other task files into that directory.
```

Codex:

```bash
./bin/aiw start --tool codex --role analyst --workflow feature --task PROJECT-123
```

Claude Code:

```bash
./bin/aiw start --tool claude --role analyst --workflow feature --task PROJECT-123
```

On Windows replace `./bin/aiw` with `.\bin\aiw.ps1`.

## Start in Docker

Build the image once:

```bash
./bin/aiw docker-build
```

Authenticate each tool once in its isolated Docker volume:

```bash
./bin/aiw docker-login --tool codex
./bin/aiw docker-login --tool claude
```

Start a session:

```bash
./bin/aiw start --mode docker --tool codex --role developer --workflow feature --task PROJECT-123
```

Docker isolates the agent from the user's home directory. The project checkout is mounted read/write, this AI repository read-only, and the selected session directory read-only for the agent. The host launcher alone creates and removes runtime files. The container still needs outbound access to the selected AI provider. Docker alone is not a domain-level egress allowlist; use an enterprise proxy/firewall when that control is required.

## End a task

Run project checks through the configured command contract. `aiw` executes only entries with `mode: "agent"`; manual operations remain human-owned:

```bash
aiw check lint --task PROJECT-123
aiw check testTargeted --target path/to/test --task PROJECT-123
aiw check build --task PROJECT-123
aiw evidence build --task PROJECT-123 --status passed --note "Approved manual build passed"
```

`manual` returns exit code 3 with instructions, while `forbidden` and `unresolved` return exit code 2. Commands are executable-plus-arguments records and never pass through a shell.

```bash
./bin/aiw verify --task PROJECT-123
./bin/aiw finish --task PROJECT-123
```

`verify --task` and `finish` require a passing evidence record for every configured `agent` or `manual` command with `evidenceRequired: true`. `finish` copies only sanitized evidence and task-context metadata into the session summary and removes runtime snapshots and evidence. It preserves the human-provided `project-ai-context/PROJECT-123` source folder; remove that exact folder explicitly with `aiw context-clean PROJECT-123 --approved` after retaining any approved deliverables. It does not commit or push project code.

## Improve agents and skills

When an agent produces a poor decision, do not patch a skill during the project task. First create `evals/failures/AIW-001.md`, mark all four privacy checks, and have a human set `Status: accepted`; then run a separate improvement session from the registered project:

```bash
aiw improve AIW-001 --tool codex
```

The improvement skill classifies whether the correction belongs in the profile, glossary, role, skill, workflow, template, adapter, launcher, or no repository change. Every material correction needs a matching behavioral case and validated `evals/results/AIW-001.json` with before/after, adjacent regression evidence, archetype coverage when universal, and `pending-human-review`. See `skills/continuous-improvement/SKILL.md` and `evals/README.md`.

This is versioned operational learning, not model training. Project source, tickets, prompts, transcripts, production data, personal data, and secrets must not become training/eval material.

## Security properties

- no Git submodule or Git link between repositories;
- exact project remote validation;
- strict validation of every supported JSON key; unknown keys fail closed;
- validation of the security-critical Claude adapter settings during `self-test`;
- AI instructions loaded externally;
- network tools disabled where the CLI supports it;
- no automatic commit, push, merge, or deployment;
- project path, diff, commit-message, and new untracked text scanning;
- configured protected paths cannot be bypassed by artifact allow rules;
- project commands are executable only through their configured mode;
- optional local pre-push hook;
- push destination remote validation in the managed hook;
- bidirectional hygiene checks: project delivery scan plus AI-workspace eval/decision self-scan;
- Claude attribution disabled in external settings;
- Docker auth stored in separate named volumes.
- skill references are loaded only for the selected workflow;
- AIW improvement sessions verify that the project worktree and HEAD remain unchanged.
- AIW improvement sessions require a sanitized failure record, behavioral eval, adjacent regression evidence, and pending human review.

## Important limits

- A prompt or JSON policy is not an OS sandbox. Native mode relies on the selected CLI's permission system. Docker mode provides stronger host isolation.
- The scanner is a delivery guard, not a substitute for secret scanning, SAST, SCA, tests, or human review.
- The project contract may require disclosure of AI-assisted development even when no AI artifacts are delivered.
- In native Codex mode, user-level skills, plugins, and MCP configuration remain available to the CLI. Review that context before a pilot; use enterprise-managed requirements or Docker mode when stronger isolation is required. Claude sessions use an explicit empty MCP configuration and disable project-local hooks through the external adapter settings.

## Distribution and CI

The directory is the source of truth. A derived ZIP is not stored in Git; maintainers build it on demand with `npm run package`. The command compares every archived file, runs the complete pristine-template test suite, runs `self-test`, and repeats configuration tests after replacing template values in the extracted copy. Project owners can adapt reviewed CI examples from `templates/ci/`; AI agents may not bypass protected CI paths to install them.

Run a real container check on a Docker-capable host with `npm run docker-smoke` before publishing or piloting a release.

## Offboarding

Use `aiw uninstall-hooks`, `aiw desktop-uninstall codex --project <id>`, and `aiw unregister <id>` before deleting or moving a workspace. These commands remove only artifacts carrying AIW managed markers and refuse to delete user-owned hooks or skills.
