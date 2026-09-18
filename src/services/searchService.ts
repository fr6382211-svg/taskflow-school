import { supabase } from '../lib/supabase';

export async function globalSearch(term: string, userId?: string) {
  const q = term.trim();
  if (!q) return { tasks: [], users: [], schedule: [], announcements: [], subjects: [], teachers: [], notifications: [] };
  const pattern = `%${q}%`;
  const [{ data: tasks }, { data: users }, { data: schedule }, { data: announcements }, { data: subjects }, { data: teachers }, { data: notifications }] = await Promise.all([
    supabase.from('tasks').select('id,title,subject_name,teacher_name,due_date,due_time,status,priority').or(`title.ilike.${pattern},subject_name.ilike.${pattern},teacher_name.ilike.${pattern}`).order('due_date').limit(20),
    supabase.from('users').select('id,name,email,role,status').or(`name.ilike.${pattern},email.ilike.${pattern}`).limit(20),
    supabase.from('schedule').select('id,day,start_time,end_time,subject,teacher,type').or(`subject.ilike.${pattern},teacher.ilike.${pattern}`).eq('active', true).limit(20),
    supabase.from('announcements').select('id,title,body,priority,created_at').or(`title.ilike.${pattern},body.ilike.${pattern}`).eq('active', true).limit(10),
    supabase.from('subjects').select('id,name,teacher,active').or(`name.ilike.${pattern},teacher.ilike.${pattern}`).eq('active',true).limit(20),
    supabase.from('teachers').select('id,name,email,subject,active').or(`name.ilike.${pattern},email.ilike.${pattern},subject.ilike.${pattern}`).eq('active',true).limit(20),
    userId ? supabase.from('notifications').select('id,title,message,type,read,created_at,action_url').eq('user_id',userId).or(`title.ilike.${pattern},message.ilike.${pattern}`).order('created_at',{ascending:false}).limit(20) : Promise.resolve({data:[]} as any),
  ]);
  return { tasks: tasks || [], users: users || [], schedule: schedule || [], announcements: announcements || [], subjects: subjects || [], teachers: teachers || [], notifications: notifications || [] };
}
