import test from 'node:test';
import assert from 'node:assert/strict';
import {scanGateway} from '../scripts/mcp-gateway-client.mjs';
const job='scan_'+'a'.repeat(24);
const body=x=>({ok:true,status:200,json:async()=>x});
function runWith(responses){
  let index=0;
  const fetchImpl=async()=>responses[index++];
  return scanGateway('https://gateway.example/scan','token',{schema_version:1},x=>{
    if(x?.verdict!=='pass')throw Error('Unverified verdict');
    return x;
  },{fetchImpl,pause:async()=>{},clock:(()=>{let t=0;return()=>++t})(),maxWaitMs:1000});
}
test('async job polling returns only independently validated success',async()=>{
  const out=await runWith([{status:202,json:async()=>({job_id:job})},body({job_id:job,status:'running'}),body({job_id:job,status:'completed',result:{verdict:'pass'}})]);
  assert.equal(out.verdict,'pass');
});
test('incomplete scan never returns success',async()=>{
  await assert.rejects(runWith([{status:202,json:async()=>({job_id:job})},body({job_id:job,status:'completed',result:{verdict:'incomplete'}})]),/Unverified/);
});
test('unknown job identifier is rejected',async()=>{
  await assert.rejects(runWith([{status:202,json:async()=>({job_id:'../../etc/passwd'})}]),/Invalid scanner job/);
});
test('gateway transport requires HTTPS',async()=>{
  await assert.rejects(scanGateway('http://localhost/scan','token',{},x=>x),/HTTPS/);
});
