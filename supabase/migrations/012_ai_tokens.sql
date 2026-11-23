-- Quanto costa davvero Elayra: i token di ogni chiamata al modello, con il costo stimato in dollari.
-- Li scrive solo il server (chiave segreta); la persona non li vede e non li può modificare.
create table if not exists public.ai_tokens (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete set null,
  route text,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ai_tokens_created_idx on public.ai_tokens (created_at);
create index if not exists ai_tokens_user_idx on public.ai_tokens (user_id, created_at);
alter table public.ai_tokens enable row level security;
revoke all on public.ai_tokens from anon, authenticated;

-- Spesa del giorno (UTC) per il tetto di sicurezza: la legge solo il server.
create or replace function public.ai_cost_today(only_free boolean default false)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(t.cost_usd), 0)
  from public.ai_tokens t
  where t.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    and (not only_free or coalesce(public.effective_plan(t.user_id), 'free') = 'free');
$$;
revoke all on function public.ai_cost_today(boolean) from public, anon, authenticated;

-- Il costo medio per persona negli ultimi 30 giorni, per piano: la vista che ti serve per decidere i prezzi.
create or replace view public.ai_cost_by_user_30d
with (security_invoker = true) as
select
  t.user_id,
  coalesce(public.effective_plan(t.user_id), 'free') as plan,
  count(*) as calls,
  sum(t.input_tokens + t.cache_read_tokens + t.cache_write_tokens) as input_tokens,
  sum(t.output_tokens) as output_tokens,
  round(sum(t.cost_usd)::numeric, 4) as cost_usd
from public.ai_tokens t
where t.created_at >= now() - interval '30 days'
group by t.user_id;
revoke all on public.ai_cost_by_user_30d from anon, authenticated;

grant execute on function public.ai_cost_today(boolean) to service_role;
grant select, insert on public.ai_tokens to service_role;
grant usage, select on sequence public.ai_tokens_id_seq to service_role;
