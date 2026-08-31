const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() { return localStorage.getItem('token'); }

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(opts.headers as Record<string,string>||{}) };
  const t = getToken();
  if (t) headers['Authorization'] = `Bearer ${t}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (res.status === 401) { localStorage.removeItem('token'); location.href='/login'; throw new Error('Unauthorized'); }
  if (!res.ok) { const txt = await res.text(); throw new Error(txt || res.statusText); }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
export async function apiBlob(path:string): Promise<Blob> {
  const t=localStorage.getItem('token');
  const h:Record<string,string>={}; if(t) h['Authorization']=`Bearer ${t}`;
  const r=await fetch(`${BASE}${path}`,{headers:h}); if(!r.ok) throw new Error(await r.text()); return r.blob();
}
export const api: ((path:string,opts?:RequestInit)=>Promise<any>) & {
  get:<T>(p:string)=>Promise<T>; post:<T>(p:string,b?:unknown)=>Promise<T>;
  put:<T>(p:string,b?:unknown)=>Promise<T>; del:<T>(p:string)=>Promise<T>;
} = Object.assign((path:string,opts:RequestInit={})=>request(path,opts), {
  get: <T>(p:string)=>request<T>(p),
  post: <T>(p:string,b?:unknown)=>request<T>(p,{method:'POST',body:b?JSON.stringify(b):undefined}),
  put: <T>(p:string,b?:unknown)=>request<T>(p,{method:'PUT',body:JSON.stringify(b)}),
  del: <T>(p:string)=>request<T>(p,{method:'DELETE'}),
});
