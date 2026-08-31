import { useEffect, useState } from 'react'
import { api } from '../lib/api'
export default function Settings(){
  const [limits,setLimits]=useState<any>(null)
  const [pw,setPw]=useState({current:'',next:''})
  const [msg,setMsg]=useState('')
  useEffect(()=>{api('/api/settings').then(setLimits).catch(e=>setMsg(e.message))},[])
  const saveLimits=async()=>{ try{ const r=await api('/api/settings',{method:'PUT',body:JSON.stringify(limits)}); setMsg('Saved'); setLimits((p:any)=>({...p,...r})) }catch(e:any){setMsg(e.message)}}
  const changePw=async()=>{ try{ await api('/api/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword:pw.current,newPassword:pw.next})}); setMsg('Password changed')}catch(e:any){setMsg(e.message)}}
  return <div style={{padding:24,maxWidth:600}}><h2>Settings</h2>
  <div style={{border:'1px solid #e5e7eb',borderRadius:12,padding:16,background:'#fff',marginBottom:16}}>
    <h3>Limits</h3>{limits?Object.entries(limits).map(([k,v])=><div key={k} style={{display:'flex',gap:8,marginBottom:8}}><label style={{flex:1}}>{k}</label><input value={String(v)} onChange={e=>setLimits({...limits,[k]:isNaN(Number(e.target.value))?e.target.value:Number(e.target.value)})} style={{flex:1,padding:6,borderRadius:6,border:'1px solid #ddd'}}/></div>):<p>Loading...</p>}
    <button onClick={saveLimits}>Save Limits</button>
  </div>
  <div style={{border:'1px solid #e5e7eb',borderRadius:12,padding:16,background:'#fff'}}>
    <h3>Change Admin Password</h3>
    <input type="password" placeholder="Current password" value={pw.current} onChange={e=>setPw({...pw,current:e.target.value})} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #ddd',marginBottom:8}}/>
    <input type="password" placeholder="New password" value={pw.next} onChange={e=>setPw({...pw,next:e.target.value})} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #ddd',marginBottom:8}}/>
    <button onClick={changePw}>Change Password</button>
  </div>
  {msg&&<p style={{marginTop:12,color:'#333'}}>{msg}</p>}</div>
}
