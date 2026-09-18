alter table public.settings
  add column if not exists theme_mode text not null default 'system',
  add column if not exists accent_color text not null default 'blue',
  add column if not exists density text not null default 'comfortable',
  add column if not exists show_watermark boolean not null default true,
  add column if not exists week_starts_monday boolean not null default true,
  add column if not exists animations boolean not null default true,
  add column if not exists show_live_bar boolean not null default true;

alter table public.settings
  drop constraint if exists settings_theme_mode_check;
alter table public.settings
  add constraint settings_theme_mode_check
  check (theme_mode in ('system','light','dark'));

alter table public.settings
  drop constraint if exists settings_accent_color_check;
alter table public.settings
  add constraint settings_accent_color_check
  check (accent_color in ('blue','violet','cyan','emerald'));

alter table public.settings
  drop constraint if exists settings_density_check;
alter table public.settings
  add constraint settings_density_check
  check (density in ('compact','comfortable','spacious'));
