import { supabase } from '../lib/supabase';
import { subscribeToPostgresChanges } from '../lib/realtime';
import type { Notification } from '../types';
const map=(r:any):Notification=>({id:r.id,userId:r.user_id,title:r.title,message:r.message,type:r.type,read:r.read,createdAt:r.created_at,actionUrl:r.action_url||undefined});
export function subscribeNotifications(uid:string,cb:(items:Notification[])=>void,onError?:(e:unknown)=>void){let mounted=true;const fetch=async()=>{const {data,error}=await supabase.from('notifications').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(100);if(error){onError?.(error);return}if(mounted)cb((data||[]).map(map))};void fetch();const unsubscribe=subscribeToPostgresChanges({topic:`notifications:${uid}`,table:'notifications',filter:`user_id=eq.${uid}`,onChange:()=>void fetch(),onError});return()=>{mounted=false;unsubscribe()}}
export async function markNotificationRead(id:string){const {error}=await supabase.from('notifications').update({read:true}).eq('id',id);if(error)throw error}
export async function deleteNotification(id:string){const {error}=await supabase.from('notifications').delete().eq('id',id);if(error)throw error}
