/**
 * Trusted pull_request_target / workflow_dispatch orchestrator.
 * Never checks out or executes PR-supplied code, Node 22+, no external packages.
 * The gateway is a separately operated AgentVM + scanner service; it must
 * verify real scan provenance and bounded costs before returning 'pass'.
 */
import fs from 'node:fs';
import { scanGateway } from './mcp-gateway-client.mjs';

const marker = '<!-- awesome-mcp-safety-report:v1 -->';
const MAX_ENTRY_BYTES = 64 * 1024;
export const REQUIRED_CHECKS = ['static', 'dependencies', 'sandbox', 'mcp-protocol', 'tool-permissions'];
const taxonomy = JSON.parse(fs.readFileSync(new URL('../config/mcp-taxonomy.json', import.meta.url), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function policyMode(createdAt, cutoff, labels = []) {
  if (labels.includes('mcp-safety-required')) return 'enforce';
  if (!cutoff) return 'advisory';
  const a = Date.parse(createdAt);
  const b = Date.parse(cutoff);
  assert(Number.isFinite(a) && Number.isFinite(b) && /Z$/.test(cutoff), 'Invalid safety enforcement cutoff');
  return a >= b ? 'enforce' : 'advisory';
}

export function validateEntry(path, raw) {
  assert(/^servers\/[a-z0-9-]+\/[a-z0-9-]+\/server\.json$/.test(path), 'Unexpected entry path');
  assert(Buffer.byteLength(raw, 'utf8') <= MAX_ENTRY_BYTES, 'Server entry exceeds size limit');
  const item = JSON.parse(raw);
  assert(item && typeof item === 'object' && !Array.isArray(item), 'Entry must be a JSON object');
  const [, category, slug] = path.split('/');
  for (const field of ['slug', 'name', 'category', 'description', 'homepage_url', 'license', 'status']) {
    assert(typeof item[field] === 'string' && item[field].trim(), `Missing required field: ${field}`);
  }
  assert(item.slug === slug && item.category === category, 'Entry path does not match slug/category');
  assert(Object.hasOwn(taxonomy.primary_categories, category), 'Unknown primary category');
  assert(item.description.length <= 1500, 'Description too long');
  for (const field of ['homepage_url', 'repository_url', 'package_url']) {
    if (item[field] === undefined || item[field] === '') continue;
    assert(typeof item[field] === 'string', `${field} must be a URL`);
    const url = new URL(item[field]);
    assert(url.protocol === 'https:' && !url.username && !url.password, `${field} must be public HTTPS without credentials`);
    assert(!/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?)/i.test(url.hostname), `${field} cannot point at local/private addresses`);
  }
  for (const [field, values] of [['capability_tags', taxonomy.capability_tags], ['risk_capabilities', taxonomy.risk_capabilities]]) {
    if (item[field] === undefined) continue;
    assert(Array.isArray(item[field]) && item[field].every(v => typeof v === 'string' && values.includes(v)), `Invalid ${field}`);
    assert(new Set(item[field]).size === item[field].length, `Duplicate ${field}`);
  }
  if (item.deployment !== undefined) assert(taxonomy.deployments.includes(item.deployment), 'Invalid deployment');
  if (item.auth_method !== undefined) assert(taxonomy.auth_methods.includes(item.auth_method), 'Invalid auth_method');
  if (item.telemetry_opt_in !== undefined) assert(typeof item.telemetry_opt_in === 'boolean', 'telemetry_opt_in must be boolean');
  return item;
}

export function validateScannerResult(result, context) {
  assert(result && typeof result === 'object', 'Missing scanner result');
  assert(result.schema_version === 1, 'Unsupported scan result schema');
  assert(result.source_sha === context.sha && result.source_path === context.path, 'Scan evidence does not match pinned source');
  assert(typeof result.policy_version === 'string' && result.policy_version.trim(), 'Missing scan policy');
  assert(result.verdict === 'pass' && result.completed === true, 'Safety review not passed');
  assert(typeof result.report_id === 'string' && /^[A-Za-z0-9._-]{6,128}$/.test(result.report_id), 'Invalid report ID');
  assert(Array.isArray(result.checks), 'Missing scanner checks');
  assert(result.checks.every(c => typeof c.name === 'string' && c.name.length <= 80 && c.status === 'pass'), 'Scanner check failed');
  const names = result.checks.map(c => c.name);
  assert(new Set(names).size === names.length, 'Duplicate scanner check');
  assert(REQUIRED_CHECKS.every(name => names.includes(name)), 'Required scanner check missing');
  return result;
}

function cleanText(value, max = 160) { return String(value).replace(/[\r\n|<>]/g, ' ').slice(0, max); }
function reportComment(items, sha) {
  const lines = [marker, '### MCP safety checks passed', '', `Pinned source commit: \`${sha}\``, '',
    '| Entry | Policy | Report ID |', '| --- | --- | --- |'];
  for (const item of items) lines.push(`| \`${cleanText(item.path, 120)}\` | ${cleanText(item.scan.policy_version, 60)} | \`${cleanText(item.scan.report_id, 128)}\` |`);
  lines.push('', 'All configured required checks returned pass on this exact source revision. This is a point-in-time assessment, not certification or a guarantee of safety.',
    '', 'Telemio instrumentation is optional and requires verified owner consent. No tracing or telemetry account was installed by this check.');
  return lines.join('\n');
}

export async function github(path, token, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28', ...(options.headers || {}) }
  });
  assert(response.ok, `GitHub API request failed (${response.status})`);
  return response.status === 204 ? undefined : response.json();
}
export async function paged(path, token) {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await github(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`, token);
    assert(Array.isArray(batch), 'Unexpected GitHub API response');
    all.push(...batch);
    if (batch.length < 100) return all;
  }
  throw new Error('GitHub pagination limit exceeded');
}
async function clearPriorReport(repo, pr, token) {
  const comments = await paged(`/repos/${repo}/issues/${pr}/comments`, token);
  for (const comment of comments) {
    if (typeof comment.body === 'string' && comment.body.includes(marker) && comment.user?.type === 'Bot') {
      await github(`/repos/${repo}/issues/comments/${comment.id}`, token, { method: 'DELETE' });
    }
  }
}

export async function changedEntries(repo, pr, sha, headRepo, token) {
  assert(/^[\w.-]+\/[\w.-]+$/.test(headRepo), 'Invalid head repository');
  const files = await paged(`/repos/${repo}/pulls/${pr}/files`, token);
  const selected = files.filter(f => /^servers\/[a-z0-9-]+\/[a-z0-9-]+\/server\.json$/.test(f.filename || ''));
  assert(selected.length <= 20, 'Too many server changes');
  const entries = [];
  for (const file of selected) {
    if (file.status === 'removed') { entries.push({ path: file.filename, removed: true }); continue; }
    assert(['added', 'modified'].includes(file.status), 'Renamed/copied entries need manual review');
    const encoded = file.filename.split('/').map(encodeURIComponent).join('/');
    const data = await github(`/repos/${headRepo}/contents/${encoded}?ref=${encodeURIComponent(sha)}`, token);
    assert(data.encoding === 'base64' && typeof data.content === 'string', 'Cannot inspect pinned entry');
    const raw = Buffer.from(data.content.replace(/\s/g, ''), 'base64').toString('utf8');
    entries.push({ path: file.filename, value: validateEntry(file.filename, raw), status: file.status });
  }
  return entries;
}

export async function scanEntry(gateway, token, repo, pr, sha, entry) {
  return scanGateway(gateway.toString(), token, {
    schema_version: 1, repository: repo, pull_request: pr, source_sha: sha,
    source_path: entry.path, server: entry.value, requested_checks: REQUIRED_CHECKS
  }, result => validateScannerResult(result, { sha, path: entry.path }));
}
export function gatewayConfiguration(env) {
  if (!env.MCP_SAFETY_GATEWAY_URL || !env.MCP_SAFETY_GATEWAY_TOKEN) return null;
  const url = new URL(env.MCP_SAFETY_GATEWAY_URL);
  assert(url.protocol === 'https:' && !url.username && !url.password, 'Scanner gateway URL requires HTTPS');
  return { url, token: env.MCP_SAFETY_GATEWAY_TOKEN };
}
function stepSummary(message) {
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}

export async function main(env = process.env) {
  const repo = env.GITHUB_REPOSITORY;
  const pr = Number(env.PR_NUMBER);
  const token = env.GITHUB_TOKEN;
  assert(/^[\w.-]+\/[\w.-]+$/.test(repo || ''), 'Invalid repository name');
  assert(Number.isSafeInteger(pr) && pr > 0, 'Invalid PR');
  assert(token, 'Missing GitHub token');

  const live = await github(`/repos/${repo}/pulls/${pr}`, token);
  assert(live.state === 'open', 'PR is no longer open');
  assert(live.base?.repo?.full_name === repo, 'PR targets a different repository');
  const sha = live.head?.sha;
  const headRepo = live.head?.repo?.full_name;
  assert(/^[a-f0-9]{40}$/.test(sha || ''), 'Missing pinned PR SHA');
  const labels = (live.labels || []).map(label => label.name);
  const mode = policyMode(live.created_at, env.MCP_SAFETY_ENFORCE_AFTER, labels);
  stepSummary(`### MCP review policy: ${mode}\nPR #${pr}, pinned head \`${sha}\`\n`);

  await clearPriorReport(repo, pr, token);
  let entries;
  try { entries = await changedEntries(repo, pr, sha, headRepo, token); }
  catch (error) {
    if (mode === 'enforce') throw error;
    stepSummary('Legacy advisory: entry metadata requires maintainer review; **not verified**.');
    return;
  }
  if (!entries.length) {
    stepSummary('No server.json changes in this PR. No safety verdict issued.');
    return;
  }
  if (entries.some(entry => entry.removed)) {
    if (mode === 'enforce') throw new Error('Removing a server requires manual review');
    stepSummary('Legacy advisory: entry deletion requires maintainer review. No safety verdict.');
    return;
  }
  if (mode === 'enforce') assert(entries.length === 1, 'New submissions must change exactly one server entry');

  // Ordinary PR events validate metadata only; paid jobs require maintainer dispatch.
  const approvedManualScan = env.GITHUB_EVENT_NAME === 'workflow_dispatch' &&
    env.MCP_SAFETY_SCANS_APPROVED === '1';
  if (!approvedManualScan) {
    if (mode === 'enforce') throw new Error('Required paid scan awaits manual approval; no VM launched');
    stepSummary('Automatic metadata review only; **not scanned**. No VM launched or safety verdict issued.');
    return;
  }
  // Bound the spend to one MCP entry even for legacy multi-entry submissions.
  assert(entries.length === 1, 'Manual paid scan requires exactly one MCP entry');

  const gateway = gatewayConfiguration(env);
  if (!gateway) {
    if (mode === 'enforce') throw new Error('Required scanner gateway is not configured');
    stepSummary('Legacy advisory: scanner not connected; **not scanned and not verified**. The existing PR checks remain in place.');
    return;
  }
  const reviews = [];
  try {
    for (const entry of entries) {
      const scan = await scanEntry(gateway.url, gateway.token, repo, pr, sha, entry);
      reviews.push({ path: entry.path, scan });
    }
  } catch (error) {
    if (mode === 'enforce') throw error;
    stepSummary('Legacy advisory: scan failed, was incomplete, or was unavailable; **not verified**. No public report.');
    return;
  }
  // Prevent the old commit's clean report from being attached to a newer revision.
  const latest = await github(`/repos/${repo}/pulls/${pr}`, token);
  assert(latest.head?.sha === sha, 'PR changed during scan; request a new review');
  await github(`/repos/${repo}/issues/${pr}/comments`, token, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: reportComment(reviews, sha) })
  });
  stepSummary(`Scanner returned validated pass for ${reviews.length} pinned entries. See the PR report IDs. This is not a safety certification.`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch(() => {
    // No untrusted payloads, URLs, raw scanner errors, tokens, or secrets in public logs.
    console.error('MCP safety review was not verified. See private scanner evidence.');
    process.exitCode = 1;
  });
}
