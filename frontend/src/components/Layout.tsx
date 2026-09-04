import { NavLink, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const nav = [
  { to:'/', label:'Dashboard', icon:'◈' },
  { to:'/runner', label:'Test Runner', icon:'▶' },
  { to:'/history', label:'History', icon:'◷' },
  { to:'/devices', label:'Devices', icon:'▭' },
  { to:'/locations', label:'Locations', icon:'◎' },
  { to:'/sources', label:'Sources', icon:'⬡' },
  { to:'/logs', label:'Logs', icon:'≡' },
  { to:'/settings', label:'Settings', icon:'⚙' },
];

export default function Layout(){
  const [open,setOpen]=useState(false);
  const [dark,setDark]=useState(()=>localStorage.getItem('theme')==='dark');
  useEffect(()=>{
    document.documentElement.classList.toggle('dark',dark);
    localStorage.setItem('theme',dark?'dark':'light');
    document.body.style.background=dark?'#0f172a':'#f8fafc';
  },[dark]);
  return (
    <div style={{minHeight:'100vh',background:dark?'#0f172a':'#f8fafc',color:dark?'#e2e8f0':'#0f172a'}}>
      <style>{`
        .sidebar{position:fixed;inset:0 auto 0 0;width:260px;background:${dark?'#1e293b':'#ffffff'};border-right:1px solid ${dark?'#334155':'#e2e8f0'};display:flex;flex-direction:column;z-index:20}
        @media(max-width:768px){.sidebar{transform:translateX(${open?'0':'-100%'});transition:transform .25s ease}.main{margin-left:0!important}}
        .main{margin-left:260px;min-height:100vh}
        .nav-active{background:${dark?'#334155':'#eef2ff'}!important;color:${dark?'#818cf8':'#4f46e5'}!important;font-weight:600}
      `}</style>

      <AnimatePresence>{open && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:10}}/>}</AnimatePresence>

      <motion.aside className="sidebar" initial={false} animate={{x:0}}>
        <div style={{padding:'20px 16px',borderBottom:`1px solid ${dark?'#334155':'#e2e8f0'}`,display:'flex',alignItems:'center',gap:10}}>
          <motion.div animate={{rotate:[0,5,-5,0]}} transition={{duration:4,repeat:Infinity}} style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#6366f1,#4f46e5)',display:'grid',placeItems:'center',color:'#fff',fontWeight:800,fontSize:16}}>◈</motion.div>
          <div><div style={{fontWeight:800,fontSize:15}}>URL Tracker Lab</div><div style={{fontSize:11,color:'#64748b'}}>Test. Verify. Optimize.</div></div>
          <button onClick={()=>setDark(!dark)} title="Toggle theme" style={{marginLeft:'auto',cursor:'pointer',padding:'6px 8px',borderRadius:8,border:`1px solid ${dark?'#475569':'#e2e8f0'}`,background:'transparent',fontSize:14}}>{dark?'☀':'☾'}</button>
        </div>
        <nav style={{flex:1,padding:12,display:'flex',flexDirection:'column',gap:4,overflowY:'auto'}}>
          {nav.map(n=>(
            <NavLink key={n.to} to={n.to} end={n.to==='/'} onClick={()=>setOpen(false)}
              className={({isActive})=>isActive?'nav-active':''}
              style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,textDecoration:'none',color:dark?'#cbd5e1':'#475569',fontSize:14,transition:'all .15s'}}>
              <span style={{width:22,textAlign:'center'}}>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>
        <div style={{padding:12,borderTop:`1px solid ${dark?'#334155':'#e2e8f0'}`,fontSize:13}}>
          <div style={{opacity:.7,overflow:'hidden',textOverflow:'ellipsis'}}>Open access</div>
        </div>
      </motion.aside>

      <div className="main">
        <header style={{height:60,display:'flex',alignItems:'center',gap:12,padding:'0 20px',background:dark?'#1e293b':'#ffffff',borderBottom:`1px solid ${dark?'#334155':'#e2e8f0'}`,position:'sticky',top:0,zIndex:5,backdropFilter:'blur(8px)'}}>
          <button onClick={()=>setOpen(!open)} style={{padding:'8px 10px',borderRadius:10,border:`1px solid ${dark?'#475569':'#e2e8f0'}`,cursor:'pointer',background:'transparent',fontSize:16}}>☰</button>
          <span style={{fontWeight:700,letterSpacing:-.3}}>URL Tracker Lab</span>
          <span className="badge" style={{background:'#eef2ff',color:'#4f46e5',marginLeft:8}}>v1.0</span>
        </header>
        <motion.main initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.35}} style={{padding:24,maxWidth:1200,margin:'0 auto'}}><Outlet/></motion.main>
      </div>
    </div>
  );
}
