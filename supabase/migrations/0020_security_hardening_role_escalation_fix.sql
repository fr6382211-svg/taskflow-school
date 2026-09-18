-- SECURITY HARDENING PATCH
-- =========================================================================
-- CRITICAL FIX: privilege escalation via public.users self-update policy.
--
-- The existing policy `users_self_update` (0001_taskflow.sql) allows any
-- authenticated user to update their OWN row:
--
--   using (id = auth.uid() or public.is_admin())
--   with check (id = auth.uid() or public.is_admin())
--
-- The WITH CHECK clause only verifies row ownership, not which columns are
-- being changed. Because `role` and `status` live on the same row, any
-- logged-in user could previously run:
--
--   supabase.from('users').update({ role: 'admin', status: 'active' }).eq('id', myId)
--
-- ...and grant themselves admin privileges. This migration closes that hole
-- with a BEFORE UPDATE trigger that blocks changes to `role`/`status`
-- unless the actor is already an admin, or the request comes from a
-- service-role context (edge functions, cron jobs) where auth.uid() is null.
-- Idempotent: safe to run multiple times.
-- =========================================================================

create or replace function public.guard_users_role_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role / internal calls (edge functions using SUPABASE_SERVICE_ROLE_KEY)
  -- run outside a user JWT context, so auth.uid() is null. Those are trusted
  -- server-side callers (see supabase/functions/admin-users) and already
  -- perform their own role checks before calling the database.
  if auth.uid() is null then
    return new;
  end if;

  -- No-op if role/status are unchanged.
  if new.role is not distinct from old.role and new.status is not distinct from old.status then
    return new;
  end if;

  -- Only an existing active admin may change role/status on any row,
  -- including their own (prevents self-escalation AND accidental/malicious
  -- self-demotion by a compromised admin session being used as a decoy).
  if not public.is_admin() then
    raise exception 'Anda tidak memiliki izin untuk mengubah role atau status akun.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_users_role_status on public.users;
create trigger trg_guard_users_role_status
  before update on public.users
  for each row
  execute function public.guard_users_role_status();

-- Defense in depth: also tighten the RLS WITH CHECK so a non-admin's update
-- request is rejected by Postgres row security even before the trigger runs
-- if role/status differ from the stored row.
drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update
  using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (
      id = auth.uid()
      and role = (select u.role from public.users u where u.id = auth.uid())
      and status = (select u.status from public.users u where u.id = auth.uid())
    )
  );

-- Audit trail: log every successful role/status change so admin actions are
-- traceable (uses the existing audit_logs table from 0001_taskflow.sql).
create or replace function public.log_users_role_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role or new.status is distinct from old.status then
    insert into public.audit_logs (user_id, action, metadata)
    values (
      coalesce(auth.uid(), new.id),
      'user_role_status_changed',
      jsonb_build_object(
        'target_user', new.id,
        'old_role', old.role, 'new_role', new.role,
        'old_status', old.status, 'new_status', new.status
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_users_role_status_change on public.users;
create trigger trg_log_users_role_status_change
  after update on public.users
  for each row
  execute function public.log_users_role_status_change();
