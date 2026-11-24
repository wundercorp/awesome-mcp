# Manual MCP safety scans

Ordinary PR events run metadata checks only and never create a billable VM.
To request a single, potentially billable sandbox scan after the gateway is deployed:

```bash
gh workflow run mcp-safety.yml --repo wundercorp/awesome-mcp -f pr_number=207 -f confirm_paid_scan=true
```

The workflow pins the current PR head, checks that the entry is valid and unique,
and contacts the authenticated scanner gateway. Queue responses (202) are polled
until completion, failure or timeout. A green workflow is not proof of a clean
scan unless a validated report has been produced for the pinned revision.

The gateway must independently enforce request idempotency, per-VM spend
ceilings, concurrent job quotas, time-to-live, and teardown. A manual checkbox
is an approval mechanism, not a billing hard limit.

Do not set `MCP_SAFETY_ENFORCE_AFTER` or require the manual workflow job
as a branch-protection check until PR-head status reporting is implemented and
tested. `workflow_dispatch` runs against the default-branch commit, not the PR
head, so it cannot be treated as an ordinary PR-head required check.

No Telemio instrumentation occurs as part of this scan.
