import { supabase } from '../lib/supabase';

export interface TaskSubtask { id:string; taskId:string; userId:string; title:string; done:boolean; position:number; createdAt?:string; updatedAt?:string }
export interface TaskComment { id:string; taskId:string; userId:string; userName:string; body:string; createdAt?:string; updatedAt?:string }

export async function listSubtasks(taskId:string){
  const {data,error}=await supabase.from('task_subtasks').select('*').eq('task_id',taskId).order('position').order('created_at');
  if(error) throw error; return (data||[]).map((r:any)=>({id:r.id,taskId:r.task_id,userId:r.user_id,title:r.title,done:r.done,position:r.position,createdAt:r.created_at,updatedAt:r.updated_at}));
}
export async function addSubtask(taskId:string,userId:string,title:string,position:number){
  const {data,error}=await supabase.from('task_subtasks').insert({task_id:taskId,user_id:userId,title:title.trim(),position}).select('*').single(); if(error) throw error; return data;
}
export async function toggleSubtask(id:string,done:boolean){const {error}=await supabase.from('task_subtasks').update({done}).eq('id',id);if(error)throw error}
export async function deleteSubtask(id:string){const {error}=await supabase.from('task_subtasks').delete().eq('id',id);if(error)throw error}
export async function listComments(taskId:string){const {data,error}=await supabase.from('task_comments').select('*').eq('task_id',taskId).order('created_at',{ascending:true});if(error)throw error;return (data||[]).map((r:any)=>({id:r.id,taskId:r.task_id,userId:r.user_id,userName:r.user_name,body:r.body,createdAt:r.created_at,updatedAt:r.updated_at}));}
export async function addComment(taskId:string,userId:string,userName:string,body:string){const {data,error}=await supabase.from('task_comments').insert({task_id:taskId,user_id:userId,user_name:userName,body:body.trim()}).select('*').single();if(error)throw error;return data;}
export async function deleteComment(id:string){const {error}=await supabase.from('task_comments').delete().eq('id',id);if(error)throw error}
