import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
const API = (import.meta as any).env.VITE_API_URL || "http://localhost:4000";
type Click = any;
export default function ResultsTable(){
  const { id: runId } = useParams<{id:string}>();
  const [clicks,setClicks]=useState<Click[]>([]);
  const [filters,setFilters]=useState({ device:"", country:"", source:"", status:"" });

  useEffect(()=>{
    fetch(`${API}/api/runs/${runId}/clicks`).then(r=>r.json()).then(d=>setClicks(Array.isArray(d)?d:[])).catch(()=>{});
  },[runId]);

  const filtered = clicks.filter(c=>{
    if(filters.device && c.device!==filters.device) return false;
    if(filters.country && c.country!==filters.country) return false;
    if(filters.source && c.source!==filters.source) return false;
    if(filters.status && c.status!==filters.status) return false;
    return true;
  });

  function verification(c:Click){
    if(c.verification) return c.verification;
    if(c.status==="success") return "PASS";
    if(c.status==="failed") return "FAIL";
    return "WARNING";
  }
  const badge=(v:string)=>{
    const cls=v==="PASS"?"bg-green-100 text-green-700":v==="FAIL"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700";
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{v}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Results {runId}</h1>
      <div className="flex gap-2 flex-wrap">
        <select value={filters.device} onChange={e=>setFilters({...filters,device:e.target.value})} className="border rounded px-2 py-1"><option value="">All devices</option><option>desktop</option><option>mobile</option><option>tablet</option></select>
        <select value={filters.country} onChange={e=>setFilters({...filters,country:e.target.value})} className="border rounded px-2 py-1"><option value="">All countries</option><option>US</option><option>EU</option><option>APAC</option><option>global</option></select>
        <select value={filters.source} onChange={e=>setFilters({...filters,source:e.target.value})} className="border rounded px-2 py-1"><option value="">All sources</option><option>direct</option><option>organic</option><option>paid</option><option>referral</option></select>
        <select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})} className="border rounded px-2 py-1"><option value="">All status</option><option>success</option><option>failed</option><option>pending</option></select>
      </div>
      <div className="overflow-auto bg-white rounded shadow">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">#</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Device</th><th className="px-3 py-2 text-left">Country</th><th className="px-3 py-2 text-left">Source</th><th className="px-3 py-2 text-left">Response</th><th className="px-3 py-2 text-left">Verification</th></tr></thead>
          <tbody className="divide-y">
            {filtered.map((c,i)=><tr key={c.id||i}><td className="px-3 py-2">{i+1}</td><td className="px-3 py-2">{c.status}</td><td className="px-3 py-2">{c.device||"-"}</td><td className="px-3 py-2">{c.country||c.location||"-"}</td><td className="px-3 py-2">{c.source||"-"}</td><td className="px-3 py-2">{c.responseTime!=null?`${c.responseTime}ms`:"-"}</td><td className="px-3 py-2">{badge(verification(c))}</td></tr>)}
            {!filtered.length && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No results</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
