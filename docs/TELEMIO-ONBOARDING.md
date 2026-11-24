# Telemio opt-in MCP tracing handoff

## What is and is not wired

The PR-shepherd tool records the optional `telemetry_opt_in` field and gates its **local, non-secret handoff** on a validated safety `pass`. `scripts/telemio-handoff.mjs` emits a candidate JSON file for manual onboarding. It does **not** create accounts, promises of a free entitlement, capture customer traffic, install a proxy, contact Telemio, or issue claim tokens.

These steps require first-party Telemio owner verification and documented APIs that are not supplied in the directory repository. A GitHub PR author checking `telemetry_opt_in: true` is merely an expression of interest, not proof of service ownership or consent to collect customer data.

## Proposed integration boundary

1. Confirm the MCP operator controls the server and explicitly authorizes tracing. Confirm the offered free telemetry entitlement, its limits and retention with Telemio.
2. Provide an operator-controlled integration path (OpenTelemetry SDK, collector, or supported HTTP proxy) with documented, live-tested destination and authentication. Do not invent an OTLP URL or use a generic web URL as an ingestion endpoint.
3. Capture minimal MCP events: `initialize`, `tools/list`, `tools/call`, duration, status, transport type, and error class. Tool arguments, results, credentials, prompt text, transcript bodies, customer identifiers and private endpoint URLs must be excluded by default.
4. Document sampling, retention, data residency and an explicit disable/revoke workflow. Prevent secrets from entering GitHub Actions logs and PR comments.
5. After owner verification and consent, ask a verified Telemio API to issue a private, short-lived, single-use claim capability. Publish only a public non-secret enrollment status, never the claim token.

## Candidate schema

```json
{
  "schema_version": 1,
  "purpose": "owner-consent-and-instrumentation-review",
  "candidates": [{
    "pull_request": 207,
    "source_sha": "<verified forty-character SHA>",
    "server_entry": "servers/observability/telemio/server.json",
    "scan_report_id": "<real gateway report ID>",
    "onboarding_status": "pending_verified_owner_consent",
    "telemetry_enabled": false,
    "claim_issued": false
  }]
}
```

This is an illustrative shape, not a claim that PR #207 has passed security scanning. Do not upload this as proof of eligibility without validating its real report ID and owner. Telemio's public MCP integration repository is `https://github.com/wundercorp/telemio-mcp`. The publicly described MCP endpoint is a *query* integration; it is not proof of a private enrollment/provisioning API.
