-- Secondo passaggio via email (alternativa meno sicura all'app di autenticazione).
-- Il server manda un codice di 6 cifre all'email dell'account; quando è giusto, la sessione in corso
-- vale come "verificata" per 30 giorni. Solo per chi non ha un'app di autenticazione collegata.

create table if not exists public.mfa_email_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  sent_at timestamptz not null default now(),
  window_start timestamptz not null default now(),
  sends_in_window integer not null default 1
);

create table if not exists public.mfa_email_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  verified_at timestamptz not null default now()
);
create index if not exists mfa_email_sessions_user_idx on public.mfa_email_sessions (user_id);

alter table public.mfa_email_codes enable row level security;
alter table public.mfa_email_sessions enable row level security;
revoke all on public.mfa_email_codes from anon, authenticated;
revoke all on public.mfa_email_sessions from anon, authenticated;
grant select, insert, update, delete on public.mfa_email_codes to service_role;
grant select, insert, update, delete on public.mfa_email_sessions to service_role;

-- Ha un'app di autenticazione collegata? Allora il codice via email non vale.
create or replace function public.has_totp(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from auth.mfa_factors f where f.user_id = uid and f.status = 'verified');
$$;
revoke all on function public.has_totp(uuid) from public, anon, authenticated;
grant execute on function public.has_totp(uuid) to service_role;

-- La regola che protegge tutti i dati: verificata con l'app (aal2) oppure con il codice via email
-- in questa stessa sessione, negli ultimi 30 giorni, e senza un'app collegata.
create or replace function public.is_aal2()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    or exists (
      select 1
      from public.mfa_email_sessions s
      where s.session_id = (
          case when (select auth.jwt() ->> 'session_id') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
               then ((select auth.jwt() ->> 'session_id'))::uuid
          end
        )
        and s.user_id = (select auth.uid())
        and s.verified_at > now() - interval '30 days'
        and not public.has_totp(s.user_id)
    );
$$;
