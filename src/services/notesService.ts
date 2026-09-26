import { supabase } from '../lib/supabase';
import { subscribeToPostgresChanges } from '../lib/realtime';
import type { WorkspaceId } from '../context/WorkspaceContext';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  storagePath?: string;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const mapNote = (r: any): Note => ({
  id: r.id,
  title: r.title || '',
  content: r.content || '',
  createdBy: r.created_by,
  createdByName: r.created_by_name || '',
  fileUrl: r.file_url || undefined,
  fileName: r.file_name || undefined,
  fileType: r.file_type || undefined,
  fileSize: r.file_size || undefined,
  storagePath: r.storage_path || undefined,
  pinned: !!r.pinned,
  tags: Array.isArray(r.tags) ? r.tags : [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const cols = 'id,title,content,created_by,created_by_name,file_url,file_name,file_type,file_size,storage_path,pinned,tags,created_at,updated_at';
const workspaceTag = (w: WorkspaceId) => `workspace:${w === 'mazet' ? 'mazet' : 'fathur'}`;

async function withSignedUrl(note: Note): Promise<Note> {
  if (!note.storagePath) return note;
  const { data } = await supabase.storage.from('note-files').createSignedUrl(note.storagePath, 3600);
  if (data?.signedUrl) note.fileUrl = data.signedUrl;
  return note;
}

/** Notes are private per-account (unlike tasks): only the creator (or admin) sees their own notes.
 * ownUid must be passed so RLS + this filter agree. workspaceId only tags new notes for later reporting. */
export async function loadNotes(ownUid: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(cols)
    .eq('created_by', ownUid)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return Promise.all((data || []).map(mapNote).map(withSignedUrl));
}

export async function getNote(id: string): Promise<Note | null> {
  const { data, error } = await supabase.from('notes').select(cols).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return withSignedUrl(mapNote(data));
}

export function subscribeNotes(ownUid: string, cb: (notes: Note[]) => void, onError?: (e: unknown) => void) {
  let mounted = true;
  const fetch = async () => {
    try {
      const d = await loadNotes(ownUid);
      if (mounted) cb(d);
    } catch (e) {
      onError?.(e);
    }
  };
  void fetch();
  const unsubscribe = subscribeToPostgresChanges({
    topic: `notes-user:${ownUid}`,
    table: 'notes',
    filter: `created_by=eq.${ownUid}`,
    onChange: () => void fetch(),
    onError,
  });
  return () => {
    mounted = false;
    unsubscribe();
  };
}

export interface CreateNoteInput {
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  workspaceId: WorkspaceId;
  file?: File;
}

/** Uploads an optional attachment (image or any file) to note-files/{uid}/{noteId}-{filename},
 * then inserts the note row. Storage path is scoped by uid so RLS (foldername = auth.uid()) allows it. */
export async function createNote(input: CreateNoteInput): Promise<{ id: string }> {
  const { data: row, error } = await supabase
    .from('notes')
    .insert({
      title: input.title,
      content: input.content,
      created_by: input.createdBy,
      created_by_name: input.createdByName,
      tags: [workspaceTag(input.workspaceId)],
    })
    .select('id')
    .single();
  if (error) throw error;

  if (input.file) {
    await attachFileToNote(row.id, input.createdBy, input.file);
  }
  return row;
}

export async function attachFileToNote(noteId: string, ownUid: string, file: File) {
  const path = `${ownUid}/${noteId}-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('note-files').upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { error } = await supabase
    .from('notes')
    .update({ file_name: file.name, file_type: file.type, file_size: file.size, storage_path: path })
    .eq('id', noteId);
  if (error) throw error;
}

export async function updateNote(id: string, data: Partial<Pick<Note, 'title' | 'content' | 'pinned'>>) {
  const { error } = await supabase.from('notes').update(data).eq('id', id);
  if (error) throw error;
}

export async function removeNoteAttachment(id: string) {
  const { data, error } = await supabase.from('notes').select('storage_path').eq('id', id).maybeSingle();
  if (error) throw error;
  const path = data?.storage_path as string | undefined;
  if (path) await supabase.storage.from('note-files').remove([path]);
  const { error: updateError } = await supabase
    .from('notes')
    .update({ file_name: null, file_type: null, file_size: null, storage_path: null, file_url: null })
    .eq('id', id);
  if (updateError) throw updateError;
}

export async function removeNote(id: string) {
  const { data, error } = await supabase.from('notes').select('storage_path').eq('id', id).maybeSingle();
  if (error) throw error;
  const path = data?.storage_path as string | undefined;
  const { error: delError } = await supabase.from('notes').delete().eq('id', id);
  if (delError) throw delError;
  if (path) await supabase.storage.from('note-files').remove([path]);
}
