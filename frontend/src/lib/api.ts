const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(opts.headers as Record<string,string>||{}) };
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...opts, headers });
  } catch (e: any) {
    throw new Error(`Cannot reach API at ${BASE}${path}. Is the backend running? (${e?.message || 'network error'})`);
  }
  if (!res.ok) { const txt = await res.text(); throw new Error(txt ? `${res.status}: ${txt.slice(0, 300)}` : `${res.status} ${res.statusText}`); }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
export async function apiBlob(path:string): Promise<Blob> {
  const r=await fetch(`${BASE}${path}`); if(!r.ok) throw new Error(await r.text()); return r.blob();
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
