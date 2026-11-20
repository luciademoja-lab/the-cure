-- Rituali del mattino/sera e riflessioni dei livelli del Percorso (già applicata al progetto "elayra").
create table public.rituals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('morning', 'evening')),
  day date not null,
  response text not null check (char_length(response) between 1 and 4000),
  light_points integer not null default 5 check (light_points >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, kind, day)
);

create table public.level_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  level smallint not null check (level between 1 and 7),
  response text not null check (char_length(response) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, level)
);

alter table public.rituals enable row level security;
alter table public.level_reflections enable row level security;

create policy "rituals: own rows" on public.rituals
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "level reflections: own rows" on public.level_reflections
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
