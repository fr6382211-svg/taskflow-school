import { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  AudioLines,
  Download,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FileType,
  Heart,
  ImagePlus,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type GalleryItem = {
  id: string;
  title: string;
  storagePath: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  sourceArchive: string | null;
  previewable: boolean;
};

const BUCKET = 'my-minee';
const MAX_DIRECT_FILE_BYTES = 100 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 250 * 1024 * 1024;


function extensionOf(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

function mimeFromName(name: string): string {
  const extension = extensionOf(name);
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/x-m4v',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', flac: 'audio/flac',
    pdf: 'application/pdf', txt: 'text/plain', csv: 'text/csv',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
  };
  return map[extension] ?? 'application/octet-stream';
}

function safeSegment(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase() || 'file';
}

function safeRelativePath(value: string) {
  return value
    .split('/')
    .filter(Boolean)
    .map((segment) => safeSegment(segment))
    .join('/');
}

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

function isPreviewableImage(type: string, name: string) {
  return type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extensionOf(name));
}

function isVideo(type: string, name: string) {
  return type.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v'].includes(extensionOf(name));
}

function isAudio(type: string, name: string) {
  return type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(extensionOf(name));
}

function isPdf(type: string, name: string) {
  return type === 'application/pdf' || extensionOf(name) === 'pdf';
}

function fileTitle(name: string, index: number) {
  const base = name.replace(/\.[^.]+$/, '').trim();
  return base || `My Minee ${index + 1}`;
}

function IconForFile({ type, name, size = 22 }: { type: string; name: string; size?: number }) {
  if (isPreviewableImage(type, name)) return <FileImage size={size} />;
  if (isVideo(type, name)) return <FileVideo size={size} />;
  if (isAudio(type, name)) return <FileAudio size={size} />;
  if (type.includes('pdf') || /\.(txt|csv|docx?|rtf)$/i.test(name)) return <FileText size={size} />;
  if (/\.(xlsx?|ods)$/i.test(name)) return <FileSpreadsheet size={size} />;
  if (/\.(pptx?|odp)$/i.test(name)) return <FileType size={size} />;
  if (/\.(zip|rar|7z|tar|gz)$/i.test(name)) return <FileArchive size={size} />;
  return <FileIcon size={size} />;
}

