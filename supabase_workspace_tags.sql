-- OPTIONAL DATA CLEANUP / HARDENING
-- Existing rows without a workspace tag are treated by the app as Fathur.
-- Run only if you want the distinction persisted for every historical row.

update public.tasks
set tags = case
  when tags is null then array['workspace:fathur']::text[]
  when not ('workspace:fathur' = any(tags)) and not ('workspace:mazet' = any(tags))
    then array_append(tags, 'workspace:fathur')
  else tags
end
where not ('workspace:fathur' = any(coalesce(tags, '{}')))
  and not ('workspace:mazet' = any(coalesce(tags, '{}')));
