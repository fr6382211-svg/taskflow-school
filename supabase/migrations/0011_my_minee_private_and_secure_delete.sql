-- My Minee privacy + authenticated viewing.
alter table public.users add column if not exists date_of_birth date;

update storage.buckets set public = false where id = 'my-minee';

drop policy if exists my_minee_public_read on storage.objects;
drop policy if exists my_minee_auth_read on storage.objects;
create policy my_minee_auth_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'my-minee');

-- Admin-only mutation policies remain enforced by public.is_admin().
