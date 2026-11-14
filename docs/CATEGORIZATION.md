# MCP catalog categorization

Use one **primary category** for discovery and optional **capability tags** for cross-category search. The primary category stays aligned with the existing `servers/<category>/<slug>/server.json` layout. Avoid bulk folder moves, which would generate noisy PRs and break existing references.

| Category | Use for |
| --- | --- |
| browser-automation | browser navigation and browser control |
| code-hosting | source hosts, repositories, issues, and pull requests |
| communication | email, messaging, phone, notifications |
| data | datasets, structured queries, general data sources |
| design | visual, audio, video, and creative production |
| developer-tools | testing, builds, debugging, developer utilities |
| files | filesystem and file-storage operations |
| knowledge | retrieval, memory, documents as knowledge sources |
| observability | logs, metrics, tracing, incident investigation |
| orchestration | multi-tool or multi-agent workflow coordination |
| security | scanning, posture, detection, enforcement |

When a server spans categories, choose the user's **dominant job-to-be-done** for the folder and represent secondary capabilities with tags. For example, a security scanner that exposes trace events stays in `security` with `tracing` and `security-analysis` tags. A tool to query logs during incidents stays in `observability`, even if it can return source links.

Optional metadata fields:

```json
{
  "capability_tags": ["tracing", "monitoring"],
  "risk_capabilities": ["external-network-access"],
  "deployment": "hosted",
  "auth_method": "oauth",
  "telemetry_opt_in": false
}
```

Allowed values are maintained centrally in `config/mcp-taxonomy.json`. Risk capabilities are **disclosures**, not scanner results. `telemetry_opt_in` expresses an owner's desire to be contacted about instrumenting their deployment; it does not itself authorize data collection. Existing entries remain valid without these new fields.
