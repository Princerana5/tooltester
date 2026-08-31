import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const barData=[{name:'Mon',runs:22},{name:'Tue',runs:31},{name:'Wed',runs:18},{name:'Thu',runs:27},{name:'Fri',runs:35},{name:'Sat',runs:12},{name:'Sun',runs:9}];
const lineData=[{name:'W1',rate:91},{name:'W2',rate:93},{name:'W3',rate:89},{name:'W4',rate:94}];

export default function Dashboard(){
  const [stats,setStats]=useState<any>(null);
  const [runs,setRuns]=useState<any[]>([]);
  useEffect(()=>{
    api.get<any>('/api/stats').then(setStats).catch(()=>{});
    api.get<any[]>('/api/runs').then(r=>setRuns(r.slice(0,5))).catch(()=>{});
  },[]);
  const cards=[
    {label:'Total Runs',value: stats?.totalRuns ?? '—', sub:'all time'},
    {label:'Total Clicks',value: stats?.totalClicks ?? '—', sub:'synthetic'},
    {label:'Avg Success',value: stats ? stats.avgSuccess+'%' : '—', sub:'across runs'},
    {label:'Countries',value:'70', sub:'geo profiles'},
  ];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} style={{display:'flex',alignItems:'center',gap:12}}>
        <h1 style={{fontSize:26,fontWeight:800,letterSpacing:-.5}}>Dashboard</h1>
        <span className="badge" style={{background:'#dcfce7',color:'#166534'}}>Live</span>
      </motion.div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16}}>
        {cards.map((s,i)=>(
          <motion.div key={s.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.07}} whileHover={{y:-3}} className="card" style={{padding:18}}>
            <div style={{fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:.6,fontWeight:600}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:800,marginTop:8}}>{s.value}</div>
            <div style={{fontSize:12,color:'#64748b',marginTop:4}}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16}}>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.25}} className="card" style={{padding:18}}>
          <h3 style={{fontWeight:700,marginBottom:12}}>Runs per day</h3>
          <div style={{height:220}}><ResponsiveContainer width="100%" height="100%"><BarChart data={barData}><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/><Tooltip/><Bar dataKey="runs" fill="#6366f1" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div>
        </motion.div>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.3}} className="card" style={{padding:18}}>
          <h3 style={{fontWeight:700,marginBottom:12}}>Pass rate trend</h3>
          <div style={{height:220}}><ResponsiveContainer width="100%" height="100%"><LineChart data={lineData}><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis domain={[80,100]} tick={{fontSize:12}}/><Tooltip/><Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2.5} dot={{r:4,fill:'#6366f1'}}/></LineChart></ResponsiveContainer></div>
        </motion.div>
      </div>

      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.35}} className="card" style={{padding:18}}>
        <h3 style={{fontWeight:700,marginBottom:12}}>Recent runs</h3>
        {runs.length===0 ? <p style={{color:'#94a3b8',fontSize:14}}>No runs yet — start one from Test Runner.</p> :
        <table style={{width:'100%',fontSize:14,borderCollapse:'collapse'}}>
          <thead><tr style={{color:'#64748b',textAlign:'left'}}><th style={{padding:'8px 0'}}>ID</th><th>Status</th><th>Target</th><th>Result</th></tr></thead>
          <tbody>{runs.map(r=>(
            <motion.tr key={r.id} initial={{opacity:0}} animate={{opacity:1}} style={{borderTop:'1px solid #f1f5f9'}}>
              <td style={{padding:'10px 0',fontWeight:600}} className="mono">{r.id}</td>
              <td><span className="badge" style={{background:r.status==='completed'?'#dcfce7':'#fef3c7',color:r.status==='completed'?'#166534':'#92400e'}}>{r.status}</span></td>
              <td style={{color:'#64748b',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.target_url}</td>
              <td style={{fontSize:13}}>{r.success_count}/{r.success_count+r.fail_count}</td>
            </motion.tr>
          ))}</tbody>
        </table>}
      </motion.div>
    </div>
  );
}
