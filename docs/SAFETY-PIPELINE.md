# MCP submission safety and telemetry enrollment

This is a **fail-closed integration scaffold**, not an operational AgentVM or Telemio integration until their adapters are implemented, tested, and configured. The repository **does not certify MCP servers as safe**. A passing review means only that an identified scanner policy passed for an identified commit at one point in time.

## Review architecture

1. A PR adds or modifies `servers/<category>/<slug>/server.json` (the catalog's existing one-server-per-PR convention remains).
2. The `pull_request_target` workflow runs **only trusted scripts from the base branch**. It does not check out PR code, install PR dependencies, execute submitted commands, or dereference links on the runner. The workflow obtains candidate metadata from the GitHub API at the PR's exact head SHA.
3. With no `MCP_SAFETY_ENFORCE_AFTER`, existing and new PRs are advisory only. A maintainer can promote a pilot with the `mcp-safety-required` label. Once a verified gateway is operational, set a UTC cutoff; PRs created on or after it become fail-closed, while earlier PRs stay advisory.
4. The workflow validates primary category, metadata, optional capability tags, and risk declarations.
5. An administrator-owned **scanner gateway** receives the entry and pinned SHA, resolves code or endpoints under its own network and execution controls, and orchestrates AgentVM isolation plus security scanners. HOL Guard and TensorBlock should be added only through documented, tested adapters. The gateway must refuse unsupported server types rather than infer that a URL scan is sufficient.
6. Every required scanner check must pass. Absent configuration, unavailable scanners, timeouts, unsupported transports, incomplete result sets, or any mismatch fail the GitHub check. Only an all-pass result causes a public PR comment. No public failure explanation or safety report is created; the GitHub check itself is visibly unsuccessful.
7. Successful evidence includes repository, PR, source commit, entry path, scanner policy, report ID, and check statuses. Scanner retains full evidence privately; the public report omits secrets, raw traces, exploit payloads, and private data.
8. A new PR revision first removes previous bot-authored success reports. After cutover, branch protection should require the `review` job from **MCP submission safety** to prevent bypass by merging a failing PR.

**Do not deploy by simply setting an arbitrary URL.** The gateway is an internal adapter that must be operated by the catalog maintainers and independently authenticated. AgentVM is an isolation environment, not by itself a guarantee that a submitted MCP server is non-malicious. Review sandbox escape, network egress, filesystem mounts, credentials, resource quotas, supply-chain integrity, and tool effects before running foreign code. No third-party server should be executed on the GitHub runner.

## Required gateway adapter

Configure GitHub Actions repository variable `MCP_SAFETY_GATEWAY_URL` (HTTPS) and secret `MCP_SAFETY_GATEWAY_TOKEN` only after deploying the gateway. The request is an authenticated `POST` with the following fields:

```json
{
  "schema_version": 1,
  "repository": "wundercorp/awesome-mcp",
  "pull_request": 123,
  "source_sha": "0123456789abcdef0123456789abcdef01234567",
  "source_path": "servers/security/example/server.json",
  "server": { "slug": "example", "category": "security" },
  "requested_checks": ["static", "dependencies", "sandbox", "mcp-protocol", "tool-permissions"]
}
```

The `server` object is the full submitted metadata. On success, return HTTP 200 with:

```json
{
  "schema_version": 1,
  "source_sha": "0123456789abcdef0123456789abcdef01234567",
  "source_path": "servers/security/example/server.json",
  "policy_version": "mcp-security-v1",
  "verdict": "pass",
  "completed": true,
  "report_id": "scan-01234567",
  "checks": [
    { "name": "static", "status": "pass" },
    { "name": "dependencies", "status": "pass" },
    { "name": "sandbox", "status": "pass" },
    { "name": "mcp-protocol", "status": "pass" },
    { "name": "tool-permissions", "status": "pass" }
  ]
}
```

The gateway MUST guarantee that all required checks actually ran for the exact pinned source, with isolation and bounded egress, and must never return `pass` for a partial assessment. The workflow requires each of the five named checks and each must pass. The gateway must also enforce scanner execution and provenance; never return a fabricated success response. A response schema alone is not a substitute for provenance or attestation. Consider authenticated signing for portable evidence.

## What 'silent on fail' means

No PR comment on failure, no misleading clean badge, no public scan detail. The GitHub check remains red to prevent merging. Maintainers can inspect limited workflow failures; raw sensitive evidence must be retained outside public Actions logs. Never hide a failed required status check.

## Telemio: claimable telemetry, not covert instrumentation

On a passing scan, maintainers may offer a **voluntary** Telemio onboarding link. The scanner cannot inject tracing into a hosted third-party MCP server solely because its catalog metadata exists. To instrument a server, the operator must explicitly opt in and supply a supported deployment/instrumentation mechanism with appropriate credentials and consent. The telemetry adapter should:

- verify opt-in and eligibility for any free tier or claim code; never promise a free plan without a product entitlement;
- use a documented Telemio OpenTelemetry collector/OTLP integration or officially supported SDK/proxy, after verifying endpoint and auth configuration;
- instrument allowed spans for MCP initialize, tools/list, tools/call, response latency, status, and errors;
- **default to metadata-only**, redact inputs/outputs and credentials, disclose retention and region, and allow disabling/exporting tracing;
- create the claim token **only through a verified Telemio API** and send it privately to the owner, not to a public PR thread.

The current patch **does not automatically instrument** servers, issue Telemio accounts or claim codes, or advertise free telemetry as already provisioned. Those require a separately verified API, entitlement policy, and owner consent. Public documentation: https://telemio.sh/mcp-server and https://github.com/wundercorp/telemio-mcp.

## Enablement checklist

1. Implement and audit gateway backends for AgentVM and the chosen scanner products; verify their real interfaces and versions.
2. Complete static, dependency, protocol, tool permission, and sandbox checks in the gateway. Reject unsupported sources, inaccessible repos, unauthenticated endpoints, and unscannable products rather than passing by default.
3. Configure the variable and secret, then run a clean test submission and a deliberately failing test submission.
4. After successful pilot and cutover, require the existing `validate` job and the new `review` job under branch protection. The taxonomy infrastructure workflow is not a required check for server-only PRs because it runs only on infrastructure changes and on main. Confirm fork PRs work without exposing secrets to PR code.
5. Add Telemio instrumentation only after a documented adapter and explicit opt-in flow exist. Keep telemetry credentials out of GitHub comments.

## Threat model and limitations

`pull_request_target` is intentionally used for safe metadata-only orchestration and maintainer-owned secrets. Do not add `checkout: ${{ github.event.pull_request.head.sha }}` or execute PR-supplied scripts to this workflow. Scanner infrastructure must handle attacker-controlled inputs as hostile and enforce SSRF protection, archive decompression limits, signed/immutable artifacts, timeouts, quotas, and outbound network restrictions. Changing the metadata after the reported SHA invalidates the report. Safety checks reduce risk; they do not prove the absence of vulnerabilities or malicious behavior.

## Legacy PR migration and manual dispatch

New behavior is documented in `docs/PR-SHEPHERD.md`. The `workflow_dispatch` input `pr_number` allows a maintainer to recheck existing submissions without updating contributor branches. The actual PR head and author source repository are re-read from GitHub at run time, then files are fetched at the exact SHA; a changed head cannot receive the previous clean result. With no configured gateway, legacy PRs get an advisory, not a successful security verdict. The `--scan` PR-shepherd command is expressly cost-gated and never auto-merges.

TensorBlock's public awesome-mcp-servers repository has PR intake and catalog maintenance workflows; that is useful workflow design reference but is **not** itself a security-scanner API. HOL Guard's separately published plugin-scanner capabilities can be adapted inside the AgentVM sandbox only after verifying supported scans, outputs, and threat model.
