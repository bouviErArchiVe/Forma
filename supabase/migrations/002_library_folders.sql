-- Dossiers d'organisation bibliothèque (distincts des shared_folders)
create table if not exists public.library_folders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '📁',
  color text not null default '#3d6b8c',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists library_folders_user_id_idx on public.library_folders(user_id);

alter table public.library_folders enable row level security;

create policy "library_folders_select_own"
  on public.library_folders for select
  using (auth.uid() = user_id);

create policy "library_folders_insert_own"
  on public.library_folders for insert
  with check (auth.uid() = user_id);

create policy "library_folders_update_own"
  on public.library_folders for update
  using (auth.uid() = user_id);

create policy "library_folders_delete_own"
  on public.library_folders for delete
  using (auth.uid() = user_id);
