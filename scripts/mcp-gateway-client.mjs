// GitHub-neutral asynchronous gateway client; used by the trusted PR workflow.
// A 202 response is a queued VM job, not a scan verdict.
export async function scanGateway(endpoint, token, request, validate, {
  fetchImpl = fetch, pause = ms=>new Promise(resolve=>setTimeout(resolve,ms)),
  intervalMs=5000,maxWaitMs=28*60*1000,clock=()=>Date.now()
}={}) {
  const url=new URL(endpoint);
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Scanner gateway must use HTTPS');
  if(!token||typeof validate!=='function')throw new Error('Missing gateway authentication or verifier');
  const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
  const res=await fetchImpl(url,{method:'POST',headers,body:JSON.stringify(request),signal:AbortSignal.timeout(25000)});
  if(res.status===200)return validate(await res.json()); // backwards-compatible synchronous gateways
  if(res.status!==202)throw new Error('Scanner did not accept job');
  const queued=await res.json();
  if(!/^scan_[a-f0-9]{24}$/.test(queued.job_id||''))throw new Error('Invalid scanner job reference');
  const jobUrl=new URL(`/jobs/${queued.job_id}`,url);
  const expires=clock()+maxWaitMs;
  while(clock()<expires){
    await pause(intervalMs);
    const reply=await fetchImpl(jobUrl,{method:'GET',headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)});
    if(!reply.ok)throw new Error('Could not retrieve scanner job');
    const job=await reply.json();
    if(job.job_id!==queued.job_id)throw new Error('Scanner job reference changed');
    if(job.status==='completed')return validate(job.result);
    if(job.status==='failed'||job.status==='incomplete')throw new Error('Scanner did not complete safely');
    if(!['queued','running'].includes(job.status))throw new Error('Unexpected scanner job state');
  }
  throw new Error('Scanner job deadline exceeded');
}
