# Awesome MCP

A curated, PR-friendly directory maintained by WunderCorp. Entries live as JSON files under `servers/<category>/<slug>/server.json`. The README is generated from those files.

## Contributing

Add one entry per pull request, run the validator, regenerate this README, and keep the entry in the correct category folder.

```bash
node scripts/validate-catalog.mjs
node scripts/generate-readme.mjs
```

## Directory

### Browser Automation

| Server | Description | Transport | Links |
|---|---|---|---|
| agent-qa | Author, run, and triage natural-language web and mobile tests with persistent test memory, self-healing execution, and evidence-backed results. | stdio, streamable-http | [Homepage](https://vostride.com/docs/agent-qa)<br>[GitHub](https://github.com/vostride/agent-qa)<br>[Package](https://www.npmjs.com/package/agent-qa) |

### Communication

| Server | Description | Transport | Links |
|---|---|---|---|
| Taisly Social Media Posting | Publish and schedule short-form videos to TikTok, Instagram Reels, YouTube Shorts, X, and Facebook. | streamable-http, stdio | [Homepage](https://taisly.com/en/ai-agent-kit)<br>[GitHub](https://github.com/taisly/agent)<br>[Package](https://www.npmjs.com/package/@taisly/agent) |

### Data

| Server | Description | Transport | Links |
|---|---|---|---|
| BuyWhere | Real-time product search and price comparison across 15+ Singapore/SEA merchants (11M+ products). REST API + MCP server for AI agents. | stdio, streamable-http | [Homepage](https://buywhere.ai)<br>[GitHub](https://github.com/BuyWhere/buywhere-mcp)<br>[Package](https://www.npmjs.com/package/@buywhere/mcp-server) |
| NotFair | Connect AI clients to Google Ads, Meta Ads, X Ads, Google Search Console, and Google Analytics with OAuth, approval-gated writes, and change history. | streamable-http | [Homepage](https://notfair.co) |
| Parallel Search MCP | Hosted web search and page retrieval for AI agents at https://search.parallel.ai/mcp, with anonymous access available by default. | streamable-http | [Homepage](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| ParlayAPI | Sports odds, player props, public event discovery, and account usage; account data tools require your own API key and allowances. | stdio | [Homepage](https://parlay-api.com)<br>[GitHub](https://github.com/JacobiusMakes/parlay-api-mcp)<br>[Package](https://pypi.org/project/parlayapi-mcp/) |
| Talivia Revenue Analytics | Install and verify revenue-first website analytics, then connect traffic and customer journeys to payment attribution. | streamable-http, stdio | [Homepage](https://talivia.com/ai-agent-kit)<br>[GitHub](https://github.com/talivia-group/agent)<br>[Package](https://www.npmjs.com/package/@talivia/agent) |
| The Stall | 191 pay-per-call data tools via x402 on Base — stocks, crypto/DeFi, macro, SEC filings, compliance, global news, social momentum. No API keys. | streamable-http | [Homepage](https://the-stall.intuitek.ai)<br>[GitHub](https://github.com/thebrierfox/the-stall) |
| Worklittle Jobs | Swipe to apply for jobs in your AI app, and search over 4 million jobs with filters like visa status, distance, and salary, and connect your Worklittle account to save jobs you love. | streamable-http | [Homepage](https://docs.worklittle.com/mcp)<br>[GitHub](https://github.com/worklittle/jobs-mcp)<br>[Package](https://www.npmjs.com/package/worklittle) |
| Xquik MCP Server | MCP server for exploring Xquik's X data API and running source-backed X data workflows. | streamable-http | [Homepage](https://docs.xquik.com/mcp/overview)<br>[GitHub](https://github.com/Xquik-dev/x-twitter-scraper) |

### Design

| Server | Description | Transport | Links |
|---|---|---|---|
| OrkasVideoStudio | Local TypeScript MCP server and CLI for coding-agent-driven video composition, editing, analysis, captions, transcription, and rendering with editable plan.json timelines. | stdio | [Homepage](https://github.com/Orkas-AI/Orkas-VideoStudio)<br>[GitHub](https://github.com/Orkas-AI/Orkas-VideoStudio) |
| UIZZE | Authenticated UI reference MCP for Codex, Claude Code, Cursor, and Copilot. It provides focused UI reference and hosted design-material search grounded in 800,000+ real web and iOS screens; the free anti-ui-slop Skill and GitHub Action are separate. | streamable-http | [Homepage](https://uizze.com)<br>[GitHub](https://github.com/uizze/uizze)<br>[Package](https://uizze.com/mcp) |

### Knowledge

| Server | Description | Transport | Links |
|---|---|---|---|
| AccInt | Local-first Work Model and MCP server for coding-agent memory across Claude Code, OpenCode, Codex, and Cursor. Shares a SQLite memory substrate and feeds verified outcomes back into future retrieval. | stdio | [Homepage](https://accint.xyz/)<br>[GitHub](https://github.com/maxbaluev/accreted-intelligence) |
| Agentage Memory | Shared memory layer for every AI - one markdown memory Claude, Cursor, and ChatGPT read and write over a remote MCP endpoint, mirrored locally as plain .md you own and can export anytime. Remote Streamable HTTP with OAuth 2.1 + PKCE + DCR. | streamable-http | [Homepage](https://agentage.io)<br>[Package](https://memory.agentage.io/mcp) |
| AISO Tools | Read-only Streamable HTTP MCP server over a curated catalog of 1,655 AI tools: keyword/category/pricing search, full tool records with pricing and pros/cons, side-by-side comparison of 2-5 tools, and alternatives lookup. Every result carries a canonical aisotools.com URL for citation. No authentication. | streamable-http | [Homepage](https://aisotools.com/mcp)<br>[Package](https://aisotools.com/api/mcp) |
| Most Recommended Books | Read-only Streamable HTTP MCP server for verified book recommendations, reading lists, series reading orders, consensus best-of lists, and summaries with original sources. | streamable-http | [Homepage](https://mostrecommendedbooks.com)<br>[GitHub](https://github.com/richardreeze/mrb-api)<br>[Package](https://mostrecommendedbooks.com/api/mcp) |
| Tubask | Hosted YouTube MCP for Claude, Cursor, and ChatGPT — search videos, summarize talks, and pull timestamped quotes with 3 tools. Streamable HTTP with OAuth 2.0. | streamable-http | [Homepage](https://tubask.app)<br>[GitHub](https://github.com/Amorizz/tubask-mcp)<br>[Package](https://tubask.app/mcp) |

### Observability

| Server | Description | Transport | Links |
|---|---|---|---|
| ax | Local-first transcript and telemetry graph for AI coding agents, with read-only MCP queries for sessions, tool use, skills, costs, and dispatch/routing analytics. | stdio | [Homepage](https://github.com/Necmttn/ax)<br>[GitHub](https://github.com/Necmttn/ax) |

### Security

| Server | Description | Transport | Links |
|---|---|---|---|
| DomScan | Hosted domain intelligence MCP for availability, DNS, WHOIS/RDAP, TLS, subdomains, reputation, email authentication, valuation, and brand monitoring. | streamable-http, stdio | [Homepage](https://domscan.net/mcp-domain-checker)<br>[GitHub](https://github.com/estevecastells/domscan-mcp)<br>[Package](https://domscan.net/mcp) |
| Palisade DMARC Agent | AI-powered email-authentication management for DMARC, SPF, DKIM, BIMI, MTA-STS, DNS, and remediation tasks. | streamable-http, stdio | [Homepage](https://www.palisade.email/mcp)<br>[GitHub](https://github.com/palisadeemail/palisade-mcp)<br>[Package](https://www.npmjs.com/package/@palisadeemail/mcp) |

## Repository format

- `CONTRIBUTING.md` explains the review policy.
- `.github/pull_request_template.md` keeps submissions consistent.
- `.github/workflows/validate.yml` validates JSON and README generation.
- `schema/` documents the expected metadata shape.

## License

Directory metadata is MIT licensed unless an entry says otherwise. Each listed project keeps its own license.
