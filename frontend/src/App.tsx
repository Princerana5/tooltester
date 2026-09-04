import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App(){
  return <BrowserRouter><Routes>
    <Route element={<Layout/>}>
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
  </Routes></BrowserRouter>;
}
