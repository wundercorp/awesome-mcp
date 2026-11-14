# Contributing

Thanks for improving this directory.

## Submission model

Submit **one MCP server per pull request**. The source of truth is the JSON entry:

```text
servers/<category>/<slug>/server.json
```

The directory name must match the JSON `category` and `slug` fields. Choose a primary category from `config/mcp-taxonomy.json`. Do not move existing entries solely to change how the directory is displayed.

**Do not edit `README.md` or `categories/*.md` in a new submission.** These pages are generated from `server.json` after merging. The homepage links only to categories; project URLs appear on the relevant category page.

## Validate locally

```bash
node scripts/validate-catalog.mjs
node scripts/validate-taxonomy.mjs
node scripts/generate-readme.mjs
```

Only commit your `server.json` and any separately requested supporting files. The validation workflow checks that the generated pages can be built, without requiring a contributor to commit them.

## Existing pull requests

Older submissions may include edits to the previous giant `README.md`. They are not rejected solely for that historical format, but GitHub may report a merge conflict after this migration. In that case a maintainer can transfer the submitted JSON into a fresh branch based on the current `main` using `node scripts/prepare-legacy-pr.mjs` (see `docs/CATEGORY-MIGRATION.md`). This never executes the submitted MCP or pushes to a contributor's fork.

## Review standards

Entries should be public, useful, documented, and specific enough to assess. Do not submit malware, spyware, credential harvesters, exploit kits, typosquats, or unverifiable placeholders. Listing does not imply security certification.

Maintainers may adjust descriptions and categorization, request operational evidence, remove duplicates, or reject unsuitable submissions. Security scanning is an independent review gate and is not replaced by catalog validation.
