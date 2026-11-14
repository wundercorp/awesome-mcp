/**
 * Maintainer-only rescue for older PRs which edit the former generated README.
 * Reads exactly one pinned server.json from the GitHub API. Does not execute
 * its contents, modify a contributor branch, commit, push or open a PR.
 * Run from a fresh, clean maintainer worktree based on current main.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { synchronize } from './generate-readme.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entryPattern = /^servers\/([a-z0-9-]+)\/([a-z0-9-]+)\/server\.json$/;

function reject(message) { throw new Error(message); }
function runGit(args) { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }
export function entryFiles(files) {
  if (!Array.isArray(files)) reject('Bad PR file list');
  const selected = files.filter(f => entryPattern.test(f.filename || ''));
  if (selected.length !== 1 || !['added', 'modified'].includes(selected[0].status)) {
    reject('Exactly one added or modified MCP server.json is required');
  }
  return selected[0].filename;
}
function validateJson(filename, bytes) {
  if (bytes.length > 64 * 1024) reject('Entry exceeds 64 KiB');
  const item = JSON.parse(bytes.toString('utf8'));
  const match = entryPattern.exec(filename);
  if (!match || !item || item.category !== match[1] || item.slug !== match[2]) reject('Entry slug/category mismatch');
  if (typeof item.homepage_url !== 'string' || !item.homepage_url.startsWith('https://')) reject('HTTPS homepage_url required');
  const taxonomy = JSON.parse(fs.readFileSync(path.join(root,'config/mcp-taxonomy.json'),'utf8'));
  if (!Object.hasOwn(taxonomy.primary_categories, item.category)) reject('Unknown category; maintainers must categorize first');
  return item;
}
async function api(route, token) {
  const res = await fetch(`https://api.github.com${route}`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) reject(`GitHub API returned HTTP ${res.status}`);
  return res.json();
}
async function paged(route, token) {
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const rows = await api(`${route}?per_page=100&page=${page}`, token);
    if (!Array.isArray(rows)) reject('Invalid GitHub file list');
    all.push(...rows);
    if (rows.length < 100) return all;
  }
  reject('Too many PR files for automatic preparation');
}
export async function prepare(prNumber, opts = {}) {
  const repo = opts.repo || 'wundercorp/awesome-mcp';
  const token = opts.token || process.env.GITHUB_TOKEN;
  if (!/^\w[\w.-]*\/\w[\w.-]*$/.test(repo) || !Number.isSafeInteger(prNumber) || prNumber < 1) reject('Invalid PR target');
  if (!token) reject('GITHUB_TOKEN is required');
  if (opts.write) {
    const branch = runGit(['branch','--show-current']);
    if (!branch || branch === 'main' || branch === 'master') reject('Refusing to change main or detached HEAD');
    if (runGit(['status','--porcelain'])) reject('Worktree must be clean to import legacy metadata');
  }
  const pr = await api(`/repos/${repo}/pulls/${prNumber}`, token);
  if (pr.base?.repo?.full_name !== repo || !pr.head?.sha || !/^[a-f0-9]{40}$/.test(pr.head.sha) ||
      !/^[\w.-]+\/[\w.-]+$/.test(pr.head?.repo?.full_name || '')) reject('Cannot pin PR source');
  const sha = pr.head.sha, headRepo = pr.head.repo.full_name;
  const files = await paged(`/repos/${repo}/pulls/${prNumber}/files`, token);
  const filename = entryFiles(files);
  const file = await api(`/repos/${headRepo}/contents/${filename}?ref=${sha}`, token);
  if (file.encoding !== 'base64' || typeof file.content !== 'string') reject('Pinned entry is not a GitHub file');
  const bytes = Buffer.from(file.content.replace(/\s/g, ''), 'base64');
  validateJson(filename, bytes);
  const still = await api(`/repos/${repo}/pulls/${prNumber}`, token);
  if (still.head?.sha !== sha) reject('PR head changed during preparation; retry with new SHA');
  if (opts.write) {
    const destination = path.join(root, filename);
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    fs.writeFileSync(destination, bytes);
    synchronize(root);
  }
  return { source_pr: prNumber, source_sha: sha, server_json: filename,
    ignored_generated_readme: files.some(f => f.filename === 'README.md'), written: !!opts.write };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let number, write = false;
  for (let i=2; i<process.argv.length; i++) {
    if (process.argv[i] === '--pr') number = Number(process.argv[++i]);
    else if (process.argv[i] === '--write') write = true;
    else { console.error('Usage: node scripts/prepare-legacy-pr.mjs --pr NUMBER [--write]'); process.exit(2); }
  }
  prepare(number,{write}).then(r=>{
    console.log(JSON.stringify(r,null,2));
    if (!write) console.log('Dry run: use --write only in a clean, dedicated maintainer worktree from current main.');
  }).catch(e=>{console.error('Cannot prepare legacy PR:', e.message);process.exitCode=1});
}
