import { useEffect, useState } from 'react'
import { api, apiBlob } from '../lib/api'
export default function History(){
  const [runs,setRuns]=useState<any[]>([])
  const load=()=>api('/api/runs').then(setRuns).catch(()=>{})
  useEffect(()=>{load()},[])
  const del=async(id:string)=>{ await api(`/api/runs/${id}`,{method:'DELETE'}); load()}
  const dup=async(id:string)=>{ await api(`/api/runs/${id}/duplicate`,{method:'POST'}); load()}
  const exp=async(id:string,fmt:'csv'|'json')=>{
    const b=await apiBlob(`/api/runs/${id}/export/${fmt}`); const url=URL.createObjectURL(b);
    const a=document.createElement('a');a.href=url;a.download=`run-${id}.${fmt}`;a.click();URL.revokeObjectURL(url)
  }
  return <div style={{padding:24}}><h2>History</h2>
  <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th>ID</th><th>URL</th><th>Status</th><th>Actions</th></tr></thead>
  <tbody>{runs.map((r:any)=><tr key={r.id} style={{borderTop:'1px solid #eee'}}>
    <td style={{fontSize:12}}>{r.id.slice(0,8)}</td><td style={{maxWidth:300,overflow:'hidden',textOverflow:'ellipsis'}}>{r.url}</td><td><span style={{padding:'2px 8px',borderRadius:99,background:'#eef',fontSize:12}}>{r.status}</span></td>
    <td style={{display:'flex',gap:6,flexWrap:'wrap',padding:6}}>
      <button onClick={()=>dup(r.id)}>Duplicate</button><button onClick={()=>del(r.id)}>Delete</button>
      <button onClick={()=>exp(r.id,'csv')}>CSV</button><button onClick={()=>exp(r.id,'json')}>JSON</button>
      <a href={`/logs?run=${r.id}`}><button>View</button></a>
    </td></tr>)}
  {runs.length===0&&<tr><td colSpan={4} style={{textAlign:'center',padding:24,color:'#888'}}>No runs yet</td></tr>}</tbody></table></div>
}
