-- Forma — Compte, amis, partage collaboratif
-- Exécuter dans Supabase SQL Editor (Dashboard → SQL → New query)

-- ─── Profiles ───────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  phone text,
  language text not null default 'fr',
  notification_prefs jsonb not null default '{"email":true,"in_app":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ─── Friend requests ────────────────────────────────────────
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_user_id, to_user_id)
);

alter table public.friend_requests enable row level security;

create policy "friend_requests_select_involved"
  on public.friend_requests for select
  using (auth.uid() in (from_user_id, to_user_id));

create policy "friend_requests_insert_sender"
  on public.friend_requests for insert
  with check (auth.uid() = from_user_id and from_user_id <> to_user_id);

create policy "friend_requests_update_recipient"
  on public.friend_requests for update
  using (auth.uid() = to_user_id or auth.uid() = from_user_id);

-- ─── Friends ────────────────────────────────────────────────
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friends enable row level security;

create policy "friends_select_own"
  on public.friends for select
  using (auth.uid() in (user_id, friend_id));

create policy "friends_insert_own"
  on public.friends for insert
  with check (auth.uid() = user_id);

create policy "friends_delete_own"
  on public.friends for delete
  using (auth.uid() in (user_id, friend_id));

-- Profiles visibles aux amis et demandes en cours
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_visible"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.friends f
      where (f.user_id = auth.uid() and f.friend_id = profiles.id)
         or (f.friend_id = auth.uid() and f.user_id = profiles.id)
    )
    or exists (
      select 1 from public.friend_requests fr
      where fr.status = 'pending'
        and (fr.from_user_id = auth.uid() or fr.to_user_id = auth.uid())
        and (fr.from_user_id = profiles.id or fr.to_user_id = profiles.id)
    )
  );

-- ─── Shared projects (carnets, moodboards, dossiers locaux) ─
create table if not exists public.shared_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  resource_type text not null check (resource_type in ('notebook', 'moodboard', 'folder')),
  resource_id text not null,
  resource_title text not null default '',
  shared_with_user_id uuid references public.profiles(id) on delete cascade,
  permission text not null default 'read' check (permission in ('read', 'comment', 'edit', 'owner')),
  share_token text unique,
  is_public_link boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shared_projects_resource on public.shared_projects(resource_type, resource_id);
create index if not exists idx_shared_projects_token on public.shared_projects(share_token);

alter table public.shared_projects enable row level security;

create policy "shared_projects_select_involved"
  on public.shared_projects for select
  using (
    auth.uid() = owner_id
    or auth.uid() = shared_with_user_id
    or (is_public_link = true and share_token is not null)
  );

create policy "shared_projects_insert_owner"
  on public.shared_projects for insert
  with check (auth.uid() = owner_id);

create policy "shared_projects_update_owner"
  on public.shared_projects for update
  using (auth.uid() = owner_id);

create policy "shared_projects_delete_owner"
  on public.shared_projects for delete
  using (auth.uid() = owner_id);

-- ─── Project permissions (granular, future realtime) ─────────
create table if not exists public.project_permissions (
  id uuid primary key default gen_random_uuid(),
  shared_project_id uuid not null references public.shared_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission text not null default 'read' check (permission in ('read', 'comment', 'edit', 'owner')),
  created_at timestamptz not null default now(),
  unique (shared_project_id, user_id)
);

alter table public.project_permissions enable row level security;

create policy "project_permissions_select_involved"
  on public.project_permissions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.shared_projects sp
      where sp.id = shared_project_id and sp.owner_id = auth.uid()
    )
  );

create policy "project_permissions_manage_owner"
  on public.project_permissions for all
  using (
    exists (
      select 1 from public.shared_projects sp
      where sp.id = shared_project_id and sp.owner_id = auth.uid()
    )
  );

-- ─── Shared folders ─────────────────────────────────────────
create table if not exists public.shared_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shared_folders enable row level security;

create policy "shared_folders_select_member"
  on public.shared_folders for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.shared_folder_members m
      where m.folder_id = shared_folders.id and m.user_id = auth.uid()
    )
  );

create policy "shared_folders_insert_owner"
  on public.shared_folders for insert
  with check (auth.uid() = owner_id);

create policy "shared_folders_update_owner"
  on public.shared_folders for update
  using (auth.uid() = owner_id);

create policy "shared_folders_delete_owner"
  on public.shared_folders for delete
  using (auth.uid() = owner_id);

-- ─── Shared folder members ──────────────────────────────────
create table if not exists public.shared_folder_members (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.shared_folders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission text not null default 'read' check (permission in ('read', 'comment', 'edit', 'owner')),
  created_at timestamptz not null default now(),
  unique (folder_id, user_id)
);

alter table public.shared_folder_members enable row level security;

create policy "shared_folder_members_select"
  on public.shared_folder_members for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.shared_folders sf
      where sf.id = folder_id and sf.owner_id = auth.uid()
    )
  );

create policy "shared_folder_members_manage_owner"
  on public.shared_folder_members for all
  using (
    exists (
      select 1 from public.shared_folders sf
      where sf.id = folder_id and sf.owner_id = auth.uid()
    )
  );

-- Items in shared folders
create table if not exists public.shared_folder_items (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.shared_folders(id) on delete cascade,
  resource_type text not null check (resource_type in ('notebook', 'moodboard')),
  resource_id text not null,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (folder_id, resource_type, resource_id)
);

alter table public.shared_folder_items enable row level security;

create policy "shared_folder_items_select_member"
  on public.shared_folder_items for select
  using (
    exists (
      select 1 from public.shared_folders sf
      left join public.shared_folder_members m on m.folder_id = sf.id
      where sf.id = folder_id and (sf.owner_id = auth.uid() or m.user_id = auth.uid())
    )
  );

create policy "shared_folder_items_manage"
  on public.shared_folder_items for all
  using (
    exists (
      select 1 from public.shared_folders sf
      left join public.shared_folder_members m on m.folder_id = sf.id and m.user_id = auth.uid()
      where sf.id = folder_id
        and (sf.owner_id = auth.uid() or m.permission in ('edit', 'owner'))
    )
  );

-- ─── Comments ───────────────────────────────────────────────
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  shared_project_id uuid not null references public.shared_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  mentions uuid[] default '{}',
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "comments_select_shared"
  on public.comments for select
  using (
    exists (
      select 1 from public.shared_projects sp
      where sp.id = shared_project_id
        and (
          sp.owner_id = auth.uid()
          or sp.shared_with_user_id = auth.uid()
          or exists (
            select 1 from public.project_permissions pp
            where pp.shared_project_id = sp.id and pp.user_id = auth.uid()
          )
        )
    )
  );

create policy "comments_insert_shared"
  on public.comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.shared_projects sp
      where sp.id = shared_project_id
        and (
          sp.owner_id = auth.uid()
          or sp.shared_with_user_id = auth.uid()
          or exists (
            select 1 from public.project_permissions pp
            where pp.shared_project_id = sp.id
              and pp.user_id = auth.uid()
              and pp.permission in ('comment', 'edit', 'owner')
          )
        )
    )
  );

create policy "comments_update_own"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "comments_delete_own_or_owner"
  on public.comments for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.shared_projects sp
      where sp.id = shared_project_id and sp.owner_id = auth.uid()
    )
  );

-- ─── Notifications ────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'friend_request', 'friend_accepted', 'share', 'comment', 'folder_invite'
  )),
  title text not null,
  body text not null default '',
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "notifications_insert_system"
  on public.notifications for insert
  with check (true);

-- ─── Auto profile on signup ─────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
