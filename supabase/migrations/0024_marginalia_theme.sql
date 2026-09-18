-- 0024_marginalia_theme.sql
-- Switches settings.accent_color from the old blue/violet/cyan/emerald
-- palette to the Marginalia design system's palette: redpen (default),
-- ledger, ochre, forest.
--
-- Existing rows are remapped to the closest Marginalia equivalent so no
-- user sees an unstyled/invalid accent after this ships:
--   blue    -> ledger  (both are the "cool blue" option)
--   cyan    -> ledger  (closest cool tone in the new set)
--   violet  -> forest  (closest "deep, muted" tone in the new set)
--   emerald -> forest  (both green-family)
-- Anything else (including nulls) falls back to the new default, redpen.

begin;

alter table public.settings drop constraint if exists settings_accent_color_check;

update public.settings
set accent_color = case accent_color
  when 'blue' then 'ledger'
  when 'cyan' then 'ledger'
  when 'violet' then 'forest'
  when 'emerald' then 'forest'
  when 'redpen' then 'redpen'
  when 'ledger' then 'ledger'
  when 'ochre' then 'ochre'
  when 'forest' then 'forest'
  else 'redpen'
end;

alter table public.settings
  alter column accent_color set default 'redpen';

alter table public.settings
  add constraint settings_accent_color_check
  check (accent_color in ('redpen', 'ledger', 'ochre', 'forest'));

commit;
