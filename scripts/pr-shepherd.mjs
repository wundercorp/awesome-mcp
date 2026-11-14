/**
 * Read-only inventory of existing open PRs; optional explicitly approved scan dispatch.
 * Never executes submitted MCP servers locally. Requires Node 22 and GITHUB_TOKEN.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { github, paged, validateEntry, scanEntry, gatewayConfiguration } from './mcp-safety-review.mjs';

export function parseArgs(args) {
  const opts = { limit: 25, scan: false, out: path.join(os.homedir(), 'Downloads', 'awesome-mcp-pr-queue.json') };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scan') opts.scan = true;
    else if (args[i] === '--limit') { opts.limit = Number(args[++i]); }
    else if (args[i] === '--out') { opts.out = args[++i]; }
    else if (args[i] === '--help') opts.help = true;
    else throw new Error(`Unknown option: ${args[i]}`);
  }
  if (!Number.isSafeInteger(opts.limit) || opts.limit < 1 || opts.limit > 250) throw new Error('--limit must be an integer from 1 to 250');
  if (opts.scan && opts.limit > 5) throw new Error('Explicit --scan runs are capped at 5 PRs per invocation');
  return opts;
}

export function summarizeFiles(files) {
  const changes = files.filter(f => /^servers\/[a-z0-9-]+\/[a-z0-9-]+\/server\.json$/.test(f.filename || ''));
  if (changes.length === 0) return { stage:'no-mcp-entry', paths:[] };
  if (changes.some(f => !['added','modified'].includes(f.status)) || changes.length > 1)
    return { stage:'manual-review', paths:changes.map(f => f.filename) };
  return { stage:'metadata-review', paths: changes.map(f => f.filename) };
}

export function telemetryState(server, safety) {
  if (server?.telemetry_opt_in !== true) return 'not-requested';
  if (safety !== 'pass') return 'awaiting-safety-verification';
  return 'owner-verification-required'; // Never issue a claim or deploy instrumentation here.
}

async function getEntry(repo, sha, filename, token) {
  const file = await github(`/repos/${repo}/contents/${filename.split('/').map(encodeURIComponent).join('/')}?ref=${sha}`, token);
  if (file.encoding !== 'base64' || typeof file.content !== 'string') throw new Error('Not a pinned text blob');
  return validateEntry(filename, Buffer.from(file.content.replace(/\s/g,''), 'base64').toString('utf8'));
}

export async function main(env=process.env, args=process.argv.slice(2)) {
  const opts = parseArgs(args);
  if (opts.help) {
    console.log('node scripts/pr-shepherd.mjs [--limit 25] [--out ~/Downloads/awesome-mcp-pr-queue.json] [--scan]');
    return;
  }
  const repo = env.GITHUB_REPOSITORY || 'wundercorp/awesome-mcp';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Invalid GITHUB_REPOSITORY');
  const token = env.GITHUB_TOKEN;
  if (!token) throw new Error('Set GITHUB_TOKEN from `gh auth token` before running');
  let gateway = null;
  if (opts.scan) {
    if (env.MCP_SAFETY_SCANS_APPROVED !== '1') throw new Error('Set MCP_SAFETY_SCANS_APPROVED=1 after approving gateway scan costs/policy');
    gateway = gatewayConfiguration(env);
    if (!gateway) throw new Error('Real scanner gateway URL/token must be configured');
  }

  const all = await paged(`/repos/${repo}/pulls?state=open&sort=updated&direction=desc`, token);
  const queue = [];
  for (const pr of all.filter(p => p.base?.ref === 'main').slice(0,opts.limit)) {
    const record = { number:pr.number, title:pr.title, url:pr.html_url, created_at:pr.created_at,
      updated_at:pr.updated_at, head_sha:pr.head?.sha, head_repo:pr.head?.repo?.full_name,
      stage:'uninspected', entries:[], safety:'not-scanned', telemetry:'not-requested' };
    try {
      const files = await paged(`/repos/${repo}/pulls/${pr.number}/files`,token);
      const state = summarizeFiles(files);
      record.stage = state.stage;
      record.entries = state.paths;
      if (state.stage === 'metadata-review') {
        const server = await getEntry(record.head_repo, record.head_sha, state.paths[0], token);
        record.stage = 'ready-for-sandbox';
        record.category = server.category;
        record.transports = server.transports || [];
        record.deployment = server.deployment || 'unreported';
        record.risk_capabilities = server.risk_capabilities || ['undeclared'];
        record.telemetry = telemetryState(server, record.safety);
        if (opts.scan) {
          const result = await scanEntry(gateway.url, gateway.token, repo, pr.number, record.head_sha,
            { path:state.paths[0], value:server });
          record.safety = 'pass';
          record.report_id = result.report_id;
          record.policy_version = result.policy_version;
          record.stage = 'scan-passed';
          record.telemetry = telemetryState(server,'pass');
        }
      }
    } catch(error) {
      record.stage = opts.scan ? 'scan-not-verified' : 'needs-review';
      record.safety = opts.scan ? 'not-verified' : 'not-scanned';
      // No untrusted upstream text or scanner response bodies in the queue file.
      record.note = 'Manual inspection required; no positive scan evidence';
    }
    queue.push(record);
  }
  fs.mkdirSync(path.dirname(path.resolve(opts.out)),{recursive:true});
  fs.writeFileSync(opts.out, JSON.stringify({ schema_version:1, repo, generated_at:new Date().toISOString(),
    mode:opts.scan?'gateway-scan':'read-only-inventory', total_open_prs:all.length,
    inspected:queue.length, records:queue },null,2)+'\n',{mode:0o600});
  console.log(`Reviewed ${queue.length} of ${all.length} open PRs. Output: ${opts.out}`);
  console.log(`Ready for sandbox: ${queue.filter(r=>r.stage==='ready-for-sandbox').length}; scan passes: ${queue.filter(r=>r.safety==='pass').length}; manual review: ${queue.filter(r=>!['ready-for-sandbox','scan-passed'].includes(r.stage)).length}`);
  if (!opts.scan) console.log('No AgentVM checks were launched and no Telemio services were changed.');
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch(error => { console.error('PR inventory could not complete:', error.message); process.exitCode=1; });
}
