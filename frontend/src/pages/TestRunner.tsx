import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { createLocalRun } from "../lib/localRuns";
import { DEVICE_FALLBACK } from "../data/devices";
import { LOCATION_FALLBACK } from "../data/locations";

const CLICK_OPTIONS = [1, 10, 50, 100, 500] as const;
const SPEED_OPTS = ["sequential", "fast", "burst", "custom"] as const;
const SOURCES = ["sms", "whatsapp", "telegram", "browser"] as const;

export default function TestRunner() {
  const nav = useNavigate();
  const [url, setUrl] = useState("");
  const [clicks, setClicks] = useState<number | "custom">(10);
  const [customClicks, setCustomClicks] = useState("");
  const [speed, setSpeed] = useState("sequential");
  const [customRps, setCustomRps] = useState("");
  const [scenario, setScenario] = useState("custom");
  const [concurrency, setConcurrency] = useState("5");
  const [sources, setSources] = useState<string[]>(["sms", "whatsapp", "telegram", "browser"]);
  const [osFilter, setOsFilter] = useState<string>("all");
  // Start with static catalogs so pickers work even when the API is unreachable (e.g. Vercel frontend-only deploy).
  const [devices, setDevices] = useState<any[]>(DEVICE_FALLBACK);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>(() => {
    const map = new Map<string, string>();
    LOCATION_FALLBACK.forEach((l: any) => { if (!map.has(l.countryCode)) map.set(l.countryCode, l.country); });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
  });
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    api.get<any[]>("/api/devices").then(d=>{if(Array.isArray(d)&&d.length) setDevices(d)}).catch(()=>{});
    api.get<any[]>("/api/locations").then(locs => {
      if (!Array.isArray(locs)||!locs.length) return;
      const map = new Map<string, string>();
      locs.forEach((l: any) => { if (!map.has(l.countryCode)) map.set(l.countryCode, l.country); });
      setCountries(Array.from(map.entries()).map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(() => {});
  }, []);

  const visibleDevices = osFilter==="android"?devices.filter(d=>d.osName==="Android"):osFilter==="ios"?devices.filter(d=>d.osName==="iOS"):devices;
  const totalClicks = clicks === "custom" ? parseInt(customClicks) || 0 : clicks;
  const showWarning = totalClicks >= 100 || speed === "burst";
  const rps: number | null = speed === "custom" ? (parseInt(customRps) || null) : speed === "burst" ? null : speed === "fast" ? 25 : 2;

  async function submit() {
    if (!url) { setMsg("Enter a target URL"); setConfirmError("Enter a target URL"); return; }
    try { new URL(url); } catch { setMsg("Invalid URL — must start with https://"); setConfirmError("Invalid URL — must start with https://"); return; }
    if (totalClicks < 1) { setMsg("Clicks must be at least 1"); setConfirmError("Clicks must be at least 1"); return; }
    if (sources.length === 0) { setMsg("Select at least one source"); setConfirmError("Select at least one source"); return; }
    setLoading(true); setMsg(""); setConfirmError("");
    try {
      const body: any = { targetUrl:url, totalRequests:totalClicks, speedMode:speed==="custom"?"custom":speed, scenarioId:scenario, concurrency:parseInt(concurrency)||5, sourceFilter:sources };
      if (osFilter!=="all") body.osFilter=osFilter;
      if (selectedDevices.length) body.deviceFilter=selectedDevices;
      if (selectedCountries.length) body.geoFilter=selectedCountries;
      if (rps!==null) body.requestsPerSecond=rps;
      let data: any;
      try {
        data = await api.post<any>("/api/runs", body);
      } catch {
        // No backend reachable (frontend-only deploy): run a local simulated test instead,
        // sampling from the bundled device/location catalogs. Clearly labelled as demo mode.
        const local = createLocalRun({
          targetUrl: url,
          totalRequests: totalClicks,
          concurrency: body.concurrency,
          speedMode: body.speedMode,
          scenarioId: scenario,
          sources,
          deviceIds: selectedDevices,
          countryCodes: selectedCountries,
        });
        data = { id: local.id };
      }
      if (!data?.id) throw new Error("Server responded without a run id — backend may not have started the test.");
      setShowConfirm(false); nav(`/run/${data.id}`);
    } catch (e:any){
      const friendly = e?.message?.includes("Cannot reach API")
        ? e.message
        : `Start failed: ${e?.message || "Failed"}`;
      setMsg(friendly); setConfirmError(friendly);
    } finally{ setLoading(false); }
  }

  const chip = (active:boolean)=>({padding:'7px 12px',borderRadius:999,fontSize:13,fontWeight:600,cursor:'pointer',border:'1px solid',borderColor:active?'#4f46e5':'#e2e8f0',background:active?'#4f46e5':'#fff',color:active?'#fff':'#475569',transition:'all .15s'});

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
        <h1 style={{fontSize:26,fontWeight:800,letterSpacing:-.5}}>Test Runner</h1>
        <p style={{fontSize:13,color:'#64748b',marginTop:4}}>Configure and launch a synthetic click test. Only use against domains you own.</p>
      </motion.div>

      <AnimatePresence>{showWarning ? <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{background:'#fef3c7',border:'1px solid #f59e0b',color:'#92400e',padding:'10px 14px',borderRadius:12,fontSize:13}}>⚠ High load — {totalClicks} clicks in {speed} mode. Ensure you own the target domain.</motion.div> : null}</AnimatePresence>

      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.08}} className="card" style={{padding:22,display:'flex',flexDirection:'column',gap:18}}>
        <label style={{fontSize:13,fontWeight:600}}>Target URL
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://your-tracker.com/abc123" className="input" style={{marginTop:6}}/>
        </label>

        <div><div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Clicks</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {CLICK_OPTIONS.map(n=><motion.button key={n} whileTap={{scale:.96}} onClick={()=>setClicks(n)} style={chip(clicks===n)}>{n}</motion.button>)}
            <motion.button whileTap={{scale:.96}} onClick={()=>setClicks("custom")} style={chip(clicks==="custom")}>Custom</motion.button>
          </div>
          <AnimatePresence>{clicks==="custom"?<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}><input value={customClicks} onChange={e=>setCustomClicks(e.target.value)} type="number" placeholder="Custom count" className="input" style={{marginTop:8}}/></motion.div>:null}</AnimatePresence>
        </div>

        <div><div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Speed</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {SPEED_OPTS.map(s=><motion.button key={s} whileTap={{scale:.96}} onClick={()=>setSpeed(s)} style={chip(speed===s)}>{s}</motion.button>)}
          </div>
          <AnimatePresence>{speed==="custom"?<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}><input value={customRps} onChange={e=>setCustomRps(e.target.value)} type="number" placeholder="Requests per second" className="input" style={{marginTop:8}}/></motion.div>:null}</AnimatePresence>
          <div style={{fontSize:11,color:'#94a3b8',marginTop:6}}>sequential 2/s · fast 25/s · burst as fast as possible</div>
        </div>

        <div><div style={{fontSize:13,fontWeight:600,marginBottom:8}}>OS / Device Type</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[{id:"all",label:"All"},{id:"android",label:"Android"},{id:"ios",label:"iOS"}].map(o=>(
              <motion.button key={o.id} whileTap={{scale:.96}} onClick={()=>{setOsFilter(o.id);setSelectedDevices([]);}} style={chip(osFilter===o.id)}>{o.label}</motion.button>
            ))}
          </div>
        </div>

        <div><div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Devices {selectedDevices.length?`(${selectedDevices.length} selected)`:''} <span style={{fontWeight:400,color:'#94a3b8'}}>— leave empty for random</span></div>
          <div style={{border:'1px solid #e2e8f0',borderRadius:12,padding:10,maxHeight:180,overflow:'auto',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:6,background:'#f8fafc'}}>
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600,gridColumn:'1/-1',borderBottom:'1px solid #e2e8f0',paddingBottom:6}}><input type="checkbox" checked={selectedDevices.length===0} onChange={()=>setSelectedDevices([])}/> All (random)</label>
            {visibleDevices.map((d:any)=>(
              <label key={d.id} style={{display:'flex',alignItems:'center',gap:6,fontSize:13}}><input type="checkbox" checked={selectedDevices.includes(d.id)} onChange={e=>e.target.checked?setSelectedDevices(p=>[...p,d.id]):setSelectedDevices(p=>p.filter(x=>x!==d.id))}/><span>{d.name}</span><span style={{fontSize:11,color:'#94a3b8'}}>{d.osName}</span></label>
            ))}
          </div>
        </div>

        <div><div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Sources</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {SOURCES.map(s=>(
              <motion.label key={s} whileTap={{scale:.96}} style={{...chip(sources.includes(s)),display:'flex',alignItems:'center',gap:6,userSelect:'none'}}>
                <input type="checkbox" checked={sources.includes(s)} onChange={()=>setSources(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])} style={{display:'none'}}/>
                {s==="sms"?"SMS":s==="whatsapp"?"WhatsApp":s==="telegram"?"Telegram":"Browser"}
              </motion.label>
            ))}
          </div>
        </div>

        <div><div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Countries <span style={{fontWeight:400,color:'#94a3b8'}}>— all 70 (random) if empty</span></div>
          <div style={{border:'1px solid #e2e8f0',borderRadius:12,padding:10,maxHeight:160,overflow:'auto',display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6,background:'#f8fafc'}}>
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600,gridColumn:'1/-1',borderBottom:'1px solid #e2e8f0',paddingBottom:6}}><input type="checkbox" checked={selectedCountries.length===0} onChange={()=>setSelectedCountries([])}/> All (random)</label>
            {countries.map(c=>(
              <label key={c.code} style={{display:'flex',alignItems:'center',gap:6,fontSize:13}}><input type="checkbox" checked={selectedCountries.includes(c.code)} onChange={e=>e.target.checked?setSelectedCountries(p=>[...p,c.code]):setSelectedCountries(p=>p.filter(x=>x!==c.code))}/>{c.name} <span style={{fontSize:11,color:'#94a3b8'}}>{c.code}</span></label>
            ))}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <label style={{fontSize:13,fontWeight:600}}>Scenario<select value={scenario} onChange={e=>setScenario(e.target.value)} className="input" style={{marginTop:6}}>{["custom","android","geo","source-attribution","mixed","stress"].map(s=><option key={s} value={s}>{s}</option>)}</select></label>
          <label style={{fontSize:13,fontWeight:600}}>Concurrency<input type="number" min={1} max={100} value={concurrency} onChange={e=>setConcurrency(e.target.value)} className="input" style={{marginTop:6}}/></label>
        </div>

        <motion.button whileHover={{scale:1.01}} whileTap={{scale:.99}} onClick={()=>setShowConfirm(true)} disabled={loading||!url} className="btn-primary" style={{width:'100%',padding:'12px',fontSize:15,opacity:loading||!url?.6:1}}>{loading?"Starting…":"Start Test →"}</motion.button>
        {msg?<motion.p initial={{opacity:0}} animate={{opacity:1}} style={{fontSize:13,textAlign:'center',color:'#64748b'}}>{msg}</motion.p>:null}
      </motion.div>

      <AnimatePresence>{showConfirm?
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'grid',placeItems:'center',zIndex:50,padding:16}} onClick={()=>setShowConfirm(false)}>
          <motion.div initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}} onClick={e=>e.stopPropagation()} className="card" style={{padding:24,maxWidth:420,width:'100%',display:'flex',flexDirection:'column',gap:14}}>
            <h2 style={{fontWeight:800,fontSize:16}}>Confirm test</h2>
            <p style={{fontSize:13,lineHeight:1.6}}>Send <b>{totalClicks}</b> synthetic clicks to<br/><span className="mono" style={{color:'#4f46e5',wordBreak:'break-all'}}>{url}</span><br/>OS: {osFilter} · Sources: {sources.join(", ")}<br/><span style={{fontSize:11,color:'#64748b'}}>I confirm I own or have permission to test this URL.</span></p>
            {confirmError?<p style={{fontSize:13,lineHeight:1.5,background:'#fef2f2',border:'1px solid #fca5a5',color:'#b91c1c',padding:'10px 12px',borderRadius:10}}>{confirmError}</p>:null}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>{setShowConfirm(false); setConfirmError("");}} className="btn-ghost">Cancel</button>
              <button onClick={submit} disabled={loading} className="btn-primary">{loading?"Starting…":"Confirm & Start"}</button>
            </div>
          </motion.div>
        </motion.div>:null}
      </AnimatePresence>
    </div>
  );
}
