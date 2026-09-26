-- My Minee romantic gallery.
-- Images themselves are intentionally NOT stored in the application source.
-- Upload image files to the Supabase Storage bucket `my-minee`; this table stores metadata/path only.
create table if not exists public.romantic_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists romantic_gallery_sort_idx
  on public.romantic_gallery(sort_order, created_at);

alter table public.romantic_gallery enable row level security;

drop policy if exists romantic_gallery_select_auth on public.romantic_gallery;
create policy romantic_gallery_select_auth
  on public.romantic_gallery for select
  to authenticated
  using (true);

drop policy if exists romantic_gallery_insert_admin on public.romantic_gallery;
create policy romantic_gallery_insert_admin
  on public.romantic_gallery for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists romantic_gallery_update_admin on public.romantic_gallery;
create policy romantic_gallery_update_admin
  on public.romantic_gallery for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists romantic_gallery_delete_admin on public.romantic_gallery;
create policy romantic_gallery_delete_admin
  on public.romantic_gallery for delete
  to authenticated
  using (public.is_admin());

grant select on public.romantic_gallery to authenticated;
grant insert, update, delete on public.romantic_gallery to authenticated;

insert into public.romantic_gallery (title, storage_path, caption, sort_order)
select v.title, v.storage_path, v.caption, v.sort_order
from (values
  ('WhatsApp Image 2026-09-06 at 08.01.15.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.15.jpeg', 'My Minee', 0),
  ('WhatsApp Image 2026-09-06 at 08.01.12 (1).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.12 (1).jpeg', 'My Minee', 1),
  ('WhatsApp Image 2026-09-06 at 08.01.11.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.11.jpeg', 'My Minee', 2),
  ('WhatsApp Image 2026-09-06 at 08.01.12.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.12.jpeg', 'My Minee', 3),
  ('WhatsApp Image 2026-09-06 at 08.01.15 (2).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.15 (2).jpeg', 'My Minee', 4),
  ('WhatsApp Image 2026-09-06 at 08.01.16.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.16.jpeg', 'My Minee', 5),
  ('WhatsApp Image 2026-09-06 at 08.01.14 (1).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.14 (1).jpeg', 'My Minee', 6),
  ('WhatsApp Image 2026-09-06 at 08.01.15 (1).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.15 (1).jpeg', 'My Minee', 7),
  ('WhatsApp Image 2026-09-06 at 08.01.00.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.00.jpeg', 'My Minee', 8),
  ('WhatsApp Image 2026-09-06 at 08.01.13.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.13.jpeg', 'My Minee', 9),
  ('WhatsApp Image 2026-09-06 at 08.01.13 (1).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.13 (1).jpeg', 'My Minee', 10),
  ('WhatsApp Image 2026-09-06 at 08.01.18 (1).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.18 (1).jpeg', 'My Minee', 11),
  ('WhatsApp Image 2026-09-06 at 08.01.18.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.18.jpeg', 'My Minee', 12),
  ('WhatsApp Image 2026-09-06 at 08.01.14 (2).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.14 (2).jpeg', 'My Minee', 13),
  ('WhatsApp Image 2026-09-06 at 08.01.14.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.14.jpeg', 'My Minee', 14),
  ('WhatsApp Image 2026-09-06 at 08.01.20 (1).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.20 (1).jpeg', 'My Minee', 15),
  ('WhatsApp Image 2026-09-06 at 08.01.19.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.19.jpeg', 'My Minee', 16),
  ('WhatsApp Image 2026-09-06 at 08.01.07.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.07.jpeg', 'My Minee', 17),
  ('WhatsApp Image 2026-09-06 at 08.01.21.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.21.jpeg', 'My Minee', 18),
  ('WhatsApp Image 2026-09-06 at 08.01.05.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.05.jpeg', 'My Minee', 19),
  ('WhatsApp Image 2026-09-06 at 08.01.16 (1).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.16 (1).jpeg', 'My Minee', 20),
  ('WhatsApp Image 2026-09-06 at 08.01.17 (2).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.17 (2).jpeg', 'My Minee', 21),
  ('WhatsApp Image 2026-09-06 at 08.01.17 (6).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.17 (6).jpeg', 'My Minee', 22),
  ('WhatsApp Image 2026-09-06 at 08.01.20.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.20.jpeg', 'My Minee', 23),
  ('WhatsApp Image 2026-09-06 at 08.01.18 (2).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.18 (2).jpeg', 'My Minee', 24),
  ('WhatsApp Image 2026-09-06 at 08.01.17 (1).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.17 (1).jpeg', 'My Minee', 25),
  ('WhatsApp Image 2026-09-06 at 08.01.17 (5).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.17 (5).jpeg', 'My Minee', 26),
  ('WhatsApp Image 2026-09-06 at 08.01.19 (1).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.19 (1).jpeg', 'My Minee', 27),
  ('WhatsApp Image 2026-09-06 at 08.01.17 (3).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.17 (3).jpeg', 'My Minee', 28),
  ('WhatsApp Image 2026-09-06 at 08.01.17 (4).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.17 (4).jpeg', 'My Minee', 29),
  ('WhatsApp Image 2026-09-06 at 08.01.17.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.17.jpeg', 'My Minee', 30),
  ('WhatsApp Image 2026-09-06 at 08.01.06 (1).jpeg', 'WhatsApp Image 2026-09-06 at 08.01.06 (1).jpeg', 'My Minee', 31),
  ('WhatsApp Image 2026-09-06 at 08.01.02.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.02.jpeg', 'My Minee', 32),
  ('WhatsApp Image 2026-09-06 at 08.01.08.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.08.jpeg', 'My Minee', 33),
  ('WhatsApp Image 2026-09-06 at 08.01.06.jpeg', 'WhatsApp Image 2026-09-06 at 08.01.06.jpeg', 'My Minee', 34),
  ('WhatsApp Image 2026-08-22 at 14.44.58 (1).jpeg', 'WhatsApp Image 2026-08-22 at 14.44.58 (1).jpeg', 'My Minee', 35),
  ('WhatsApp Image 2026-08-22 at 14.44.58.jpeg', 'WhatsApp Image 2026-08-22 at 14.44.58.jpeg', 'My Minee', 36),
  ('WhatsApp Image 2026-08-22 at 14.44.59 (1).jpeg', 'WhatsApp Image 2026-08-22 at 14.44.59 (1).jpeg', 'My Minee', 37),
  ('WhatsApp Image 2026-08-22 at 14.44.59.jpeg', 'WhatsApp Image 2026-08-22 at 14.44.59.jpeg', 'My Minee', 38),
  ('WhatsApp Image 2026-08-22 at 14.45.00 (1).jpeg', 'WhatsApp Image 2026-08-22 at 14.45.00 (1).jpeg', 'My Minee', 39),
  ('WhatsApp Image 2026-08-22 at 14.45.00 (2).jpeg', 'WhatsApp Image 2026-08-22 at 14.45.00 (2).jpeg', 'My Minee', 40),
  ('WhatsApp Image 2026-08-22 at 14.45.00.jpeg', 'WhatsApp Image 2026-08-22 at 14.45.00.jpeg', 'My Minee', 41),
  ('WhatsApp Image 2026-08-22 at 14.45.01 (1).jpeg', 'WhatsApp Image 2026-08-22 at 14.45.01 (1).jpeg', 'My Minee', 42),
  ('WhatsApp Image 2026-08-22 at 14.45.01.jpeg', 'WhatsApp Image 2026-08-22 at 14.45.01.jpeg', 'My Minee', 43),
  ('WhatsApp Image 2026-08-22 at 14.45.02.jpeg', 'WhatsApp Image 2026-08-22 at 14.45.02.jpeg', 'My Minee', 44),
  ('WhatsApp Image 2026-08-22 at 14.45.06.jpeg', 'WhatsApp Image 2026-08-22 at 14.45.06.jpeg', 'My Minee', 45)
 ) as v(title, storage_path, caption, sort_order)
where not exists (
  select 1 from public.romantic_gallery g where g.storage_path = v.storage_path
);

-- Storage bucket. Actual files must be uploaded there, not committed into the repository.
insert into storage.buckets (id, name, public)
values ('my-minee', 'my-minee', true)
on conflict (id) do nothing;

drop policy if exists my_minee_public_read on storage.objects;
create policy my_minee_public_read
  on storage.objects for select
  to public
  using (bucket_id = 'my-minee');

drop policy if exists my_minee_admin_insert on storage.objects;
create policy my_minee_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'my-minee' and public.is_admin());

drop policy if exists my_minee_admin_update on storage.objects;
create policy my_minee_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'my-minee' and public.is_admin())
  with check (bucket_id = 'my-minee' and public.is_admin());

drop policy if exists my_minee_admin_delete on storage.objects;
create policy my_minee_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'my-minee' and public.is_admin());
