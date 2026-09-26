import { supabase } from '../lib/supabase';
export async function setUserRole(uid:string,role:'user'|'admin'){const {error}=await supabase.functions.invoke('admin-users',{body:{action:'set_role',uid,role}});if(error)throw error}
export async function setUserStatus(uid:string,status:'active'|'disabled'){const {error}=await supabase.from('users').update({status}).eq('id',uid);if(error)throw error}
export async function deleteUserAccount(uid:string){const {error}=await supabase.functions.invoke('admin-users',{body:{action:'delete_user',uid}});if(error)throw error}
