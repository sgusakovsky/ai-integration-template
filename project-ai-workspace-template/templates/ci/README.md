# CI delivery guard templates

These examples create the required sibling layout in CI and run the AI workspace launcher against the project checkout. A project owner must review and add the selected pipeline file because CI configuration is a protected project path.

Before use:

1. Replace `REPLACE_ORG/REPLACE_AI_REPO` with the private AI-workspace repository.
2. Configure a read-only credential for that repository.
3. Keep `project/profile.json` allowlisted for the project repository's real CI remote.
4. Pin checkout actions or images according to company policy.
5. Verify the pipeline with a synthetic forbidden file before making it required.

The CI job runs `npm test`, `self-test`, `self-scan`, and `verify`. It does not launch an AI provider, commit, or push.

