import { supabase } from '../lib/supabase'; import type { Subject } from '../types';
const map=(r:any):Subject=>({id:r.id,name:r.name,teacher:r.teacher||undefined,active:r.active,createdAt:r.created_at,updatedAt:r.updated_at});
export async function loadSubjects(){const {data,error}=await supabase.from('subjects').select('*').order('name');if(error)throw error;return (data||[]).map(map)}
export async function saveSubject(s:Partial<Subject>&{name:string}){const payload={name:s.name.trim(),teacher:s.teacher||null,active:s.active??true};const q=s.id?supabase.from('subjects').update(payload).eq('id',s.id):supabase.from('subjects').insert(payload);const {error}=await q;if(error)throw error}
export async function deleteSubject(id:string){const {error}=await supabase.from('subjects').delete().eq('id',id);if(error)throw error}
