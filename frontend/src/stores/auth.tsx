import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
type User={id:string;email:string;name:string;role:string};
type Ctx={user:User|null;token:string|null;login:(e:string,p:string)=>Promise<void>;logout:()=>void;loading:boolean};
const AuthCtx=createContext<Ctx>(null!);
export const useAuth=()=>useContext(AuthCtx);
export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(null);
  const [token,setToken]=useState<string|null>(()=>localStorage.getItem('token'));
  const [loading,setLoading]=useState(!!token);
  useEffect(()=>{
    if(!token){setLoading(false);return;}
    api.get<User>('/api/auth/me').then(setUser).catch(()=>{localStorage.removeItem('token');setToken(null);}).finally(()=>setLoading(false));
  },[token]);
  const login=async(email:string,password:string)=>{
    const d=await api.post<{token:string;email:string}>('/api/auth/login',{email,password});
    localStorage.setItem('token',d.token);setToken(d.token);setUser({id:'',email:d.email,name:d.email,role:'admin'});
  };
  const logout=()=>{localStorage.removeItem('token');setToken(null);setUser(null);};
  return <AuthCtx.Provider value={{user,token,login,logout,loading}}>{children}</AuthCtx.Provider>;
}
