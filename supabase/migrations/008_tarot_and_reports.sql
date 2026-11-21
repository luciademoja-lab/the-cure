-- ════════════════════════════════════════════════════════════════════════
-- Tarocchi e report mensile.
-- Una lettura in regalo quando si completano entrambe le pratiche della Luce del giorno.
-- Il report mensile di Elayra: incluso nei piani a pagamento, 0,99 € con il piano gratuito.
-- Le righe le scrive solo il server (le carte non si scelgono dal browser); la persona le legge.
-- ════════════════════════════════════════════════════════════════════════

-- Chi non vuole le letture lo dice qui (spunta nell'app).
alter table public.profiles add column if not exists tarot_opt_out boolean not null default false;
grant update (tarot_opt_out) on public.profiles to authenticated;

-- ── Letture dei tarocchi: una al giorno ──────────────────────────────────
create table public.tarot_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  cards jsonb not null,
  reading text not null default '',
  locale text not null default 'it' check (locale in ('it', 'en')),
  created_at timestamptz not null default now(),
  unique (user_id, day)
);
create index tarot_readings_user_day_idx on public.tarot_readings (user_id, day desc);
alter table public.tarot_readings enable row level security;
revoke insert, update, delete on public.tarot_readings from authenticated, anon;
create policy "tarot: read own" on public.tarot_readings
  for select to authenticated using ((select auth.uid()) = user_id and public.is_aal2());

-- ── Report mensili scritti da Elayra ──────────────────────────────────────
create table public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  content text not null,
  locale text not null default 'it' check (locale in ('it', 'en')),
  created_at timestamptz not null default now(),
  unique (user_id, month)
);
alter table public.monthly_reports enable row level security;
revoke insert, update, delete on public.monthly_reports from authenticated, anon;
create policy "reports: read own" on public.monthly_reports
  for select to authenticated using ((select auth.uid()) = user_id and public.is_aal2());

-- ── Report comprati singolarmente (0,99 €) ───────────────────────────────
create table public.report_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  stripe_session_id text not null unique,
  created_at timestamptz not null default now()
);
-- Niente vincolo unico su (persona, mese): se un pagamento arriva due volte non deve far fallire il webhook.
create index report_purchases_user_month_idx on public.report_purchases (user_id, month);
alter table public.report_purchases enable row level security;
revoke insert, update, delete on public.report_purchases from authenticated, anon;
create policy "report purchases: read own" on public.report_purchases
  for select to authenticated using ((select auth.uid()) = user_id and public.is_aal2());
