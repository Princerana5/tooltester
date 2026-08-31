import { useEffect, useState } from 'react'
import { api } from '../lib/api'
export default function Devices(){
  const [devices,setDevices]=useState<any[]>([])
  useEffect(()=>{api('/api/catalog/devices').then(setDevices).catch(()=>{})},[])
  return <div style={{padding:24}}><h2>Devices</h2>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
  {devices.map((d:any)=><div key={d.id} style={{border:'1px solid #e5e7eb',borderRadius:12,padding:16,background:'#fff'}}>
    <b>{d.label||d.name}</b><div style={{fontSize:12,color:'#666'}}>{d.os||d.osName} {d.osVersion||''} • {d.category||d.brand||''}</div>
    {d.userAgent&&<div style={{fontSize:11,color:'#999',marginTop:8,wordBreak:'break-all'}}>{d.userAgent.slice(0,80)}...</div>}
    <div style={{fontSize:11,color:'#888',marginTop:6}}>{d.screen?`${d.screen.width}x${d.screen.height}`:''} {d.browser||''}</div>
  </div>)}
  {devices.length===0&&<p style={{color:'#888'}}>No devices</p>}</div></div>
}
