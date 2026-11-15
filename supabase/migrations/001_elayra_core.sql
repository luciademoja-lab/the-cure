-- Elayra — schema di base: profili, conversazione con Elayra, pagine di diario.
-- Ogni tabella ha la Row Level Security: ogni persona vede e modifica solo le proprie righe.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text check (char_length(nickname) <= 60),
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  journaled boolean not null default false,
  created_at timestamptz not null default now()
);
create index chat_messages_user_created_idx on public.chat_messages (user_id, created_at desc);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mood smallint not null check (mood between 1 and 10),
  energy text not null check (energy in ('low', 'moderate', 'high')),
  sensation text,
  content text not null,
  light_points integer not null default 0 check (light_points >= 0),
  created_at timestamptz not null default now()
);
create index journal_entries_user_created_idx on public.journal_entries (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.chat_messages enable row level security;
alter table public.journal_entries enable row level security;

create policy "profiles: own row" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "chat: own rows" on public.chat_messages
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "journal: own rows" on public.journal_entries
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Alla registrazione si crea il profilo con il nickname scelto.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, left(new.raw_user_meta_data ->> 'nickname', 60));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
