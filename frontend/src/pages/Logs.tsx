import { useEffect, useState } from 'react'
import { api } from '../lib/api'
export default function Logs(){
  const [runs,setRuns]=useState<any[]>([])
  const [runId,setRunId]=useState(new URLSearchParams(location.search).get('run')||'')
  const [clicks,setClicks]=useState<any[]>([])
  const [open,setOpen]=useState<string|null>(null)
  useEffect(()=>{api('/api/runs').then(r=>{setRuns(r); if(!runId&&r[0]) setRunId(r[0].id)}).catch(()=>{})},[])
  useEffect(()=>{ if(runId) api(`/api/runs/${runId}/clicks`).then(setClicks).catch(()=>setClicks([]))},[runId])
  return <div style={{padding:24}}><h2>Logs - Request Inspector</h2>
  <select value={runId} onChange={e=>setRunId(e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:'1px solid #ddd',marginBottom:16}}><option value="">Select run</option>{runs.map((r:any)=><option key={r.id} value={r.id}>{r.id.slice(0,8)} - {r.url}</option>)}</select>
  <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th>#</th><th>Status</th><th>URL</th><th></th></tr></thead>
  <tbody>{clicks.map((c:any,i:number)=><>
    <tr key={c.id||i} style={{borderTop:'1px solid #eee'}}>
      <td>{i+1}</td><td>{c.status||c.statusCode||'-'}</td><td style={{maxWidth:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.url||c.finalUrl||'-'}</td>
      <td><button onClick={()=>setOpen(open===String(i)?null:String(i))}>{open===String(i)?'Collapse':'Expand'}</button></td>
    </tr>
    {open===String(i)&&<tr><td colSpan={4} style={{background:'#f9fafb',padding:16}}>
      <b>Request Headers</b><pre style={{fontSize:12,whiteSpace:'pre-wrap'}}>{JSON.stringify(c.requestHeaders||c.headers||{},null,2)}</pre>
      <b>Test Metadata</b><pre style={{fontSize:12,whiteSpace:'pre-wrap'}}>{JSON.stringify({device:c.device,location:c.location,source:c.source,scenario:c.scenario, ...c},null,2)}</pre>
      <b>Response</b><pre style={{fontSize:12,whiteSpace:'pre-wrap'}}>{JSON.stringify(c.response||c.responseHeaders||c.body||c,null,2).slice(0,3000)}</pre>
    </td></tr>}
  </>)}
  {clicks.length===0&&<tr><td colSpan={4} style={{textAlign:'center',padding:24,color:'#888'}}>No logs</td></tr>}</tbody></table></div>
}
