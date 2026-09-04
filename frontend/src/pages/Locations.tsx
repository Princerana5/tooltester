import { useEffect, useState, useMemo } from 'react'
import { api } from '../lib/api'
import { LOCATION_FALLBACK } from '../data/locations'
export default function Locations(){
  // Start with static data so the page works even when the API is unreachable (e.g. Vercel frontend-only deploy).
  const [locs,setLocs]=useState<any[]>(LOCATION_FALLBACK)
  const [q,setQ]=useState('')
  useEffect(()=>{api('/api/locations').then(d=>{if(Array.isArray(d)&&d.length) setLocs(d)}).catch(()=>{})},[])
  const filtered=useMemo(()=>{ if(!q) return locs; const s=q.toLowerCase(); return locs.filter((l:any)=>JSON.stringify(l).toLowerCase().includes(s))},[locs,q])
  const grouped=useMemo(()=>{ const m:Record<string,any[]>={}; filtered.forEach((l:any)=>{ const k=l.country||l.countryCode||'Other'; (m[k]=m[k]||[]).push(l)}); return m},[filtered])
  return <div style={{padding:24}}><h2>Locations</h2>
  <input placeholder="Search locations..." value={q} onChange={e=>setQ(e.target.value)} style={{width:'100%',maxWidth:400,padding:'8px 12px',borderRadius:8,border:'1px solid #ddd',marginBottom:16}}/>
  {Object.entries(grouped).map(([country,items])=><div key={country} style={{marginBottom:20}}><h3 style={{borderBottom:'1px solid #eee',paddingBottom:6}}>{country} <span style={{color:'#999',fontWeight:400}}>({items.length})</span></h3>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>{items.map((l:any,i:number)=><div key={l.id||i} style={{border:'1px solid #e5e7eb',borderRadius:12,padding:14,background:'#fff'}}>
    <b>{l.city||l.name||l.label||l.id}</b><div style={{fontSize:12,color:'#666'}}>{l.region||''} {l.timezone||''}</div><div style={{fontSize:11,color:'#999'}}>{l.ip||''} {l.language||''}</div>
  </div>)}</div></div>)}
  {filtered.length===0&&<p style={{color:'#888'}}>No locations</p>}</div>
}
