import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  Check,
  FileUp,
  GraduationCap,
  LoaderCircle,
  Search,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { errorMessage, makeDueAt } from '../../lib/utils';
import { createTask, updateTask } from '../../services/taskService';
import { deleteFile, uploadTaskFile } from '../../services/storageService';
import { loadSubjectsWithScheduleFallback } from '../../services/subjectService';
import { loadWorkspaceSchedule, loadWorkspaceSubjects, findNextScheduledDeadline } from '../../services/workspaceService';
import { useWorkspace } from '../../context/WorkspaceContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AITaskAssistant from './AITaskAssistant';
import type { ScheduleItem, Subject, Task } from '../../types';
import { useToast } from '../ui/Toast';

const MAX_FILE = 50 * 1024 * 1024;
const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.zip,.rar,.7z';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function niceSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TaskForm({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Task | null;
}) {
  const { user, profile } = useAuth();
  const { workspaceId, workspace } = useWorkspace();
  const { push } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [relatedSchedule, setRelatedSchedule] = useState<ScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [deadlineMode, setDeadlineMode] = useState<'auto' | 'manual'>('auto');
  const [deadlineHint, setDeadlineHint] = useState('Pilih mata pelajaran untuk menghitung deadline berikutnya.');
  const [workspaceSchedule, setWorkspaceSchedule] = useState<ScheduleItem[]>([]);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [notes, setNotes] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLocaleLowerCase('id-ID');
    if (!q) return subjects;
    return subjects.filter((item) => `${item.name} ${item.teacher || ''}`.toLocaleLowerCase('id-ID').includes(q));
  }, [subjectSearch, subjects]);

  const selectedSubject = subjects.find((item) => item.id === subjectId);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setSubjectsLoading(true);
    setSubjectsError('');
    async function loadSubjects() {
      try {
        const items = await loadWorkspaceSubjects(workspaceId);
        if (!alive) return;
        setSubjects(items);
      } catch (err: unknown) {
        if (!alive) return;
        setSubjectsError(errorMessage(err));
      } finally {
        if (alive) setSubjectsLoading(false);
      }
    }
    void loadSubjects();

    if (initial) {
      setTitle(initial.title);
      setDescription(initial.description);
      setSubjectId(initial.subjectId || '');
      setSubjectName(initial.subjectName || '');
      setTeacherName(initial.teacherName || '');
      setDueDate(initial.dueDate);
      setDueTime(initial.dueTime);
      setDeadlineMode((initial.tags || []).includes('deadline:manual') ? 'manual' : 'auto');
      setPriority(initial.priority);
      setNotes(initial.notes || '');
      setTagsText((initial.tags || []).join(', '));
      setFile(null);
      setUploadPct(0);
    } else {
      setTitle('');
      setDescription('');
      setSubjectId('');
      setSubjectName('');
      setTeacherName('');
      setDueDate('');
      setDueTime('23:59');
      setDeadlineMode('auto');
      setDeadlineHint('Pilih mata pelajaran untuk menghitung deadline berikutnya.');
      setPriority('medium');
      setNotes('');
      setTagsText('');
      setFile(null);
      setUploadPct(0);
    }
    setSubjectSearch('');
    setRelatedSchedule([]);
    setError('');
    return () => {
      alive = false;
    };
  }, [open, initial, workspaceId]);

  useEffect(() => {
    let alive = true;
    setWorkspaceSchedule([]);
    if (!selectedSubject) {
      setRelatedSchedule([]);
      setScheduleLoading(false);
      return;
    }
    setSubjectName(selectedSubject.name);
    setTeacherName(selectedSubject.teacher || '');
    setScheduleLoading(true);
    void loadWorkspaceSchedule(workspaceId)
      .then((items) => {
        if (!alive) return;
        const related = items.filter((item) => item.active && item.type === 'subject' && item.subject.trim().toLocaleLowerCase('id-ID') === selectedSubject.name.trim().toLocaleLowerCase('id-ID'));
        setWorkspaceSchedule(items);
        setRelatedSchedule(related);
        const suggestion = findNextScheduledDeadline(new Date(), items, selectedSubject.name);
        if (deadlineMode === 'auto' && suggestion) {
          setDueDate(suggestion.dueDate);
          setDueTime(suggestion.dueTime);
          setDeadlineHint(`Otomatis: ${suggestion.scheduleItem.day} ${suggestion.scheduleItem.startTime}–${suggestion.scheduleItem.endTime}. Deadline disesuaikan ke 5 menit sebelum sesi ${suggestion.scheduleItem.startTime}.`);
        } else if (deadlineMode === 'auto') {
          setDeadlineHint('Jadwal mata pelajaran belum ditemukan; deadline tetap dapat diatur manual.');
        }
      })
      .catch(() => { if (alive) setRelatedSchedule([]); })
      .finally(() => { if (alive) setScheduleLoading(false); });
    return () => { alive = false; };
  }, [selectedSubject, workspaceId, deadlineMode]);

  useEffect(() => {
    if (!selectedSubject || deadlineMode !== 'auto' || workspaceSchedule.length === 0) return;
    const suggestion = findNextScheduledDeadline(new Date(), workspaceSchedule, selectedSubject.name);
    if (!suggestion) return;
    setDueDate(suggestion.dueDate);
    setDueTime(suggestion.dueTime);
    setDeadlineHint(`Otomatis mengikuti jadwal ${workspaceId === 'mazet' ? 'Mazet' : 'Fathur'}: ${suggestion.scheduleItem.day} ${suggestion.scheduleItem.startTime}–${suggestion.scheduleItem.endTime}.`);
  }, [selectedSubject, deadlineMode, workspaceSchedule, workspaceId]);

  function validateFile(next: File) {
    if (next.size > MAX_FILE) {
      setError('Ukuran file maksimal 50 MB.');
      return false;
    }
    if (!new RegExp(`\\.(${ACCEPT.replaceAll('.', '').replaceAll(',', '|')})$`, 'i').test(next.name)) {
      setError('Format file tidak didukung. Gunakan dokumen, gambar, arsip, CSV/TXT, atau file pendukung lainnya.');
      return false;
    }
    return true;
  }

  function pickFile(next?: File | null) {
    setError('');
    if (!next) return;
    if (validateFile(next)) setFile(next);
  }

  function parseTags() {
    return [...new Set(tagsText.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean))].slice(0, 8);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setError('');

    if (title.trim().length < 3) return setError('Judul tugas minimal 3 karakter.');
    if (!subjectId || !subjectName) return setError('Pilih mata pelajaran terlebih dahulu.');
    if (!dueDate || !dueTime) return setError('Deadline wajib diisi.');

    const dueMs = new Date(`${dueDate}T${dueTime}:00+07:00`).getTime();
    if (!initial && dueMs < Date.now()) return setError('Deadline tugas baru harus berada di masa depan.');

    setLoading(true);
    try {
      let fileMeta: Record<string, unknown> = {};
      if (file) {
        setUploadPct(5);
        fileMeta = await uploadTaskFile(user.id, file, setUploadPct);
      }

      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        subjectId: subjectId.startsWith('schedule:') || subjectId.startsWith('mazet:') ? null : subjectId,
        subjectName: subjectName.trim(),
        teacherName: teacherName.trim(),
        createdBy: user.id,
        createdByName: profile.name,
        assignedTo: user.id,
        dueDate,
        dueTime,
        dueAt: makeDueAt(dueDate, dueTime),
        status: initial?.status || 'pending',
        priority,
        submissionStatus: initial?.submissionStatus || 'not_submitted',
        notes: notes.trim(),
        tags: [...parseTags(), deadlineMode === 'manual' ? 'deadline:manual' : 'deadline:auto'],
        workspaceId,
        ...fileMeta,
      };

      try {
        if (initial) await updateTask(initial.id, payload);
        else await createTask(payload);
      } catch (saveError) {
        const uploadedPath = typeof fileMeta.storagePath === 'string' ? fileMeta.storagePath : '';
        if (uploadedPath) await deleteFile('task-files', uploadedPath).catch(() => undefined);
        throw saveError;
      }

      if (initial?.storagePath && typeof fileMeta.storagePath === 'string' && fileMeta.storagePath !== initial.storagePath) {
        await deleteFile('task-files', initial.storagePath).catch(() => undefined);
      }

      push({
        tone: 'success',
        title: initial ? 'Tugas diperbarui' : 'Tugas berhasil dibuat',
        message: 'Perubahan tersimpan di Supabase dan akan tersinkron realtime.',
      });
      onSaved();
      onClose();
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      push({ tone: 'error', title: 'Gagal menyimpan tugas', message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={loading ? () => undefined : onClose} title={initial ? 'Edit Tugas' : 'Tambah Tugas'} wide>
      <form onSubmit={submit} className="space-y-5">
        {!initial && (
          <AITaskAssistant
            subjects={subjects}
            schedule={workspaceSchedule}
            onApply={(draft) => {
              if (draft.title) setTitle(draft.title);
              if (draft.description) setDescription(draft.description);
              if (draft.subjectId) setSubjectId(draft.subjectId);
              if (draft.subjectName) setSubjectName(draft.subjectName);
              if (draft.teacherName) setTeacherName(draft.teacherName);
              if (draft.priority) setPriority(draft.priority);
              if (draft.dueDate && draft.dueTime) {
                setDueDate(draft.dueDate);
                setDueTime(draft.dueTime);
                setDeadlineMode('manual');
                setDeadlineHint(
                  `AI menemukan deadline ${draft.dueDate} ${draft.dueTime} WIB berdasarkan konteks tugas. Periksa kembali sebelum menyimpan.`,
                );
              } else {
                setDeadlineMode('auto');
              }
              setNotes((value) => value || draft.notes);
            }}
          />
        )}

        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-950/70 dark:from-blue-950/40 dark:to-indigo-950/25">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <GraduationCap size={18} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-blue-950 dark:text-blue-100">Tambahkan tugas dengan konteks lengkap</p>
              <p className="mt-1 text-xs leading-5 text-blue-800/75 dark:text-blue-200/70">Mapel diambil dari Supabase. Jika tabel mapel kosong, Taskflow otomatis mengambil daftar dari jadwal sekolah.</p>
            </div>
          </div>
        </div>

        {!initial && (
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><p className="text-sm font-extrabold">Quick start</p><p className="text-xs text-slate-500">Mulai dari pola tugas yang umum.</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ['Latihan', 'Latihan ', 'latihan', 'medium'],
                ['Proyek', 'Proyek ', 'proyek,kelompok', 'high'],
                ['Ujian', 'Persiapan Ujian ', 'ujian,penting', 'urgent'],
              ].map(([label, prefix, tag, level]) => (
                <button key={label} type="button" onClick={() => { setTitle((value) => value || prefix); setTagsText((value) => value || tag.replaceAll(',', ', ')); setPriority(level as Task['priority']); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/30 dark:hover:text-blue-200">{label}</button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="label">Judul tugas</label>
          <input autoFocus className="input h-12 text-[15px] font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Contoh: Latihan Persamaan Kuadrat" required />
          <div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>Gunakan judul yang mudah dicari.</span><span>{title.length}/120</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-extrabold">Mata pelajaran</p>
              <p className="text-xs text-slate-500">Pilih dari database atau jadwal sekolah.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800">{subjects.length} tersedia</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="input pl-9" value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)} placeholder="Cari nama mapel atau guru..." />
          </div>
          {subjectsLoading ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900"><LoaderCircle size={14} className="animate-spin" /> Memuat mata pelajaran...</div>
          ) : subjectsError ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">Gagal memuat mapel: {subjectsError}</div>
          ) : filteredSubjects.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700">Mapel tidak ditemukan. Periksa data `subjects` atau `schedule` di Supabase.</div>
          ) : (
            <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredSubjects.map((subject) => {
                const selected = subject.id === subjectId;
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => { setSubjectId(subject.id); setSubjectName(subject.name); setTeacherName(subject.teacher || ''); }}
                    className={`rounded-xl border p-3 text-left transition ${selected ? 'border-blue-400 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-950/35' : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{subject.name}</div>{subject.teacher && <div className="mt-1 truncate text-[11px] text-slate-500">{subject.teacher}</div>}</div>
                      {selected && <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-white"><Check size={14}/></span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedSubject && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><CalendarClock size={14} className="text-blue-500"/> Jadwal {selectedSubject.name}</div>
              {scheduleLoading ? <div className="text-[11px] text-slate-400">Mencari jadwal...</div> : relatedSchedule.length ? <div className="flex flex-wrap gap-1.5">{relatedSchedule.map((item) => <span key={item.id} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{item.day} {item.startTime}–{item.endTime}</span>)}</div> : <div className="text-[11px] text-slate-400">Belum ada slot jadwal untuk mapel ini.</div>}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="label">Guru</span><input className="input h-11" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Otomatis dari mapel" /></label>
          <label><span className="label">Prioritas</span><select className="input h-11" value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])}><option value="low">Rendah</option><option value="medium">Sedang</option><option value="high">Tinggi</option><option value="urgent">Urgent</option></select></label>
          <div className="sm:col-span-2 rounded-2xl border border-violet-200 bg-violet-50/70 p-3 dark:border-violet-900/60 dark:bg-violet-950/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black text-violet-900 dark:text-violet-200">Smart Deadline</div><div className="mt-1 text-[11px] leading-5 text-violet-700 dark:text-violet-300">{deadlineHint}</div></div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><input type="checkbox" checked={deadlineMode === 'auto'} onChange={(e) => setDeadlineMode(e.target.checked ? 'auto' : 'manual')} /> Otomatis mengikuti jadwal</label>
            </div>
          </div>
          <label><span className="label">Tanggal deadline</span><input className="input h-11" type="date" min={!initial ? todayKey() : undefined} value={dueDate} onChange={(e) => { setDeadlineMode('manual'); setDueDate(e.target.value); }} required disabled={deadlineMode === 'auto'} /></label>
          <label><span className="label">Jam deadline</span><input className="input h-11" type="time" value={dueTime} onChange={(e) => { setDeadlineMode('manual'); setDueTime(e.target.value); }} required disabled={deadlineMode === 'auto'} /></label>
        </div>

        <div>
          <label className="label">Deskripsi</label>
          <textarea className="input min-h-28 resize-y py-3" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1200} placeholder="Apa yang harus dikerjakan? Tambahkan instruksi atau konteks penting." />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <label className="label"><Tag size={12} className="mr-1 inline"/> Tag</label>
            <input className="input" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="ujian, kelompok, penting" />
            <div className="mt-2 flex flex-wrap gap-1.5">{parseTags().map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">#{tag}</span>)}</div>
          </div>

          <div>
            <label className="label">Lampiran tugas</label>
            <button type="button" onClick={() => fileRef.current?.click()} className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-blue-700">
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-800"><UploadCloud size={18}/></div><div className="min-w-0 flex-1"><div className="text-sm font-bold text-slate-800 dark:text-slate-100">{file ? 'File siap diunggah' : 'Klik untuk memilih file'}</div><div className="mt-1 text-[11px] text-slate-500">PDF, DOC(X), PPT(X), XLS(X), JPG/PNG, ZIP • maksimal 50 MB</div></div><FileUp size={17} className="text-slate-400"/></div>
            </button>
            <input ref={fileRef} className="hidden" type="file" accept={ACCEPT} onChange={(e) => pickFile(e.target.files?.[0])} />
            {file && <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40"><FileUp size={16}/></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{file.name}</div><div className="text-[10px] text-slate-500">{niceSize(file.size)}</div></div><button type="button" onClick={() => setFile(null)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Hapus file"><Trash2 size={15}/></button></div>}
            {loading && file && <div className="mt-2"><div className="mb-1 flex justify-between text-[10px] font-bold text-slate-400"><span>Uploading...</span><span>{uploadPct}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transition-all" style={{ width: `${uploadPct}%` }} /></div></div>}
          </div>
        </div>

        <div>
          <label className="label">Catatan</label>
          <textarea className="input min-h-20 resize-y py-3" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={800} placeholder="Catatan pribadi, sumber, atau pengingat..." />
        </div>

        {error && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"><X size={16} className="mt-0.5 shrink-0" />{error}</div>}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
          <Button type="button" variant="ghost" disabled={loading} onClick={onClose}>Batal</Button>
          <Button type="submit" loading={loading} icon={<Check size={16} />}>{loading ? (file ? `Upload ${uploadPct}%` : 'Menyimpan...') : initial ? 'Simpan perubahan' : 'Buat tugas'}</Button>
        </div>
      </form>
    </Modal>
  );
}
