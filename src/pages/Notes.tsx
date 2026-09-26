import { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Pin, PinOff, Plus, Save, Trash2, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { hapticSuccess, hapticWarning } from '../lib/native';
import {
  attachFileToNote,
  createNote,
  removeNote,
  removeNoteAttachment,
  subscribeNotes,
  updateNote,
  type Note,
} from '../services/notesService';

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type?: string) {
  return !!type && type.startsWith('image/');
}

export default function Notes() {
  const { user, profile } = useAuth();
  const { workspaceId, workspace } = useWorkspace();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeNotes(
      user.id,
      (list) => {
        setNotes(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [user]);

  const active = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [notes, activeId]);

  useEffect(() => {
    setTitle(active?.title ?? '');
    setContent(active?.content ?? '');
    setPendingFile(null);
  }, [active]);

  function startNewNote() {
    setActiveId(null);
    setTitle('');
    setContent('');
    setPendingFile(null);
  }

  async function handleSave() {
    if (!user || (!title.trim() && !content.trim() && !pendingFile)) return;
    setSaving(true);
    try {
      if (active) {
        await updateNote(active.id, { title: title.trim(), content });
        if (pendingFile) await attachFileToNote(active.id, user.id, pendingFile);
      } else {
        const created = await createNote({
          title: title.trim() || 'Tanpa judul',
          content,
          createdBy: user.id,
          createdByName: profile?.name || user.email || 'Pengguna',
          workspaceId,
          file: pendingFile ?? undefined,
        });
        setActiveId(created.id);
      }
      setPendingFile(null);
      void hapticSuccess();
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePin(note: Note) {
    await updateNote(note.id, { pinned: !note.pinned });
  }

  async function handleDelete(note: Note) {
    if (!confirm(`Hapus catatan "${note.title || 'Tanpa judul'}"?`)) return;
    void hapticWarning();
    await removeNote(note.id);
    if (activeId === note.id) startNewNote();
  }

  async function handleRemoveAttachment() {
    if (!active) return;
    await removeNoteAttachment(active.id);
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 p-4 md:flex-row md:p-6">
      <aside className="flex w-full flex-col gap-3 md:w-72 md:shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold text-slate-900">Catatan · {workspace.name}</h1>
          <button
            type="button"
            onClick={startNewNote}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white"
          >
            <Plus size={16} /> Baru
          </button>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto md:max-h-[calc(100vh-160px)]">
          {loading && <p className="text-sm text-slate-400">Memuat catatan…</p>}
          {!loading && notes.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
              Belum ada catatan. Klik "Baru" untuk mulai menulis.
            </p>
          )}
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => setActiveId(note.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                activeId === note.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {note.pinned && <Pin size={12} className="shrink-0 text-amber-500" />}
                <p className="truncate text-sm font-bold text-slate-900">{note.title || 'Tanpa judul'}</p>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{note.content || 'Tidak ada isi'}</p>
              {note.fileName && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <Paperclip size={11} /> {note.fileName}
                </p>
              )}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex flex-1 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul catatan"
            className="w-full border-none text-xl font-extrabold text-slate-900 outline-none placeholder:text-slate-300"
          />
          {active && (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTogglePin(active)}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                title={active.pinned ? 'Lepas pin' : 'Pin catatan'}
              >
                {active.pinned ? <PinOff size={17} /> : <Pin size={17} />}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(active)}
                className="grid h-9 w-9 place-items-center rounded-lg text-rose-500 hover:bg-rose-50"
                title="Hapus catatan"
              >
                <Trash2 size={17} />
              </button>
            </div>
          )}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tulis catatanmu di sini…"
          className="min-h-[240px] flex-1 resize-none border-none text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-300"
        />

        {(active?.fileUrl || pendingFile) && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            {isImage(pendingFile?.type ?? active?.fileType) ? (
              <ImageIcon size={20} className="text-slate-400" />
            ) : (
              <FileText size={20} className="text-slate-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-700">
                {pendingFile?.name ?? active?.fileName}
              </p>
              <p className="text-xs text-slate-400">
                {pendingFile ? `${formatSize(pendingFile.size)} · belum disimpan` : formatSize(active?.fileSize)}
              </p>
            </div>
            {active?.fileUrl && isImage(active.fileType) && (
              <img src={active.fileUrl} alt={active.fileName} className="h-12 w-12 rounded-lg object-cover" />
            )}
            <button
              type="button"
              onClick={() => (pendingFile ? setPendingFile(null) : handleRemoveAttachment())}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-200"
              title="Hapus lampiran"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Paperclip size={15} /> Lampirkan gambar/file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            className="hidden"
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <Save size={15} /> {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </section>
    </div>
  );
}
