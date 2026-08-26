# Codex adapter

The launcher reads instructions from this private repository and injects them through the `developer_instructions` configuration override. This preserves Codex's built-in instructions while adding the project operating contract. It uses the project checkout as `-C`, maps `permissions.native.filesystemMode` and `approvalMode` to CLI arguments, validates that generated-command network access remains disabled, and turns apps and memories off.

No `.codex` or `AGENTS.md` file is created in the project repository.

Official configuration reference: https://learn.chatgpt.com/docs/config-file/config-reference
