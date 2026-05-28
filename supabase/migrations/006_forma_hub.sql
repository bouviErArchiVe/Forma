-- FormaHub — tables cloud (sync communautaire à venir)

create table if not exists public.forma_hub_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  trade_id text not null default 'architecte',
  category text not null default 'architecture',
  type text not null default 'text',
  title text not null,
  body text,
  image_url text,
  attachment jsonb,
  tags text[] default '{}',
  likes int not null default 0,
  saves int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forma_hub_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forma_hub_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.forma_hub_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('trade', 'user')),
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

alter table public.forma_hub_posts enable row level security;
alter table public.forma_hub_comments enable row level security;
alter table public.forma_hub_follows enable row level security;

create policy "forma_hub_posts_read" on public.forma_hub_posts for select using (true);
create policy "forma_hub_posts_insert" on public.forma_hub_posts for insert with check (auth.uid() = author_id);
create policy "forma_hub_comments_read" on public.forma_hub_comments for select using (true);
create policy "forma_hub_comments_insert" on public.forma_hub_comments for insert with check (auth.uid() = author_id);
create policy "forma_hub_follows_own" on public.forma_hub_follows for all using (auth.uid() = user_id);
