-- v4.3 retention / indexes for production activity tracking.
create index if not exists login_activity_user_event_created_idx
  on public.login_activity(user_id, event_type, created_at desc);

create index if not exists daily_email_digest_log_user_date_idx
  on public.daily_email_digest_log(user_id, digest_date desc);

-- Keep the append-only activity ledger bounded. Adjust to your retention policy if needed.
delete from public.login_activity
where created_at < now() - interval '180 days';
