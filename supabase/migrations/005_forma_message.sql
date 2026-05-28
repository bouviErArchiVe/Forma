-- FormaMessage — messagerie (Supabase)
-- Exécuter après 001_account_sharing.sql

create table if not exists public.forma_conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct' check (type in ('direct', 'group')),
  title text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forma_conversation_members (
  conversation_id uuid not null references public.forma_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.forma_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.forma_conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  type text not null default 'text' check (type in ('text', 'image', 'file', 'voice', 'sticker', 'share')),
  body text,
  attachment jsonb,
  reply_to uuid references public.forma_messages(id) on delete set null,
  reactions jsonb not null default '{}'::jsonb,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read')),
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_forma_messages_conv on public.forma_messages(conversation_id, created_at desc);

alter table public.forma_conversations enable row level security;
alter table public.forma_conversation_members enable row level security;
alter table public.forma_messages enable row level security;

create policy "forma_conv_members_select"
  on public.forma_conversation_members for select
  using (auth.uid() = user_id);

create policy "forma_conv_select_member"
  on public.forma_conversations for select
  using (
    exists (
      select 1 from public.forma_conversation_members m
      where m.conversation_id = forma_conversations.id and m.user_id = auth.uid()
    )
  );

create policy "forma_messages_select_member"
  on public.forma_messages for select
  using (
    exists (
      select 1 from public.forma_conversation_members m
      where m.conversation_id = forma_messages.conversation_id and m.user_id = auth.uid()
    )
  );

create policy "forma_messages_insert_member"
  on public.forma_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.forma_conversation_members m
      where m.conversation_id = forma_messages.conversation_id and m.user_id = auth.uid()
    )
  );

create policy "forma_messages_update_own"
  on public.forma_messages for update
  using (auth.uid() = sender_id);

-- Storage bucket suggestion (Dashboard → Storage): forma-message-files
