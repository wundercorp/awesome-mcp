# First AgentVM MCP safety pilot

This is a **manual static-analysis pilot**, not a production gateway and not a complete security pass. Never convert a static-only pilot into the five-check `pass` API response: protocol behavior, dependencies, tool permissions and sandbox execution also need evidence.

## Provision a bounded VM or MCP sandbox

On your Mac, follow the **current** AgentVM quickstart at https://agentvm.sh/quickstart. Published commands include:

```bash
npm install -g @wundercorp/agentvm
avm login
avm new
avm launch
avm open
```

`avm new` and `avm launch` require the account to select and approve a provider, size, maximum runtime and charge. Choose the *MCP Sandbox* type where available. Do not authorize a purchase from GitHub Actions or a contributor PR; maintainers must first approve budget and runtime limits. Make sure networking, SSH and filesystem policy restrict the sandbox. Do not install GitHub tokens, Telemio keys, or production credentials inside it.

## Inspect a pinned, public source repository *inside the VM*

Use the owner/repository and exact 40-character SHA obtained from `scripts/pr-shepherd.mjs`. For example, on the sandbox, substitute verified values:

```bash
# Run these commands INSIDE the isolated AgentVM sandbox, not your Mac or GitHub Actions.
REPO_URL='https://github.com/OWNER/REPOSITORY.git'
SOURCE_SHA='0123456789abcdef0123456789abcdef01234567'
mkdir -p "$HOME/mcp-review"
cd "$HOME/mcp-review"
git clone --no-checkout -- "$REPO_URL" source
cd source
git checkout --detach "$SOURCE_SHA"
test "$(git rev-parse HEAD)" = "$SOURCE_SHA" || exit 1
```

Before running tools, review current HOL Guard Plugin Scanner instructions at https://pypi.org/project/hol-guard/; install the separately published `plugin-scanner` package at a reviewed, pinned version into the sandbox, then run its documented `plugin-scanner scan` against the checked-out directory. It can produce JSON and SARIF output. It must not be allowed to run untrusted install hooks or unrestricted server binaries. The scanner output is only the *static* part of the verification. If a project is closed-source, private, or points only to a hosted endpoint, mark the source check *unsupported*, not passed.

For dynamic MCP testing, provide a separate scanner service with strict egress controls, disposable credentials, test fixtures, clear command execution policy, and recording of tool definitions and permissions. Treat any payment or destructive tool as prohibited unless a constrained test harness can prove no real side effects.

## Production gateway handoff

After this pilot, build the authenticated gateway contract in `docs/SAFETY-PIPELINE.md`. It must pin source SHA, provide idempotency per PR/commit, enforce time/cost caps, run the relevant checks with actual provenance, and return a complete pass only if **all five checks** pass. A successful AgentVM provisioning receipt alone cannot satisfy the gateway scan policy.

Once the gateway is live, use `node scripts/pr-shepherd.mjs --scan --limit 3` to dispatch a deliberately small batch or `gh workflow run mcp-safety.yml -f pr_number=207` for a single existing PR. Neither command purchases compute until an independently implemented backend chooses to provision it; configure that backend's budget and authorization accordingly.
