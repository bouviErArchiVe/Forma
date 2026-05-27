-- Sous-dossiers et métadonnées explorateur
alter table public.library_folders
  add column if not exists parent_id text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists last_opened_at timestamptz;

create index if not exists library_folders_parent_id_idx on public.library_folders(parent_id);
