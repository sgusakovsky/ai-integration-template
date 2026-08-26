# Improvement evidence manifests

Create `<case-id>.json` here during an `aiw improve <case-id>` session. The launcher validates this evidence before it accepts the session result.

```json
{
  "schemaVersion": 1,
  "caseId": "AIW-001",
  "changedLayer": "skills/testing",
  "universalSkillChange": true,
  "projectArchetypes": ["backend", "mobile"],
  "before": {
    "passed": false,
    "summary": "The baseline chose an unverified generic test command."
  },
  "after": {
    "passed": true,
    "summary": "The updated skill uses the configured command policy."
  },
  "adjacentCases": ["testing-boundary"],
  "reviewStatus": "pending-human-review"
}
```

Use only synthetic or sufficiently anonymized summaries. Do not include project source, tickets, prompts, transcripts, personal data, production data, credentials, or unique project identifiers.
