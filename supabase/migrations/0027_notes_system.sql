-- Notes system: free-form notes with optional image/file attachment,
-- scoped per-workspace via tags (same pattern as tasks: 'workspace:fathur' / 'workspace:mazet').
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content text not null default '',
  created_by uuid not null references public.users(id) on delete cascade,
  created_by_name text not null default '',
  file_url text,
  file_name text,
  file_type text,
  file_size bigint,
  storage_path text,
  pinned boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_created_by_idx on public.notes(created_by);
create index notes_tags_idx on public.notes using gin(tags);

create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

alter table public.notes enable row level security;

-- Owner (or admin) can read/write their own notes. Sharing across Fathur <-> Mazet
-- is NOT enabled by default (unlike tasks) — notes are private per account.
create policy notes_select on public.notes for select to authenticated
  using (public.is_admin() or created_by = auth.uid());
create policy notes_insert on public.notes for insert to authenticated
  with check (created_by = auth.uid());
create policy notes_update on public.notes for update to authenticated
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());
create policy notes_delete on public.notes for delete to authenticated
  using (public.is_admin() or created_by = auth.uid());

insert into storage.buckets(id,name,public) values('note-files','note-files',false) on conflict(id) do nothing;
create policy storage_note_read on storage.objects for select to authenticated
  using(bucket_id='note-files' and (public.is_admin() or (storage.foldername(name))[1]=auth.uid()::text));
create policy storage_note_insert on storage.objects for insert to authenticated
  with check(bucket_id='note-files' and (storage.foldername(name))[1]=auth.uid()::text);
create policy storage_note_update on storage.objects for update to authenticated
  using(bucket_id='note-files' and (storage.foldername(name))[1]=auth.uid()::text)
  with check(bucket_id='note-files' and (storage.foldername(name))[1]=auth.uid()::text);
create policy storage_note_delete on storage.objects for delete to authenticated
  using(bucket_id='note-files' and (public.is_admin() or (storage.foldername(name))[1]=auth.uid()::text));
