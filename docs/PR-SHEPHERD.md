# Staged PR shepherding for awesome-mcp

## Scope and non-regression contract

This change installs only new files on an isolated `origin/main` worktree. It does **not** modify existing entry JSON, generated README, original `.github/workflows/validate.yml`, or contributor PR branches. Existing catalog validation remains mandatory. Taxonomy infrastructure tests run for infrastructure changes and main, not for ordinary server-only PRs, so they do not introduce a new required check on existing submissions. Existing open PRs get advisory reviews; no unconfigured scanner is treated as an approval.

GitHub `pull_request_target` runs only the trusted default branch script. It must never check out, install dependencies from, or execute a fork's PR head on a GitHub-hosted runner. MCP source execution belongs exclusively inside a locked-down AgentVM sandbox operated by a verified scanner gateway.

## Stages

| Stage | Scope | Automated operation | Merge requirement |
|---|---|---|---|
| 0. Deploy files | Safety infrastructure PR only | Catalog validation, taxonomy tests, migration policy | Existing repository checks |
| 1. Legacy advisory | PRs created **before** `MCP_SAFETY_ENFORCE_AFTER` | Inventory; optionally scan via gateway; no false success report | Existing repository requirements unchanged |
| 2. Sandbox pilot | Explicitly labeled `mcp-safety-required` PRs | Required pinned-source gateway scan; only all-pass posts report | Require safety check for pilots only after backend verified |
| 3. Enforcement | PRs created on or after a UTC cutoff | Fail-closed checks, clean report on pass, silent public failure | Require `review` check through branch protection |
| 4. Telemetry handoff | Scan-pass candidates who request it | Owner-verified, consent-based Telemio setup | Separate from safety decision |

**Caveat:** In the GitHub UI a successful advisory workflow means the policy script ran, **not** that the MCP server was verified. Read the workflow step summary. Never advertise `safe` for an advisory, skipped, unknown, or unscanned entry. A failed required check stays visible as a red check even though there is no public failure report.

## Run the backlog inventory on the Mac

```bash
cd "$(git rev-parse --show-toplevel)"
export GITHUB_TOKEN="$(gh auth token)"
node scripts/pr-shepherd.mjs --limit 25 --out "$HOME/Downloads/awesome-mcp-pr-queue.json"
node scripts/telemio-handoff.mjs "$HOME/Downloads/awesome-mcp-pr-queue.json" "$HOME/Downloads/telemio-handoff.json"
unset GITHUB_TOKEN
```

This is **read-only** and makes no VM purchases or telemetry changes. It inventories the latest 25 open PRs, reads changed entry files from each PR's pinned SHA, and reports category, transport, undeclared risk capabilities, and scan readiness. Increase the limit up to 250 for additional PRs; the script paginates, so GitHub rate limits may apply. It records no scanner verdict without actual evidence.

## Opt-in AgentVM scan dispatch (after a real gateway is deployed)

A cost-bounded, manual AgentVM provisioning and HOL Guard static scan pilot is described in `docs/AGENTVM-PILOT.md`. It is not a complete scan and cannot produce a full clean verdict.

The `--scan` switch calls an **administrator-managed** gateway, not AgentVM's provisioning API. That gateway is responsible for real AgentVM lifecycle, HOL Guard / relevant scanner commands, sandbox policy, timeouts, per-PR idempotency, cost caps, and returning a verifiable five-check result. A JSON `pass` from an untrusted endpoint is not sufficient evidence.

```bash
cd "$(git rev-parse --show-toplevel)"
export GITHUB_TOKEN="$(gh auth token)"
export MCP_SAFETY_GATEWAY_URL='https://YOUR-VERIFIED-GATEWAY.example/mcp/scan'
# Enter token privately, not in command history or a public PR.
read -r -s -p 'Gateway token: ' MCP_SAFETY_GATEWAY_TOKEN; echo
export MCP_SAFETY_GATEWAY_TOKEN
# Only after gateway spend quotas are confirmed and VM charges are approved:
export MCP_SAFETY_SCANS_APPROVED=1
node scripts/pr-shepherd.mjs --limit 3 --scan --out "$HOME/Downloads/awesome-mcp-pilot-results.json"
unset GITHUB_TOKEN MCP_SAFETY_GATEWAY_TOKEN MCP_SAFETY_SCANS_APPROVED
```

The explicit `--scan` operation is limited to five PRs per invocation and does not write to GitHub. Report IDs are recorded only for validated `pass` results; failures remain `not-verified`. This prevents accidentally charging for the full backlog. A deployment may still need stricter spend controls at the gateway itself.

## GitHub dispatch, review and cutover

After the infrastructure PR lands on `main`, configure the repository variable `MCP_SAFETY_GATEWAY_URL` and secret `MCP_SAFETY_GATEWAY_TOKEN` only for the audited gateway. Then manually test a legacy PR:

```bash
gh workflow run mcp-safety.yml --repo wundercorp/awesome-mcp -f pr_number=207
```

The workflow fetches PR #207's **current** pinned head and can publish a pass-only point-in-time report if the gateway verifies every required check. With no gateway configured, it records `legacy advisory: not scanned` and issues no clean report.

For a pilot requiring enforcement, a maintainer adds label `mcp-safety-required` to a PR, re-runs the workflow, and confirms failed/incomplete scans block that PR's safety job. Do not require the workflow in branch protection until the scanner is proven working. After clean and intentionally failing pilots, set `MCP_SAFETY_ENFORCE_AFTER` to the intended UTC cutoff, such as `2026-11-20T00:00:00Z` (example only; choose the date yourself), and require the `review` job. PRs created before that cutoff remain advisory unless promoted by label.

If a PR is updated during a scan, no success comment is posted for the old SHA. Any previous bot-authored clean report is removed before the re-evaluation. No report is made for failed, unsupported, or incomplete checks.

## Migration review checklist

- Record PR number, pinned SHA, category, transport, source availability, owner information and duplicate detection.
- Distinguish hosted unauthenticated discoverability from full authenticated tool execution. A `401` response is *not* a passed tool test.
- Require real scanner provenance for static, dependencies, sandbox, protocol, and tool-permissions checks; a gateway must fail closed for unsupported transports and closed-source hosted services when it cannot establish the needed evidence.
- Follow up on missing risk declarations and the proposed category. Treat undeclared risk as unknown, not low risk.
- Review validated clean reports and merge through normal repository checks. Never auto-merge from scan status alone.
- Offer optional Telemio tracing only with verified server-owner consent, supported integration and documented handling of telemetry data.
