import { supabase, APP_URL, setAuthPersistence } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

export async function login(email:string,password:string,remember:boolean){
  // Only the Supabase Auth session uses browser storage; app data remains in Postgres/Storage.
  setAuthPersistence(remember);
  const {data,error}=await supabase.auth.signInWithPassword({email,password});
  if(error) throw error; await trackEvent('login'); return data.user;
}
export async function register(name:string,email:string,password:string){
  const {data,error}=await supabase.auth.signUp({email,password,options:{data:{name},emailRedirectTo:`${APP_URL}/login`}});
  if(error) throw error;
  if(data.user && data.session) await supabase.from('users').upsert({id:data.user.id,name,email,role:'user',status:'active'},{onConflict:'id'});
  await trackEvent('sign_up'); return data.user;
}
export async function resetPassword(email:string){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${APP_URL}/profile`});if(error)throw error;}
export async function logout(){await trackEvent('logout');const {error}=await supabase.auth.signOut();if(error)throw error;}