export default function MyMinee() {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBirthDate, setDeleteBirthDate] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'document' | 'archive'>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const load = async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');

    const { data, error: queryError } = await supabase
      .from('romantic_gallery')
      .select('id,title,storage_path,caption,sort_order,created_at,original_name,file_type,file_size,source_archive,previewable')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setItems([]);
    } else {
      setItems((data ?? []).map((row) => ({
        id: String(row.id),
        title: String(row.title),
        storagePath: String(row.storage_path),
        caption: row.caption == null ? null : String(row.caption),
        sortOrder: Number(row.sort_order ?? 0),
        createdAt: String(row.created_at),
        originalName: String(row.original_name ?? row.title ?? 'file'),
        fileType: String(row.file_type ?? mimeFromName(String(row.original_name ?? row.storage_path ?? ''))),
        fileSize: Number(row.file_size ?? 0),
        sourceArchive: row.source_archive == null ? null : String(row.source_archive),
        previewable: Boolean(row.previewable ?? false),
      })));
      const rows = data ?? [];
      const signed = await Promise.all(
        rows.map(async (row) => {
          const path = String(row.storage_path);
          const { data: signedData } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
          return [String(row.id), signedData?.signedUrl ?? ''] as const;
        }),
      );
      setSignedUrls(Object.fromEntries(signed.filter(([, url]) => Boolean(url))));
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const imageCount = useMemo(
    () => items.filter((item) => isPreviewableImage(item.fileType, item.originalName)).length,
    [items],
  );

  const videoCount = useMemo(
    () => items.filter((item) => isVideo(item.fileType, item.originalName)).length,
    [items],
  );

  const totalSize = useMemo(
    () => items.reduce((sum, item) => sum + item.fileSize, 0),
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = `${item.title} ${item.originalName} ${item.fileType}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (typeFilter === 'all') return true;
      if (typeFilter === 'image') return isPreviewableImage(item.fileType, item.originalName);
      if (typeFilter === 'video') return isVideo(item.fileType, item.originalName);
      if (typeFilter === 'audio') return isAudio(item.fileType, item.originalName);
      if (typeFilter === 'archive') return /\.(zip|rar|7z|tar|gz)$/i.test(item.originalName);
      return !isPreviewableImage(item.fileType, item.originalName) && !isVideo(item.fileType, item.originalName) && !isAudio(item.fileType, item.originalName) && !/\.(zip|rar|7z|tar|gz)$/i.test(item.originalName);
    });
  }, [items, query, typeFilter]);

  const uploadSingleFile = async (
    file: File,
    sortOrder: number,
    archiveName: string | null,
    displayName = file.name,
  ) => {
    if (!user?.id) throw new Error('Sesi admin tidak tersedia.');

    if (file.size > MAX_DIRECT_FILE_BYTES) {
      throw new Error(`File ${displayName} melebihi batas 100 MB.`);
    }

    const mime = file.type || mimeFromName(displayName);
    const relativeName = safeRelativePath(displayName);
    const path = `${user.id}/${crypto.randomUUID()}-${relativeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        upsert: false,
        cacheControl: '3600',
        contentType: mime,
      });

    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase
      .from('romantic_gallery')
      .insert({
        title: fileTitle(displayName, sortOrder),
        storage_path: path,
        caption: 'My Minee',
        sort_order: sortOrder,
        created_by: user.id,
        original_name: displayName,
        file_type: mime,
        file_size: file.size,
        source_archive: archiveName,
        previewable: isPreviewableImage(mime, displayName) || isVideo(mime, displayName) || isAudio(mime, displayName) || isPdf(mime, displayName),
      });

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw insertError;
    }
  };

  const expandInputFiles = async (files: FileList | File[]) => {
    const result: Array<{ file: globalThis.File; archiveName: string | null; displayName: string }> = [];

    for (const file of Array.from(files)) {
      const lower = file.name.toLowerCase();
      const isZip = lower.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';

      if (!isZip) {
        result.push({ file, archiveName: null, displayName: file.name });
        continue;
      }

      if (file.size > MAX_ARCHIVE_BYTES) {
        throw new Error(`Arsip ${file.name} melebihi batas 250 MB.`);
      }

      setUploadProgress(`Membaca arsip ${file.name}…`);
      const zip = await JSZip.loadAsync(file);
      const entries: Array<{ name: string; entry: JSZip.JSZipObject }> = [];

      zip.forEach((relativePath, entry) => {
        if (!entry.dir) entries.push({ name: relativePath, entry });
      });

      if (!entries.length) {
        throw new Error(`Arsip ${file.name} tidak berisi file.`);
      }

      for (const item of entries) {
        const blob = await item.entry.async('blob');
        const type = mimeFromName(item.name);
        const baseName = item.name.split('/').pop() || item.name;
        const child = new globalThis.File([blob], baseName, { type });
        result.push({
          file: child,
          archiveName: file.name,
          displayName: item.name,
        });
      }
    }

    return result;
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!user || !isAdmin) return;

    setUploading(true);
    setError('');

    try {
      const expanded = await expandInputFiles(files);
      if (!expanded.length) {
        throw new Error('Tidak ada file yang dipilih.');
      }

      let nextOrder = items.length;
      for (let index = 0; index < expanded.length; index += 1) {
        const payload = expanded[index];
        setUploadProgress(`Mengunggah ${index + 1}/${expanded.length}: ${payload.displayName}`);
        await uploadSingleFile(payload.file, nextOrder, payload.archiveName, payload.displayName);
        nextOrder += 1;
      }

      await load(true);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : String(uploadError));
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeItem = (item: GalleryItem) => {
    if (!user || !isAdmin) return;
    setDeleteTarget(item);
    setDeletePassword('');
    setDeleteBirthDate('');
    setError('');
  };

  const confirmRemoveItem = async () => {
    if (!deleteTarget || !user?.id || !isAdmin) return;

    if (!deletePassword) {
      setError('Masukkan password akun admin untuk menghapus file.');
      return;
    }

    if (deleteBirthDate !== '2005-06-30') {
      setError('Tanggal lahir konfirmasi tidak sesuai. Gunakan 30 Juni 2005.');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const email = user.email;
      if (!email) throw new Error('Email akun admin tidak tersedia.');

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: deletePassword,
      });

      if (reauthError) throw new Error('Password admin salah atau sesi tidak dapat diverifikasi.');

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([deleteTarget.storagePath]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from('romantic_gallery')
        .delete()
        .eq('id', deleteTarget.id);

      if (deleteError) throw deleteError;

      setSelected(null);
      setDeleteTarget(null);
      setDeletePassword('');
      setDeleteBirthDate('');
      await load(true);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : String(deleteError));
    } finally {
      setDeleting(false);
    }
  };

  const download = async (item: GalleryItem) => {
    if (!isAdmin) return;

    let url = signedUrls[item.id];
    if (!url) {
      const { data, error: signedError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(item.storagePath, 300);
      if (signedError || !data?.signedUrl) {
        setError(signedError?.message ?? 'File tidak dapat dibuka.');
        return;
      }
      url = data.signedUrl;
      setSignedUrls((current) => ({ ...current, [item.id]: url }));
    }

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = item.originalName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const selectedUrl = selected ? signedUrls[selected.id] ?? '' : '';

  return (
    <div className="my-minee-page space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-rose-200/70 bg-gradient-to-br from-rose-50 via-white to-fuchsia-50 p-6 shadow-[0_24px_70px_rgba(244,63,94,.10)] dark:border-rose-900/40 dark:from-rose-950/50 dark:via-slate-950 dark:to-fuchsia-950/35">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-rose-300/25 blur-3xl dark:bg-rose-500/10" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-fuchsia-300/20 blur-3xl dark:bg-fuchsia-500/10" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <Heart size={13} fill="currentColor" /> My Minee
            </div>
            <h1 className="text-3xl font-black tracking-tight text-rose-950 dark:text-rose-50 md:text-4xl">
              A little place for everything you want to keep.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-rose-900/70 dark:text-rose-100/65">
              Asset library romantis untuk foto, video, audio, dokumen, arsip, dan file lainnya. File disimpan di backend storage, bukan dibundel ke aplikasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-rose-200 bg-white/75 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
              {items.length} files
            </span>
            <span className="rounded-full border border-rose-200 bg-white/75 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
              {imageCount} images • {videoCount} videos
            </span>
            <span className="rounded-full border border-rose-200 bg-white/75 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
              {formatBytes(totalSize)}
            </span>
            <Button type="button" variant="secondary" onClick={() => void load(true)} disabled={refreshing}>
              {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Refresh
            </Button>
            {isAdmin && (
              <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                Upload File / ZIP
              </Button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="*/*,.zip"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) void uploadFiles(event.target.files);
              }}
            />
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-xl border border-rose-200 bg-white/80 pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-rose-400 dark:border-rose-900/50 dark:bg-slate-950/50"
              placeholder="Cari file..."
            />
          </label>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            className="h-11 rounded-xl border border-rose-200 bg-white/80 px-3 text-sm font-bold text-rose-700 outline-none dark:border-rose-900/50 dark:bg-slate-950/50 dark:text-rose-200"
          >
            <option value="all">Semua file</option>
            <option value="image">Gambar</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="document">Dokumen</option>
            <option value="archive">Arsip</option>
          </select>
          <div className="flex h-11 items-center rounded-xl border border-rose-200 bg-white/60 px-3 text-xs font-bold text-rose-600 dark:border-rose-900/50 dark:bg-slate-950/40 dark:text-rose-300">
            {filteredItems.length} / {items.length} ditampilkan
          </div>
        </div>

        {uploading && uploadProgress && (
          <div className="relative mt-5 rounded-2xl border border-rose-200 bg-white/70 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-slate-950/50 dark:text-rose-200">
            {uploadProgress}
          </div>
        )}
      </section>

      {error && (
        <Card className="border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
          <div className="flex items-start gap-3 text-sm text-rose-700 dark:text-rose-200">
            <LockKeyhole size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">{error}</div>
            <button type="button" onClick={() => setError('')} aria-label="Tutup error"><X size={16} /></button>
          </div>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="aspect-[4/5] animate-pulse rounded-[24px] border border-rose-100 bg-rose-50 dark:border-rose-950/40 dark:bg-slate-900" />
        ))}

        {!loading && filteredItems.map((item) => {
          const image = isPreviewableImage(item.fileType, item.originalName);
          const video = isVideo(item.fileType, item.originalName);
          const audio = isAudio(item.fileType, item.originalName);
          return (
            <article
              key={item.id}
              className="group overflow-hidden rounded-[24px] border border-rose-100/90 bg-white shadow-[0_16px_45px_rgba(244,63,94,.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(244,63,94,.16)] dark:border-rose-950/60 dark:bg-slate-900"
            >
              <button type="button" className="block w-full text-left" onClick={() => setSelected(item)}>
                <div className="relative aspect-[4/5] overflow-hidden bg-rose-50 dark:bg-slate-800">
                  {image ? (
                    <img draggable={false} onContextMenu={(event) => event.preventDefault()} src={signedUrls[item.id] ?? ''} alt={item.originalName} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  ) : video ? (
                    <div className="flex h-full items-center justify-center bg-slate-950 text-white">
                      <Video size={46} />
                      <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold">VIDEO</span>
                    </div>
                  ) : audio ? (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-fuchsia-100 to-rose-100 text-rose-600 dark:from-fuchsia-950/40 dark:to-rose-950/30 dark:text-rose-200">
                      <AudioLines size={48} />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 bg-white px-5 text-center text-rose-600 dark:bg-slate-900 dark:text-rose-200">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 dark:bg-rose-950/30">
                        <IconForFile type={item.fileType} name={item.originalName} size={30} />
                      </div>
                      <span className="line-clamp-3 text-xs font-bold">{item.originalName}</span>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 pt-16">
                    <div className="flex items-end justify-between gap-2 text-white">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-black">{item.title}</h2>
                        <p className="mt-1 truncate text-[11px] text-white/80">{item.originalName}</p>
                      </div>
                      <Heart size={17} fill="currentColor" className="shrink-0 text-rose-200" />
                    </div>
                  </div>
                </div>
              </button>

              <div className="flex items-center justify-between gap-2 border-t border-rose-100 px-3 py-2 dark:border-rose-950/60">
                <span className="truncate text-[10px] font-semibold text-slate-500">{formatBytes(item.fileSize)} • {item.fileType || 'file'}</span>
                <div className="flex shrink-0 items-center gap-1">
                  {isAdmin && (
                    <button type="button" onClick={() => void download(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Download file">
                      <Download size={13} />
                    </button>
                  )}
                  {isAdmin && (
                    <button type="button" onClick={() => void removeItem(item)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" aria-label="Hapus file">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && items.length === 0 && (
        <Card className="p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-300">
            <ImagePlus size={24} />
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-white">Belum ada file</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {isAdmin ? 'Pilih file apa pun atau ZIP. Isi ZIP akan dibaca dan diunggah sebagai file terpisah ke backend.' : 'Library belum berisi file yang tersedia untuk akun ini.'}
          </p>
        </Card>
      )}

      <div className="flex items-center justify-center gap-2 pb-4 text-xs font-semibold text-rose-500/80 dark:text-rose-200/60">
        <Sparkles size={13} />
        My Minee
        <Heart size={13} fill="currentColor" />
      </div>

      {deleteTarget && isAdmin && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-[28px] border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900/50 dark:bg-slate-950">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                <Trash2 size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Konfirmasi hapus file</h2>
                <p className="mt-1 break-words text-xs leading-5 text-slate-500">{deleteTarget.originalName}</p>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Tutup"><X size={17} /></button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Password admin
                <input
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  className="input mt-2 h-11 w-full px-3"
                  placeholder="Masukkan password akun"
                />
              </label>

              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                Tanggal lahir konfirmasi
                <input
                  type="date"
                  value={deleteBirthDate}
                  onChange={(event) => setDeleteBirthDate(event.target.value)}
                  className="input mt-2 h-11 w-full px-3"
                />
              </label>

              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                Penghapusan akan menghapus file dari Storage dan metadata dari database.
              </p>

              <div className="flex gap-2">
                <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">Batal</button>
                <button type="button" onClick={() => void confirmRemoveItem()} disabled={deleting || !deletePassword || !deleteBirthDate} className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {deleting ? 'Memverifikasi…' : 'Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/75 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-rose-200 bg-white shadow-2xl dark:border-rose-900/50 dark:bg-slate-950 md:flex-row">
            <button type="button" onClick={() => setSelected(null)} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/60" aria-label="Tutup preview">
              <X size={19} />
            </button>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 p-3">
              {isPreviewableImage(selected.fileType, selected.originalName) && selectedUrl ? (
                <img src={selectedUrl} alt={selected.originalName} draggable={false} onContextMenu={(event) => event.preventDefault()} className="max-h-[78vh] w-full select-none object-contain md:max-h-[92vh]" />
              ) : isVideo(selected.fileType, selected.originalName) ? (
                <video controls={isAdmin} controlsList={isAdmin ? undefined : 'nodownload noplaybackrate'} disablePictureInPicture={!isAdmin} className="max-h-[78vh] max-w-full md:max-h-[92vh]" src={selectedUrl} onContextMenu={(event) => { if (!isAdmin) event.preventDefault(); }} />
              ) : isAudio(selected.fileType, selected.originalName) ? (
                <div className="w-full max-w-xl rounded-3xl bg-white/5 p-8 text-center text-white">
                  <AudioLines size={56} className="mx-auto mb-5 text-rose-300" />
                  <div className="truncate text-lg font-black">{selected.originalName}</div>
                  <audio controls={isAdmin} className="mt-6 w-full" src={selectedUrl} onContextMenu={(event) => { if (!isAdmin) event.preventDefault(); }} />
                </div>
              ) : isPdf(selected.fileType, selected.originalName) && isAdmin ? (
                <iframe title={selected.originalName} src={selectedUrl} className="h-[78vh] w-full bg-white md:h-[92vh]" />
              ) : (
                <div className="w-full max-w-xl rounded-3xl bg-white/5 p-10 text-center text-white">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-rose-500/15 text-rose-200">
                    <IconForFile type={selected.fileType} name={selected.originalName} size={36} />
                  </div>
                  <h2 className="mt-5 break-words text-xl font-black">{selected.originalName}</h2>
                  <p className="mt-2 text-sm text-white/60">Preview terbatas untuk tipe file ini. Akses download dan tindakan lain hanya tersedia untuk admin.</p>
                  {isAdmin && (
                    <button type="button" onClick={() => void download(selected)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-900">
                      <Download size={16} /> Download / Open
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="w-full shrink-0 border-t border-rose-100 p-5 dark:border-rose-950/60 md:w-[340px] md:border-l md:border-t-0">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500">My Minee</div>
              <h2 className="mt-2 break-words text-xl font-black text-slate-900 dark:text-white">{selected.title}</h2>
              <p className="mt-3 break-words text-sm leading-6 text-slate-500 dark:text-slate-400">{selected.originalName}</p>
              <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                <div>Type: {selected.fileType || 'file'}</div>
                <div>Size: {formatBytes(selected.fileSize)}</div>
                {selected.sourceArchive ? <div>From ZIP: {selected.sourceArchive}</div> : null}
              </div>
              {isAdmin && (
                <button type="button" onClick={() => void download(selected)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white hover:bg-rose-700">
                  <Download size={16} /> Download / Open
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
