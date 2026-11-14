import test from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../scripts/mcp-safety-review.mjs';

const sha = 'a'.repeat(40);
const entryPath = 'servers/security/checker/server.json';
const entry = {slug:'checker',name:'Checker',category:'security',description:'Security tools',homepage_url:'https://example.com',license:'MIT',status:'active'};

async function fakeRun({cutoff='', gateway=false, verdict='fail', modified=false}={}) {
  const calls=[];
  const original=globalThis.fetch;
  const gh = 'https://api.github.com';
  globalThis.fetch = async (input, options={}) => {
    const url=String(input); calls.push({url,method:options.method||'GET'});
    let body;
    if (url.startsWith('https://scan.example.com/')) {
      body = verdict==='pass' ? {schema_version:1,source_sha:sha,source_path:entryPath,policy_version:'p1',verdict:'pass',completed:true,report_id:'scan-123456',checks:['static','dependencies','sandbox','mcp-protocol','tool-permissions'].map(name=>({name,status:'pass'}))} : {verdict:'fail'};
      return new Response(JSON.stringify(body),{status:200,headers:{'content-type':'application/json'}});
    }
    assert.ok(url.startsWith(gh), `Unexpected URL ${url}`);
    if (/\/pulls\/7$/.test(url)) body={state:'open',created_at:'2026-11-14T00:00:00Z',base:{repo:{full_name:'wundercorp/awesome-mcp'}},head:{sha,repo:{full_name:'fork/awesome-mcp'}},labels:[]};
    else if (/\/issues\/7\/comments\?/.test(url)) body=[];
    else if (/\/pulls\/7\/files\?/.test(url)) body=[{filename:entryPath,status:'added'}];
    else if (/\/contents\/servers\/security\/checker\/server.json\?/.test(url)) body={encoding:'base64',content:Buffer.from(JSON.stringify(modified?{...entry,category:'bad'}:entry)).toString('base64')};
    else if (/\/issues\/7\/comments$/.test(url) && options.method==='POST') body={id:1};
    else throw new Error(`Unexpected GitHub request: ${url}`);
    return new Response(JSON.stringify(body),{status:200,headers:{'content-type':'application/json'}});
  };
  let err;
  try { await main({GITHUB_REPOSITORY:'wundercorp/awesome-mcp',PR_NUMBER:'7',GITHUB_TOKEN:'fake-test-token',
    MCP_SAFETY_ENFORCE_AFTER:cutoff,MCP_SAFETY_GATEWAY_URL:gateway?'https://scan.example.com/v1':'',
    MCP_SAFETY_GATEWAY_TOKEN:gateway?'fake-gateway-token':''}); }
  catch(e) {err=e;}
  finally {globalThis.fetch=original;}
  return {calls,error:err};
}

test('legacy unconfigured gateway is advisory with no public report',async()=>{
  const r=await fakeRun();
  assert.equal(r.error,undefined);
  assert.equal(r.calls.some(c=>c.method==='POST'),false);
});
test('enforced new PR blocks if gateway is unconfigured',async()=>{
  const r=await fakeRun({cutoff:'2026-11-13T00:00:00Z'});
  assert.match(String(r.error),/gateway is not configured/);
  assert.equal(r.calls.some(c=>c.method==='POST'),false);
});
test('legacy failing scanner cannot publish clean report or block queue',async()=>{
  const r=await fakeRun({gateway:true,verdict:'fail'});
  assert.equal(r.error,undefined);
  assert.equal(r.calls.filter(c=>c.method==='POST'&&c.url.startsWith('https://api.github.com')).length,0);
});
test('enforced failing scanner blocks and never comments',async()=>{
  const r=await fakeRun({cutoff:'2026-11-13T00:00:00Z',gateway:true,verdict:'fail'});
  assert.ok(r.error);
  assert.equal(r.calls.filter(c=>c.method==='POST'&&c.url.startsWith('https://api.github.com')).length,0);
});
test('enforced valid scanner may publish a point-in-time report',async()=>{
  const r=await fakeRun({cutoff:'2026-11-13T00:00:00Z',gateway:true,verdict:'pass'});
  assert.equal(r.error,undefined);
  assert.equal(r.calls.filter(c=>c.method==='POST'&&c.url.startsWith('https://api.github.com')).length,1);
});
test('legacy invalid metadata stays advisory; no positive report',async()=>{
  const r=await fakeRun({modified:true});
  assert.equal(r.error,undefined);
  assert.equal(r.calls.some(c=>c.method==='POST'),false);
});
