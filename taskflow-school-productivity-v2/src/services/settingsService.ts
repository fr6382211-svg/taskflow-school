import { supabase } from '../lib/supabase';
export async function getSettings(userId:string){const {data,error}=await supabase.from('settings').select('*').eq('user_id',userId).maybeSingle();if(error)throw error;return data}
export async function saveSettings(userId:string,d:Record<string,unknown>){const {error}=await supabase.from('settings').upsert({user_id:userId,...d},{onConflict:'user_id'});if(error)throw error}
export async function getSystemSettings(){const {data,error}=await supabase.from('system_settings').select('*').eq('id',1).maybeSingle();if(error)throw error;return data}
export async function saveSystemSettings(d:Record<string,unknown>){const {error}=await supabase.from('system_settings').upsert({id:1,...d},{onConflict:'id'});if(error)throw error}
