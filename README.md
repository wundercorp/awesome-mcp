# Awesome MCP

A curated, PR-friendly directory maintained by WunderCorp. Entries live as JSON files under `servers/<category>/<slug>/server.json`. The README is generated from those files.

## Contributing

Add one entry per pull request, run the validator, regenerate this README, and keep the entry in the correct category folder.

```bash
node scripts/validate-catalog.mjs
node scripts/generate-readme.mjs
```

## Directory

### Data

| Server | Description | Transport | Links |
|---|---|---|---|
| AgentServices | 37 MCP tools serving 54 x402-paid crypto/financial market data endpoints on Base — spot prices, OHLCV, on-chain metrics, FX, and bundled research synthesis for AI agents. | streamable-http | [Homepage](https://agentservices.to)<br>[GitHub](https://github.com/vbkotecha/aiservices-api) |
| BuyWhere | Real-time product search and price comparison across 15+ Singapore/SEA merchants (11M+ products). REST API + MCP server for AI agents. | stdio, streamable-http | [Homepage](https://buywhere.ai)<br>[GitHub](https://github.com/BuyWhere/buywhere-mcp)<br>[Package](https://www.npmjs.com/package/@buywhere/mcp-server) |
| The Stall | 191 pay-per-call data tools via x402 on Base — stocks, crypto/DeFi, macro, SEC filings, compliance, global news, social momentum. No API keys. | streamable-http | [Homepage](https://the-stall.intuitek.ai)<br>[GitHub](https://github.com/thebrierfox/the-stall) |
| Xquik MCP Server | MCP server for exploring Xquik's X data API and running source-backed X data workflows. | streamable-http | [Homepage](https://docs.xquik.com/mcp/overview)<br>[GitHub](https://github.com/Xquik-dev/x-twitter-scraper) |

### Knowledge

| Server | Description | Transport | Links |
|---|---|---|---|
| AccInt | Local-first Work Model and MCP server for coding-agent memory across Claude Code, OpenCode, Codex, and Cursor. Shares a SQLite memory substrate and feeds verified outcomes back into future retrieval. | stdio | [Homepage](https://accint.xyz/)<br>[GitHub](https://github.com/maxbaluev/accreted-intelligence) |
| Agentage Memory | Shared memory layer for every AI - one markdown memory Claude, Cursor, and ChatGPT read and write over a remote MCP endpoint, mirrored locally as plain .md you own and can export anytime. Remote Streamable HTTP with OAuth 2.1 + PKCE + DCR. | streamable-http | [Homepage](https://agentage.io)<br>[Package](https://memory.agentage.io/mcp) |
| Most Recommended Books | Read-only Streamable HTTP MCP server for verified book recommendations, reading lists, series reading orders, consensus best-of lists, and summaries with original sources. | streamable-http | [Homepage](https://mostrecommendedbooks.com)<br>[GitHub](https://github.com/richardreeze/mrb-api)<br>[Package](https://mostrecommendedbooks.com/api/mcp) |
| Tubask | Hosted YouTube MCP for Claude, Cursor, and ChatGPT — search videos, summarize talks, and pull timestamped quotes with 3 tools. Streamable HTTP with OAuth 2.0. | streamable-http | [Homepage](https://tubask.app)<br>[GitHub](https://github.com/Amorizz/tubask-mcp)<br>[Package](https://tubask.app/mcp) |

### Observability

| Server | Description | Transport | Links |
|---|---|---|---|
| ax | Local-first transcript and telemetry graph for AI coding agents, with read-only MCP queries for sessions, tool use, skills, costs, and dispatch/routing analytics. | stdio | [Homepage](https://github.com/Necmttn/ax)<br>[GitHub](https://github.com/Necmttn/ax) |

## Repository format

- `CONTRIBUTING.md` explains the review policy.
- `.github/pull_request_template.md` keeps submissions consistent.
- `.github/workflows/validate.yml` validates JSON and README generation.
- `schema/` documents the expected metadata shape.

## License

Directory metadata is MIT licensed unless an entry says otherwise. Each listed project keeps its own license.
