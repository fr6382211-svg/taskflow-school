import { supabase } from '../lib/supabase';
import { subscribeToPostgresChanges } from '../lib/realtime';
import type { UserProfile } from '../types';
export function mapUser(r:any):UserProfile{return {uid:r.id,name:r.name,email:r.email,photoURL:r.photo_url||undefined,role:r.role,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at,lastLoginAt:r.last_login_at}}
export async function getUserProfile(uid:string){const {data,error}=await supabase.from('users').select('*').eq('id',uid).maybeSingle();if(error)throw error;return data?mapUser(data):null;}
export function subscribeUserProfile(uid:string,cb:(p:UserProfile|null)=>void,onError?:(e:unknown)=>void){let active=true;const load=async()=>{const {data,error}=await supabase.from('users').select('*').eq('id',uid).maybeSingle();if(error){onError?.(error);return}if(active)cb(data?mapUser(data):null)};void load();const unsubscribe=subscribeToPostgresChanges({topic:`profile:${uid}`,table:'users',filter:`id=eq.${uid}`,onChange:()=>void load(),onError});return()=>{active=false;unsubscribe()}}
export async function updateUserProfile(uid:string,data:Pick<UserProfile,'name'|'photoURL'>){const {error}=await supabase.from('users').update({name:data.name,photo_url:data.photoURL||null}).eq('id',uid);if(error)throw error;}
