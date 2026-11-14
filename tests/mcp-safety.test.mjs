import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, validateScannerResult } from '../scripts/mcp-safety-review.mjs';

const path = 'servers/security/checker/server.json';
const base = {slug:'checker', name:'Checker', category:'security', description:'Checks MCP servers.', homepage_url:'https://example.org', license:'MIT', status:'active'};
const review = { schema_version:1, source_sha:'a'.repeat(40), source_path:path, policy_version:'v1', verdict:'pass', completed:true, report_id:'scan-123456', checks:['static','dependencies','sandbox','mcp-protocol','tool-permissions'].map(name=>({name,status:'pass'})) };
const ctx = {sha:'a'.repeat(40),path};

test('valid minimal entry',()=> assert.equal(validateEntry(path,JSON.stringify(base)).slug,'checker'));
test('valid extra categorization metadata',()=> assert.equal(validateEntry(path,JSON.stringify({...base, capability_tags:['tracing'], risk_capabilities:['external-network-access'], deployment:'hosted', telemetry_opt_in:false})).deployment,'hosted'));
test('reject category/path mismatch',()=> assert.throws(()=>validateEntry(path,JSON.stringify({...base,category:'data'}))));
test('reject invented taxonomy tag',()=> assert.throws(()=>validateEntry(path,JSON.stringify({...base,capability_tags:['magic-security']}))));
test('reject private URL',()=> assert.throws(()=>validateEntry(path,JSON.stringify({...base,homepage_url:'https://127.0.0.1/'}))));
test('reject malformed URL',()=> assert.throws(()=>validateEntry(path,JSON.stringify({...base,homepage_url:'xxx'}))));
test('reject enormous entries',()=> assert.throws(()=>validateEntry(path,JSON.stringify({...base,description:'a'.repeat(70000)}))));
test('accept pinned successful scanner evidence',()=> assert.equal(validateScannerResult(review,ctx).verdict,'pass'));
test('reject incomplete check',()=>assert.throws(()=>validateScannerResult({...review,completed:false},ctx)));
test('reject mismatched commit',()=>assert.throws(()=>validateScannerResult({...review,source_sha:'b'.repeat(40)},ctx)));
test('reject failed scanner',()=>assert.throws(()=>validateScannerResult({...review,verdict:'fail'},ctx)));
test('reject missing checks',()=>assert.throws(()=>validateScannerResult({...review,checks:[]},ctx)));
test('reject missing required check even if others pass',()=>assert.throws(()=>validateScannerResult({...review,checks:[{name:'static',status:'pass'}]},ctx)));
