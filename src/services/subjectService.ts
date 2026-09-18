import { supabase } from '../lib/supabase';
import type { Subject } from '../types';

const map = (r: any): Subject => ({
  id: r.id,
  name: r.name,
  teacher: r.teacher || undefined,
  active: r.active,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function loadSubjects() {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('active', true)
    .order('name');
  if (error) throw error;
  return (data || []).map(map);
}

/**
 * The schedule is the authoritative fallback for schools where subjects
 * haven't been seeded yet. This prevents the task form from being unusable
 * just because the subjects table is empty.
 */
export async function loadSubjectsWithScheduleFallback() {
  const subjects = await loadSubjects();
  if (subjects.length > 0) return subjects;

  const { data, error } = await supabase
    .from('schedule')
    .select('subject,teacher,active,type')
    .eq('active', true)
    .eq('type', 'subject')
    .order('subject');

  if (error) throw error;

  const byName = new Map<string, Subject>();
  for (const row of data || []) {
    const name = String(row.subject || '').trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase('id-ID');
    if (!byName.has(key)) {
      byName.set(key, {
        id: `schedule:${encodeURIComponent(name)}`,
        name,
        teacher: row.teacher ? String(row.teacher) : undefined,
        active: true,
      });
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
}

export async function saveSubject(s: Partial<Subject> & { name: string }) {
  const payload = { name: s.name.trim(), teacher: s.teacher || null, active: s.active ?? true };
  const q = s.id ? supabase.from('subjects').update(payload).eq('id', s.id) : supabase.from('subjects').insert(payload);
  const { error } = await q;
  if (error) throw error;
}

export async function deleteSubject(id: string) {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}
