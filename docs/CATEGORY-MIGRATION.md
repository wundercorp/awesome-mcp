# Migrating to category pages

The homepage (`README.md`) is an index with one link per category. Individual MCP listings and external project links live only in `categories/<category>.md`.

## Source-of-truth and migration

The source of truth remains `servers/<category>/<slug>/server.json`. Existing source entries are not moved and their stable paths do not change. `config/mcp-taxonomy.json` defines category IDs and descriptions. The generator rewrites `README.md` plus category pages deterministically; 11 category pages are produced, including empty categories.

```sh
node scripts/validate-catalog.mjs
node scripts/validate-taxonomy.mjs
node scripts/generate-readme.mjs
node scripts/generate-readme.mjs --check
```

After this PR merges, new contributors should submit JSON only. The `Validate catalog` PR workflow intentionally **does not require** generated Markdown updates in a contributor branch. This lets fork PRs submit catalog metadata without writing generated pages or deploying code.

A trusted `Publish MCP category index` workflow runs on source-of-truth merges to `main`. It attempts a normal fast-forward commit of regenerated pages with `contents:write`; **it does not force-push**. If repository branch rules prevent the GitHub Actions bot from pushing to `main`, the workflow fails visibly. A maintainer must then regenerate in a fresh branch and merge that docs PR. Verify that this workflow has permission before promising instantaneous automatic publishing.

## Handling existing PRs that edit the old README

Older open PRs may include `README.md` modifications made by the former generator. After the migration, these commits can conflict with the new index. We do not rewrite contributors' forks or silently merge conflicting markdown. A maintainer can carry forward just the pinned metadata from such a PR:

```sh
# In a fresh maintainer worktree based on the latest origin/main:
export GITHUB_TOKEN="$(gh auth token)"
node scripts/prepare-legacy-pr.mjs --pr 207          # read-only preview
node scripts/prepare-legacy-pr.mjs --pr 207 --write  # writes only JSON and generated pages
unset GITHUB_TOKEN
node scripts/validate-catalog.mjs
node scripts/validate-taxonomy.mjs
node scripts/generate-readme.mjs --check
```

The importer requires a **clean non-main worktree**, exactly one added/modified `server.json`, a stable pinned PR head SHA, and a known category. It does not execute MCP code, modify the original PR, commit, push, or open another PR. Review the imported metadata, commit from the maintainer branch and open a replacement PR citing the original submission and contributor; close the old PR only after the replacement is merged. Fork owners can alternatively update their own branches to remove stale README changes.

## Operational caveats

- Generated pages describe only entries merged into `main`; open PRs are a review queue, not published servers.
- An ordinary contributor PR never needs to write the generated pages, but a main-branch sync job may require GitHub Actions `contents:write` and permission under branch-protection rules.
- A legacy PR with a conflicting README may still need migration. This is not an automatic retroactive rewrite of 100+ forks.
- The directory taxonomy and safety review are independent; listing is not evidence of a real AgentVM scan.
- All commands and generated source files are portable and contain no local-user paths, credentials, or personal identifiers.
