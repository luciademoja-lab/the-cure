-- Consenso facoltativo ad aiutare Elayra a crescere: le parole della persona (senza nome)
-- potranno servire ad addestrare il modello di Elayra. Si dà e si revoca quando si vuole.
alter table public.profiles add column if not exists training_consent boolean;
alter table public.profiles add column if not exists training_consent_at timestamptz;
alter table public.profiles add column if not exists training_consent_asked_at timestamptz;
grant update (training_consent, training_consent_at, training_consent_asked_at) on public.profiles to authenticated;

-- Registro delle scelte (per dimostrare quando è stato dato o revocato il consenso). Lo scrive solo il server.
create table if not exists public.training_consent_log (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  granted boolean not null,
  source text not null check (source in ('chat', 'profile')),
  created_at timestamptz not null default now()
);
create index if not exists training_consent_log_user_idx on public.training_consent_log (user_id, created_at);
alter table public.training_consent_log enable row level security;
revoke all on public.training_consent_log from anon, authenticated;
grant select, insert on public.training_consent_log to service_role;
grant usage, select on sequence public.training_consent_log_id_seq to service_role;
