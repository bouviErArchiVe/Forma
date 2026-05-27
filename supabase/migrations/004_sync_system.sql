-- FormaSync — snapshots cloud et extension partage
-- Exécuter dans Supabase SQL Editor

-- Snapshots cloud pour restauration de versions
create table if not exists public.resource_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_type text not null,
  resource_id text not null,
  label text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resource_snapshots_user_resource_idx
  on public.resource_snapshots (user_id, resource_type, resource_id, created_at desc);

alter table public.resource_snapshots enable row level security;

create policy "snapshots_select_own"
  on public.resource_snapshots for select
  using (auth.uid() = user_id);

create policy "snapshots_insert_own"
  on public.resource_snapshots for insert
  with check (auth.uid() = user_id);

create policy "snapshots_delete_own"
  on public.resource_snapshots for delete
  using (auth.uid() = user_id);

-- Étendre les types de ressources partageables
alter table public.shared_projects drop constraint if exists shared_projects_resource_type_check;
alter table public.shared_projects add constraint shared_projects_resource_type_check
  check (resource_type in (
    'notebook', 'moodboard', 'folder',
    'proforma', 'doc', 'sheet', 'combine', 'review', 'present', 'formatcal'
  ));
