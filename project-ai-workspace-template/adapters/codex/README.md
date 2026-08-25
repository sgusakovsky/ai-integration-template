# Codex adapter

The launcher reads instructions from this private repository and injects them through the `developer_instructions` configuration override. This preserves Codex's built-in instructions while adding the project operating contract. It uses the customer checkout as `-C`, selects `workspace-write`, keeps command network access disabled, turns apps and memories off, and keeps approval policy `on-request`.

No `.codex` or `AGENTS.md` file is created in the customer repository.

Official configuration reference: https://learn.chatgpt.com/docs/config-file/config-reference
