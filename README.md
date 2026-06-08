# Awesome MCP

A curated, PR-friendly directory maintained by WunderCorp. Entries live as JSON files under `servers/<category>/<slug>/server.json`. The README is generated from those files.

## Contributing

Add one entry per pull request, run the validator, regenerate this README, and keep the entry in the correct category folder.

```bash
node scripts/validate-catalog.mjs
node scripts/generate-readme.mjs
```

## Directory

### Developer Tools

| Name | Description | Transport | Status |
|------|-------------|-----------|--------|
| [TWZRD Agent Intel](https://intel.twzrd.xyz) | Trust scoring for Solana AI agent wallets. Verify agent identity before x402 USDC micropayments. Tools: `score_agent`, `preflight_check` (free), `get_trust_receipt` (HTTP 402 paid). | streamable-http | active |

## Repository format

- `CONTRIBUTING.md` explains the review policy.
- `.github/pull_request_template.md` keeps submissions consistent.
- `.github/workflows/validate.yml` validates JSON and README generation.
- `schema/` documents the expected metadata shape.

## License

Directory metadata is MIT licensed unless an entry says otherwise. Each listed project keeps its own license.
