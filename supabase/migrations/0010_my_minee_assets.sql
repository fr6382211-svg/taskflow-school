-- Expand My Minee from image-only gallery to a general asset library.
-- Files are stored in Supabase Storage; this table stores metadata only.
alter table public.romantic_gallery
  add column if not exists original_name text,
  add column if not exists file_type text,
  add column if not exists file_size bigint,
  add column if not exists source_archive text,
  add column if not exists previewable boolean not null default false;

create index if not exists romantic_gallery_created_by_idx
  on public.romantic_gallery(created_by, created_at desc);

create index if not exists romantic_gallery_file_type_idx
  on public.romantic_gallery(file_type);

-- Existing rows remain valid. The application derives a best-effort type from
-- the storage path when file_type is null.
