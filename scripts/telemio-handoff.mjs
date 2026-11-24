/**
 * Prepare non-secret Telemio enrollment candidates from a verified PR queue.
 * No network calls, claims, credentials, account creation or instrumentation.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export function buildHandoff(queue) {
  if (queue?.schema_version !== 1 || !Array.isArray(queue.records)) throw new Error('Unsupported queue manifest');
  return { schema_version: 1, source_repository: queue.repo, generated_at: new Date().toISOString(),
    purpose: 'owner-consent-and-instrumentation-review',
    candidates: queue.records.filter(r => r.safety === 'pass' && r.telemetry === 'owner-verification-required' && r.report_id)
      .map(r => ({ pull_request:r.number, source_sha:r.head_sha, server_entry:r.entries[0],
        scan_report_id:r.report_id, policy_version:r.policy_version,
        onboarding_status:'pending_verified_owner_consent', telemetry_enabled:false, claim_issued:false })) };
}

export function main(args=process.argv.slice(2)) {
  const [input, output=path.join(os.homedir(),'Downloads','telemio-handoff.json')] = args;
  if (!input) throw new Error('Usage: node scripts/telemio-handoff.mjs queue.json [output.json]');
  const data = JSON.parse(fs.readFileSync(input,'utf8'));
  const handoff=buildHandoff(data);
  fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(handoff,null,2)+'\n',{mode:0o600});
  console.log(`${handoff.candidates.length} verified-scan candidates require separate owner proof and Telemio consent. No telemetry was enabled. Saved ${output}`);
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try { main(); } catch(error) { console.error(error.message); process.exitCode=1; }
}
