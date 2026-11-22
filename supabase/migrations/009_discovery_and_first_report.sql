-- Scoperta guidata dell'app e report dei primi 30 giorni.

-- ── Pagine scoperte ──────────────────────────────────────────────────────
-- All'inizio si vede solo il diario: Elayra presenta le altre pagine una alla volta
-- e ognuna entra nel menu quando la persona la visita.
alter table public.profiles
  add column if not exists discovered_pages text[] not null default array['journal']::text[];

-- Chi usava già l'app ritrova il menu completo.
update public.profiles
set discovered_pages = array['journal', 'daily-light', 'path', 'tarot', 'synchronicities', 'forge', 'collective', 'plans']
;

-- La colonna si scrive solo dal server (che controlla i nomi delle pagine): nessun permesso di modifica per gli utenti.

-- ── Giorni di uso ────────────────────────────────────────────────────────
-- Un giorno conta se la persona ha scritto a Elayra, salvato una pagina o fatto una pratica.
create or replace function public.my_active_days()
returns table (day date)
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct d from (
    select (created_at at time zone 'utc')::date as d from public.chat_messages
      where user_id = (select auth.uid()) and role = 'user'
    union
    select (created_at at time zone 'utc')::date from public.journal_entries
      where user_id = (select auth.uid())
    union
    select r.day from public.rituals r
      where r.user_id = (select auth.uid())
  ) s
  order by d;
$$;
grant execute on function public.my_active_days() to authenticated;

-- ── Report: mese oppure primi 30 giorni ──────────────────────────────────
-- Per 'first30' la colonna month è il primo del mese in cui la persona ha iniziato.
alter table public.monthly_reports
  add column if not exists period text not null default 'month' check (period in ('month', 'first30'));
alter table public.report_purchases
  add column if not exists period text not null default 'month' check (period in ('month', 'first30'));
