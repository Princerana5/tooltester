import { useEffect, useState } from 'react'
import { api } from '../lib/api'
const icons:Record<string,string>={ sms:'💬', whatsapp:'🟢', telegram:'✈️', browser:'🌐' }
export default function Sources(){
  const [sources,setSources]=useState<any[]>([])
  useEffect(()=>{api('/api/catalog/sources').then(setSources).catch(()=>{})},[])
  return <div style={{padding:24}}><h2>Sources</h2>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
  {sources.map((s:any)=><div key={s.id} style={{border:'1px solid #e5e7eb',borderRadius:12,padding:20,background:'#fff',textAlign:'center'}}>
    <div style={{fontSize:32}}>{icons[s.id]||'📦'}</div><b style={{display:'block',marginTop:8,textTransform:'capitalize'}}>{s.label||s.id}</b><div style={{fontSize:12,color:'#666',marginTop:4}}>{s.id}</div>
  </div>)}
  {sources.length===0&&<p style={{color:'#888'}}>No sources</p>}</div></div>
}
