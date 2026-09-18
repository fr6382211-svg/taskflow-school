-- Security hardening pass (audit findings, see AUDIT_KEAMANAN_FathurSchoolHub.md).
--
-- 1) "My Minee" gallery/storage: previously readable by ANY authenticated user
--    (any account registered on the app, not just the owner/admin). Restrict
--    both the metadata table and the storage bucket objects to admin-only.

drop policy if exists romantic_gallery_select_auth on public.romantic_gallery;
create policy romantic_gallery_select_admin
  on public.romantic_gallery for select
  to authenticated
  using (public.is_admin());

drop policy if exists my_minee_auth_read on storage.objects;
drop policy if exists my_minee_public_read on storage.objects;
create policy my_minee_admin_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'my-minee' and public.is_admin());

-- 2) Structural safety net for finding #6 in the audit: table-level GRANTs to
--    `authenticated` are broad (see 0002_default_schedule.sql) and rely
--    entirely on every current AND future table having correct RLS policies.
--    This function lets you quickly check for any public table that has RLS
--    disabled, or has RLS enabled but zero policies (which silently blocks
--    all access, including for admins) — run it after every future migration
--    that adds tables: `select * from public.rls_audit();`
create or replace function public.rls_audit()
returns table(table_name text, rls_enabled boolean, policy_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled,
    count(p.polname) as policy_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_policy p on p.polrelid = c.oid
  where n.nspname = 'public'
    and c.relkind = 'r'
    -- Its own results are sensitive (a list of security holes), so only
    -- expose them to admins even though the function is security definer.
    and public.is_admin()
  group by c.relname, c.relrowsecurity
  having c.relrowsecurity = false or count(p.polname) = 0
  order by c.relname;
$$;

grant execute on function public.rls_audit() to authenticated;

comment on function public.rls_audit() is
  'Security audit helper: lists public tables that are missing RLS or have RLS enabled with no policies. Should return zero rows in a healthy schema. Run after every migration that adds a table.';
