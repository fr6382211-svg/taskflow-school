import { supabase } from '../lib/supabase'; import type { Teacher } from '../types';
const map=(r:any):Teacher=>({id:r.id,name:r.name,email:r.email||undefined,subject:r.subject||undefined,active:r.active,createdAt:r.created_at,updatedAt:r.updated_at});
export async function loadTeachers(){const {data,error}=await supabase.from('teachers').select('*').order('name');if(error)throw error;return (data||[]).map(map)}
export async function saveTeacher(t:Partial<Teacher>&{name:string}){const payload={name:t.name.trim(),email:t.email||null,subject:t.subject||null,active:t.active??true};const {error}=t.id?await supabase.from('teachers').update(payload).eq('id',t.id):await supabase.from('teachers').insert(payload);if(error)throw error}
export async function deleteTeacher(id:string){const {error}=await supabase.from('teachers').delete().eq('id',id);if(error)throw error}
