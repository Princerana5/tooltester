import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './stores/auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TestRunner from './pages/TestRunner';
import History from './pages/History';
import Devices from './pages/Devices';
import Locations from './pages/Locations';
import Sources from './pages/Sources';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import LiveMonitor from './pages/LiveMonitor';
import ResultsTable from './pages/ResultsTable';

function Login(){
  const {login}=useAuth();
  const onSubmit=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    await login(String(fd.get('email')),String(fd.get('password')));
    location.href='/';
  };
  return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f1f5f9'}}>
    <form onSubmit={onSubmit} style={{background:'#fff',padding:32,borderRadius:12,border:'1px solid #e2e8f0',display:'flex',flexDirection:'column',gap:12,width:360}}>
      <h1 style={{fontWeight:700}}>URL Tracker Lab — Sign in</h1>
      <p style={{fontSize:13,color:'#64748b'}}>Default: admin@local / changeme-admin-password</p>
      <input name="email" placeholder="Email" defaultValue="admin@local" style={{padding:'10px 12px',border:'1px solid #cbd5e1',borderRadius:8}}/>
      <input name="password" type="password" placeholder="Password" style={{padding:'10px 12px',border:'1px solid #cbd5e1',borderRadius:8}}/>
      <button style={{padding:10,borderRadius:8,background:'#4f46e5',color:'#fff',border:'none',cursor:'pointer',fontWeight:600}}>Sign in</button>
    </form>
  </div>;
}
function Guard({children}:{children:React.ReactNode}){
  const {token,loading}=useAuth();
  if(loading) return <div style={{padding:40}}>Loading...</div>;
  if(!token) return <Navigate to="/login" replace/>;
  return <>{children}</>;
}
export default function App(){
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<Login/>}/>
    <Route element={<Guard><Layout/></Guard>}>
      <Route index element={<Dashboard/>}/>
      <Route path="runner" element={<TestRunner/>}/>
      <Route path="history" element={<History/>}/>
      <Route path="devices" element={<Devices/>}/>
      <Route path="locations" element={<Locations/>}/>
      <Route path="sources" element={<Sources/>}/>
      <Route path="logs" element={<Logs/>}/>
      <Route path="settings" element={<Settings/>}/>
      <Route path="run/:id" element={<LiveMonitor/>}/>
      <Route path="run/:id/results" element={<ResultsTable/>}/>
    </Route>
  </Routes></BrowserRouter></AuthProvider>;
}
