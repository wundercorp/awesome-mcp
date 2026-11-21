import test from 'node:test';
import assert from 'node:assert/strict';
import {policyMode,validateScannerResult} from '../scripts/mcp-safety-review.mjs';
import {parseArgs,summarizeFiles,telemetryState} from '../scripts/pr-shepherd.mjs';
import {buildHandoff} from '../scripts/telemio-handoff.mjs';

test('cutoff unset means advisory for legacy and new PRs',()=>assert.equal(policyMode('2026-11-15T00:00:00Z',''),'advisory'));
test('older PR remains advisory after cutoff',()=>assert.equal(policyMode('2026-11-12T00:00:00Z','2026-11-16T00:00:00Z'),'advisory'));
test('newer PR is enforce when cutoff enabled',()=>assert.equal(policyMode('2026-11-17T00:00:00Z','2026-11-16T00:00:00Z'),'enforce'));
test('maintainer label can promote legacy PR',()=>assert.equal(policyMode('2026-11-12T00:00:00Z','','mcp-safety-required'.split(',')),'enforce'));
test('invalid rollout cutoff fails closed',()=>assert.throws(()=>policyMode('2026-11-12T00:00:00Z','yesterday')));
test('single entry can queue',()=>assert.equal(summarizeFiles([{filename:'servers/data/new/server.json',status:'added'}]).stage,'metadata-review'));
test('multiple entries require human review',()=>assert.equal(summarizeFiles([{filename:'servers/data/a/server.json',status:'added'},{filename:'servers/data/b/server.json',status:'added'}]).stage,'manual-review'));
test('entry removal requires human review',()=>assert.equal(summarizeFiles([{filename:'servers/data/a/server.json',status:'removed'}]).stage,'manual-review'));
test('scan option limits maximum PRs per batch',()=>assert.throws(()=>parseArgs(['--scan','--limit','25'])));
test('telemetry opt-in requires scan pass and owner proof',()=>{
  assert.equal(telemetryState({telemetry_opt_in:true},'not-scanned'),'awaiting-safety-verification');
  assert.equal(telemetryState({telemetry_opt_in:true},'pass'),'owner-verification-required');
  assert.equal(telemetryState({telemetry_opt_in:false},'pass'),'not-requested');
});
test('handoff never enables tracing or issues claim',()=>{
 const h=buildHandoff({schema_version:1,repo:'wundercorp/awesome-mcp',records:[
  {number:1,safety:'pass',telemetry:'owner-verification-required',report_id:'scan-abc123',entries:['servers/a/b/server.json'],head_sha:'a'.repeat(40)},
  {number:2,safety:'not-scanned',telemetry:'owner-verification-required',report_id:'scan-def456',entries:['servers/a/c/server.json'],head_sha:'b'.repeat(40)}
 ]});
 assert.equal(h.candidates.length,1);
 assert.equal(h.candidates[0].claim_issued,false);
 assert.equal(h.candidates[0].telemetry_enabled,false);
});
test('scanner rejects duplicate check names',()=>{
 const checks=['static','dependencies','sandbox','mcp-protocol','tool-permissions','static'].map(name=>({name,status:'pass'}));
 assert.throws(()=>validateScannerResult({schema_version:1,source_sha:'a'.repeat(40),source_path:'servers/a/b/server.json',policy_version:'v1',verdict:'pass',completed:true,report_id:'scan-abc123',checks},{sha:'a'.repeat(40),path:'servers/a/b/server.json'}));
});
