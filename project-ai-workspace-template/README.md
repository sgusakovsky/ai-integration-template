# Project AI Workspace

This private repository contains the AI operating layer for one customer project. It must be cloned next to, never inside, the customer repository.

## Required local layout

```text
workspaces/<project>/
├── client-product/
├── client-product-ai-workspace/
└── .ai-runtime/
```

## Prerequisites

- Git;
- Node.js 20 or newer;
- Codex CLI and/or Claude Code;
- Docker Desktop only when Docker mode is used;
- corporate accounts for the selected AI tool and Git platform.

## First setup

1. Clone this repository as `client-product-ai-workspace`.
2. Clone the customer repository next to it as `client-product`.
3. Edit `project/profile.json`:
   - replace project id;
   - enter the exact customer Git remotes;
   - change the default branch if necessary;
   - choose approved Codex and Claude models or leave model strings empty to use enterprise defaults;
   - fill project commands when the project stack is known.
4. Review `project/permissions.json` and `project/forbidden-artifacts.json`.
5. Run the checks.

For the simplified cross-project command and Desktop integrations, see `DESKTOP-AND-CLI-RU.md`.

To let Codex, Claude Code, or another coding agent configure this template for a concrete neighboring customer checkout, give it `SETUP-PROJECT-WITH-AGENT-RU.md`. The agent must perform its read-only preflight before editing configuration.

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

Docker isolates the agent from the user's home directory. The client checkout is mounted read/write, this AI repository read-only, and the selected session directory read-only for the agent. The host launcher alone creates and removes runtime files. The container still needs outbound access to the selected AI provider. Docker alone is not a domain-level egress allowlist; use an enterprise proxy/firewall when that control is required.

## End a task

```bash
./bin/aiw verify --task PROJECT-123
./bin/aiw finish --task PROJECT-123
```

`finish` does not commit or push customer code. A human reviews the diff and performs Git delivery actions.

## Improve agents and skills

When an agent produces a poor decision, do not patch a skill during the customer task. Create a sanitized AIW record and run a separate improvement session from the registered project:

```bash
aiw improve AIW-001 --tool codex
```

The improvement skill classifies whether the correction belongs in the profile, glossary, role, skill, workflow, template, adapter, launcher, or no repository change. Every material correction needs a synthetic/anonymized behavioral eval, adjacent regression checks, and human review. See `skills/continuous-improvement/SKILL.md` and `evals/README.md`.

This is versioned operational learning, not model training. Customer source, tickets, prompts, transcripts, production data, personal data, and secrets must not become training/eval material.

## Security properties

- no Git submodule or Git link between repositories;
- exact customer remote validation;
- AI instructions loaded externally;
- network tools disabled where the CLI supports it;
- no automatic commit, push, merge, or deployment;
- client diff and commit-message scanning;
- optional local pre-push hook;
- Claude attribution disabled in external settings;
- Docker auth stored in separate named volumes.
- skill references are loaded only for the selected workflow;
- AIW improvement sessions verify that the customer worktree and HEAD remain unchanged.

## Important limits

- A prompt or JSON policy is not an OS sandbox. Native mode relies on the selected CLI's permission system. Docker mode provides stronger host isolation.
- The scanner is a delivery guard, not a substitute for secret scanning, SAST, SCA, tests, or human review.
- The client may contractually require disclosure of AI-assisted development even when no AI artifacts are delivered.
- In native Codex mode, review user-level MCP configuration before the pilot; use enterprise-managed requirements or Docker mode when MCP isolation must be enforced. Claude sessions use an explicit empty MCP configuration and disable client hooks through the external adapter settings.
