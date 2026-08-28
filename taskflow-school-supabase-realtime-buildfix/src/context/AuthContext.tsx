import { createContext,useContext,useEffect,useMemo,useState } from 'react';
import type { Session,User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { login as loginService, logout as logoutService, register as registerService, resetPassword as resetService } from '../services/authService';
import { subscribeUserProfile } from '../services/userService';
import type { UserProfile } from '../types';
interface AuthContextValue { user:User|null; session:Session|null; profile:UserProfile|null; loading:boolean; isAuthenticated:boolean; isAdmin:boolean; login:(e:string,p:string,r:boolean)=>Promise<void>; register:(n:string,e:string,p:string)=>Promise<void>; logout:()=>Promise<void>; resetPassword:(e:string)=>Promise<void>; refreshProfile:()=>Promise<void>; }
const AuthContext=createContext<AuthContextValue|null>(null);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [session,setSession]=useState<Session|null>(null); const [user,setUser]=useState<User|null>(null); const [profile,setProfile]=useState<UserProfile|null>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{let unsubProfile:undefined|(()=>void); const load=async()=>{const {data}=await supabase.auth.getSession();setSession(data.session);setUser(data.session?.user??null); if(data.session?.user){unsubProfile=subscribeUserProfile(data.session.user.id,setProfile,()=>setProfile(null));} setLoading(false)}; void load(); const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>{setSession(s);setUser(s?.user??null);if(unsubProfile){unsubProfile();unsubProfile=undefined;}if(s?.user){unsubProfile=subscribeUserProfile(s.user.id,setProfile,()=>setProfile(null));}else setProfile(null);}); return()=>{subscription.unsubscribe();unsubProfile?.()};},[]);
 useEffect(()=>{if(profile?.status==='disabled'&&user) void logoutService();},[profile?.status,user]);
 const value=useMemo<AuthContextValue>(()=>({user,session,profile,loading,isAuthenticated:!!user,isAdmin:profile?.role==='admin',login:async(e,p,r)=>{await loginService(e,p,r)},register:async(n,e,p)=>{await registerService(n,e,p)},logout:logoutService,resetPassword:resetService,refreshProfile:async()=>{if(user){const {data}=await supabase.from('users').select('*').eq('id',user.id).maybeSingle();setProfile(data?mapUser(data):null);}}}),[user,session,profile,loading]);
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
function mapUser(r:any):UserProfile{return {uid:r.id,name:r.name,email:r.email,photoURL:r.photo_url||undefined,role:r.role,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at,lastLoginAt:r.last_login_at}}
export const useAuth=()=>{const c=useContext(AuthContext);if(!c)throw new Error('useAuth must be used inside AuthProvider');return c;};
