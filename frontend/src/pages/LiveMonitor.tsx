import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { api } from "../lib/api";

const API = (import.meta as any).env.VITE_API_URL || "http://localhost:4000";
type Click = any;

export default function LiveMonitor() {
  const { id: runId } = useParams<{ id: string }>();
  const [clicks, setClicks] = useState<Click[]>([]);
  const [run, setRun] = useState<any>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0, success: 0, fail: 0, avgMs: 0 });
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!runId) return;
    api.get<any>("/api/runs/" + runId).then((r) => {
      setRun(r);
      setProgress((p) => ({ ...p, total: r.total_requests, success: r.success_count, fail: r.fail_count, avgMs: r.avg_response_ms || 0, completed: r.success_count + r.fail_count }));
      if (r.status === "completed" || r.status === "stopped" || r.status === "failed") setLive(false);
    }).catch(() => {});
    api.get<any[]>("/api/runs/" + runId + "/clicks").then((cs) => {
      if (cs.length) setClicks(cs.map((c: any) => ({ id: String(c.seq), seq: c.seq, device: c.device_name, source: c.source, country: c.country, city: c.city, status: c.status, responseMs: c.response_ms, error: c.error })).reverse());
    }).catch(() => {});
  }, [runId]);

  useEffect(() => {
    if (!runId) return;
    const socket: Socket = io(API);
    socket.on("connect", () => socket.emit("run:subscribe", runId));
    socket.on("run:progress", (d: any) => setProgress((p) => ({ ...p, completed: d.completed, total: d.total, success: d.success, fail: d.fail, avgMs: d.avgMs })));
    socket.on("run:click", (c: any) => setClicks((prev) => [{ id: String(c.seq), ...c, responseMs: c.responseMs }, ...prev].slice(0, 300)));
    socket.on("run:finished", (d: any) => { setRun((r: any) => (r ? { ...r, status: d.status, success_count: d.success, fail_count: d.fail } : r)); setLive(false); });
    return () => { socket.emit("run:unsubscribe", runId); socket.disconnect(); };
  }, [runId]);

  const total = progress.total || (run ? run.total_requests : 0);
  const completed = progress.completed;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div><h1 style={{fontSize:24,fontWeight:800}}>Live Monitor <span className="mono" style={{fontSize:12,color:'#64748b',fontWeight:400}}>{runId}</span></h1>
        {run ? <p className="mono" style={{fontSize:12,color:'#64748b',marginTop:4}}>{run.target_url} · <span className="badge" style={{background:run.status==='completed'?'#dcfce7':'#dbeafe',color:run.status==='completed'?'#166534':'#1e40af'}}>{run.status}</span> {live ? <motion.span animate={{opacity:[1,.3,1]}} transition={{repeat:Infinity,duration:1.2}} style={{display:'inline-block',width:8,height:8,background:'#22c55e',borderRadius:999,marginLeft:8}}/> : null}</p> : null}</div>
        <Link to={"/run/" + runId + "/results"} className="btn-ghost" style={{textDecoration:'none'}}>View Results →</Link>
      </motion.div>

      <div className="card" style={{padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}><span>{completed} / {total}</span><span style={{fontWeight:700}}>{pct}% {live?'— running':'— finished'}</span></div>
        <div style={{height:10,background:'#e2e8f0',borderRadius:999,overflow:'hidden'}}><motion.div initial={{width:0}} animate={{width:pct+'%'}} transition={{type:'spring',stiffness:60}} style={{height:'100%',background:'linear-gradient(90deg,#6366f1,#4f46e5)',borderRadius:999}}/></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14}}>
        {[
          {label:'Completed',value:completed,color:'#0f172a'},
          {label:'Success',value:progress.success,color:'#16a34a'},
          {label:'Failed',value:progress.fail,color:'#dc2626'},
          {label:'Avg response',value:progress.avgMs+'ms',color:'#0f172a'},
        ].map((s,i)=>(
          <motion.div key={s.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.06}} className="card" style={{padding:18,textAlign:'center'}}>
            <motion.div initial={{scale:.8}} animate={{scale:1}} transition={{delay:.3+i*.05,type:'spring'}} style={{fontSize:26,fontWeight:800,color:s.color}}>{s.value}</motion.div>
            <div style={{fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:.5,marginTop:4}}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="card" style={{overflow:'hidden'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid #e2e8f0',fontWeight:700,display:'flex',alignItems:'center',gap:8}}><span>Live Click Feed</span> <span className="badge" style={{background:'#f1f5f9',color:'#64748b'}}>{clicks.length}</span></div>
        <ul style={{maxHeight:420,overflow:'auto'}}>
          <AnimatePresence>
            {clicks.map((c: any) => (
              <motion.li key={c.id + "-" + c.seq} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} style={{padding:'10px 16px',display:'flex',justifyContent:'space-between',fontSize:13,borderBottom:'1px solid #f1f5f9',gap:8}}>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>#{c.seq} <b>{c.device}</b> · {c.source} · {c.city}</span>
                <span style={{color:c.status && c.status < 400 ? '#16a34a' : '#dc2626',fontWeight:600,flexShrink:0}}>{c.status ?? c.error ?? "-"}</span>
                <span style={{color:'#94a3b8',flexShrink:0}}>{c.responseMs ?? c.response_ms}ms</span>
              </motion.li>
            ))}
          </AnimatePresence>
          {!clicks.length ? <li style={{padding:'40px 16px',textAlign:'center',color:'#94a3b8',fontSize:13}}>Waiting for events… {live ? <motion.span animate={{opacity:[0,1,0]}} transition={{repeat:Infinity,duration:1}}>●</motion.span> : null}</li> : null}
        </ul>
      </div>
    </div>
  );
}
