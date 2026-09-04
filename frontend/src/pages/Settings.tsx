import { useEffect, useState } from 'react'
import { api } from '../lib/api'
export default function Settings(){
  const [limits,setLimits]=useState<any>(null)
  const [msg,setMsg]=useState('')
  useEffect(()=>{api('/api/settings').then(setLimits).catch(e=>setMsg(e.message))},[])
  const saveLimits=async()=>{ try{ const r=await api('/api/settings',{method:'PUT',body:JSON.stringify(limits)}); setMsg('Saved'); setLimits((p:any)=>({...p,...r})) }catch(e:any){setMsg(e.message)}}
  return <div style={{padding:24,maxWidth:600}}><h2>Settings</h2>
  <div style={{border:'1px solid #e5e7eb',borderRadius:12,padding:16,background:'#fff',marginBottom:16}}>
    <h3>Limits</h3>{limits?Object.entries(limits).map(([k,v])=><div key={k} style={{display:'flex',gap:8,marginBottom:8}}><label style={{flex:1}}>{k}</label><input value={String(v)} onChange={e=>setLimits({...limits,[k]:isNaN(Number(e.target.value))?e.target.value:Number(e.target.value)})} style={{flex:1,padding:6,borderRadius:6,border:'1px solid #ddd'}}/></div>):<p>Loading...</p>}
    <button onClick={saveLimits}>Save Limits</button>
  </div>
  {msg&&<p style={{marginTop:12,color:'#333'}}>{msg}</p>}</div>
}
