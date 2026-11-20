-- ════════════════════════════════════════════════════════════════════════
-- 2FA obbligatoria, piani e abbonamenti, uso di Elayra, archivio della Forgia,
-- cielo delle costellazioni con claim e premi.
-- ════════════════════════════════════════════════════════════════════════

-- ── 2FA: senza codice dell'autenticatore il database non risponde ──────────
create function public.is_aal2()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

create policy "mfa required" on public.profiles as restrictive to authenticated using (public.is_aal2()) with check (public.is_aal2());
create policy "mfa required" on public.chat_messages as restrictive to authenticated using (public.is_aal2()) with check (public.is_aal2());
create policy "mfa required" on public.journal_entries as restrictive to authenticated using (public.is_aal2()) with check (public.is_aal2());
create policy "mfa required" on public.rituals as restrictive to authenticated using (public.is_aal2()) with check (public.is_aal2());
create policy "mfa required" on public.level_reflections as restrictive to authenticated using (public.is_aal2()) with check (public.is_aal2());
create policy "mfa required" on public.forge_profiles as restrictive to authenticated using (public.is_aal2()) with check (public.is_aal2());
create policy "mfa required" on public.forge_matches as restrictive to authenticated using (public.is_aal2()) with check (public.is_aal2());
create policy "mfa required" on public.forge_messages as restrictive to authenticated using (public.is_aal2()) with check (public.is_aal2());

-- ── Profilo: maggiore età confermata e primo accesso completato ───────────
alter table public.profiles
  add column adult_confirmed_at timestamptz,
  add column onboarded_at timestamptz;

-- Chi si è registrato finora con email ha già dichiarato l'età nel modulo.
update public.profiles set adult_confirmed_at = created_at, onboarded_at = created_at where onboarded_at is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ref uuid;
  adult boolean := coalesce(new.raw_user_meta_data ->> 'adult_confirmed', '') = 'true';
  nick text := left(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), 60);
begin
  select id into ref from public.profiles
  where referral_code = lower(new.raw_user_meta_data ->> 'referral_code')
  limit 1;
  insert into public.profiles (id, nickname, referred_by, adult_confirmed_at, onboarded_at)
  values (
    new.id, nick, ref,
    case when adult then now() end,
    case when adult and nick is not null then now() end
  );
  return new;
end;
$$;

-- Primo accesso (es. con Google): nome, conferma dei 18 anni ed eventuale codice di invito.
create function public.complete_onboarding(p_nickname text, p_age integer, p_referral text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  me public.profiles;
  ref uuid;
begin
  if not public.is_aal2() then raise exception 'mfa required'; end if;
  if p_age is null or p_age < 18 or p_age > 120 then raise exception 'age not allowed'; end if;
  if char_length(coalesce(trim(p_nickname), '')) < 2 then raise exception 'nickname required'; end if;

  select * into me from public.profiles where id = uid for update;
  if not found then raise exception 'profile not found'; end if;

  -- Il codice di invito si può collegare solo a un account nuovo, che non ha ancora invitato nessuno.
  if me.referred_by is null and nullif(trim(coalesce(p_referral, '')), '') is not null
     and me.created_at > now() - interval '7 days'
     and not exists (select 1 from public.profiles where referred_by = uid) then
    select id into ref from public.profiles where referral_code = lower(trim(p_referral)) and id <> uid limit 1;
  end if;

  update public.profiles set
    nickname = left(trim(p_nickname), 60),
    adult_confirmed_at = coalesce(adult_confirmed_at, now()),
    onboarded_at = coalesce(onboarded_at, now()),
    referred_by = coalesce(referred_by, ref)
  where id = uid;
end;
$$;
revoke execute on function public.complete_onboarding(text, integer, text) from public, anon;
grant execute on function public.complete_onboarding(text, integer, text) to authenticated;

create function public.regenerate_referral_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  code text;
begin
  if not public.is_aal2() then raise exception 'mfa required'; end if;
  loop
    code := substr(md5(gen_random_uuid()::text), 1, 8);
    exit when not exists (select 1 from public.profiles where referral_code = code);
  end loop;
  update public.profiles set referral_code = code where id = (select auth.uid());
  return code;
end;
$$;
revoke execute on function public.regenerate_referral_code() from public, anon;
grant execute on function public.regenerate_referral_code() to authenticated;

-- ── Piani: abbonamenti Stripe e mesi regalati ─────────────────────────────
create function public.plan_rank(p text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p when 'forgia' then 1 when 'part' then 2 when 'full' then 3 when 'h24' then 4 else 0 end;
$$;

create table public.billing_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('forgia', 'part', 'full', 'h24')),
  status text not null,
  stripe_subscription_id text not null,
  current_period_end timestamptz,
  sponsored_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create index subscriptions_stripe_idx on public.subscriptions (stripe_subscription_id);

create table public.plan_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('forgia', 'part', 'full', 'h24')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  source text not null,
  created_at timestamptz not null default now()
);
create index plan_grants_user_idx on public.plan_grants (user_id, ends_at);

alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.plan_grants enable row level security;
revoke insert, update, delete on public.billing_customers, public.subscriptions, public.plan_grants from authenticated, anon;

create policy "subscriptions: own row" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id and public.is_aal2());
create policy "grants: own rows" on public.plan_grants for select to authenticated using ((select auth.uid()) = user_id and public.is_aal2());

create function public.effective_plan(uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p from (
      select plan as p from public.subscriptions
      where user_id = uid and status in ('active', 'trialing')
        and (current_period_end is null or current_period_end > now() - interval '3 days')
      union all
      select plan from public.plan_grants where user_id = uid and now() between starts_at and ends_at
    ) x
    order by public.plan_rank(p) desc
    limit 1
  ), 'free');
$$;
revoke execute on function public.effective_plan(uuid) from public, anon;
grant execute on function public.effective_plan(uuid) to authenticated;

-- ── Uso di Elayra: un rigo per risposta, non cancellabile da chi usa l'app ─
create table public.ai_usage (
  id bigserial primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('chat', 'forge')),
  model text,
  created_at timestamptz not null default now()
);
create index ai_usage_user_idx on public.ai_usage (user_id, created_at);
alter table public.ai_usage enable row level security;
revoke update, delete on public.ai_usage from authenticated, anon;
create policy "usage: read own" on public.ai_usage for select to authenticated using ((select auth.uid()) = user_id and public.is_aal2());
create policy "usage: add own" on public.ai_usage for insert to authenticated with check ((select auth.uid()) = user_id and public.is_aal2());

-- ── Forgia: per scrivere nelle stanze serve almeno il piano Forgia ─────────
drop policy "forge messages: participants write" on public.forge_messages;
create policy "forge messages: participants write" on public.forge_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid()) and role = 'user'
    and public.plan_rank(public.effective_plan((select auth.uid()))) >= 1
    and exists (
      select 1 from public.forge_matches m
      where m.id = match_id and (select auth.uid()) in (m.user_a, m.user_b)
        and m.a_status = 'accepted' and m.b_status = 'accepted'
    )
  );

-- Le funzioni della Forgia rispondono solo dopo la 2FA.
create or replace function public.forge_my_matches()
returns table (
  id uuid, topic text, my_status text, their_status text, is_open boolean,
  other_nickname text, other_summary text, created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.topic,
    case when m.user_a = (select auth.uid()) then m.a_status else m.b_status end,
    case when m.user_a = (select auth.uid()) then m.b_status else m.a_status end,
    (m.a_status = 'accepted' and m.b_status = 'accepted'),
    case when m.a_status = 'accepted' and m.b_status = 'accepted' then pr.nickname end,
    case when m.a_status = 'accepted' and m.b_status = 'accepted' then fp.summary end,
    m.created_at
  from public.forge_matches m
  left join public.profiles pr
    on pr.id = case when m.user_a = (select auth.uid()) then m.user_b else m.user_a end
  left join public.forge_profiles fp
    on fp.user_id = case when m.user_a = (select auth.uid()) then m.user_b else m.user_a end
  where (select auth.uid()) in (m.user_a, m.user_b) and public.is_aal2()
  order by m.created_at desc;
$$;

-- ── Archivio documenti delle stanze ────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('forge-docs', 'forge-docs', false, 10485760)
on conflict (id) do nothing;

create function public.can_access_room_path(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  folder text := split_part(object_name, '/', 1);
begin
  if not public.is_aal2() then return false; end if;
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  return exists (
    select 1 from public.forge_matches m
    where m.id = folder::uuid and (select auth.uid()) in (m.user_a, m.user_b)
      and m.a_status = 'accepted' and m.b_status = 'accepted'
  );
end;
$$;
revoke execute on function public.can_access_room_path(text) from public, anon;
grant execute on function public.can_access_room_path(text) to authenticated;

create policy "forge docs: room members read" on storage.objects
  for select to authenticated
  using (bucket_id = 'forge-docs' and public.can_access_room_path(name));

create policy "forge docs: members with a plan upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'forge-docs' and public.can_access_room_path(name)
    and public.plan_rank(public.effective_plan((select auth.uid()))) >= 1
  );

create policy "forge docs: uploader deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'forge-docs' and owner_id = (select auth.uid())::text and public.can_access_room_path(name));

-- ── Cielo: le 88 costellazioni ─────────────────────────────────────────────
create table public.constellation_catalog (
  id text primary key,
  name text not null,
  name_it text not null,
  stars smallint not null check (stars > 0)
);
alter table public.constellation_catalog enable row level security;
create policy "catalog: everyone signed in reads" on public.constellation_catalog for select to authenticated using (true);
revoke insert, update, delete on public.constellation_catalog from authenticated, anon;

create table public.constellation_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  constellation_id text not null references public.constellation_catalog (id),
  stars smallint not null,
  rewarded boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, constellation_id)
);

-- Ogni persona invitata (una stella) può far parte di una sola costellazione.
create table public.constellation_stars (
  claim_id uuid not null references public.constellation_claims (id) on delete cascade,
  star_user_id uuid not null references auth.users (id) on delete cascade,
  primary key (claim_id, star_user_id),
  unique (star_user_id)
);

alter table public.constellation_claims enable row level security;
alter table public.constellation_stars enable row level security;
revoke insert, update, delete on public.constellation_claims, public.constellation_stars from authenticated, anon;
create policy "claims: own rows" on public.constellation_claims for select to authenticated using ((select auth.uid()) = user_id and public.is_aal2());

-- Una stella è una persona invitata che ha completato l'accesso e ha parlato almeno 3 volte con Elayra,
-- e che non fa ancora parte di una costellazione.
create function public.available_stars(uid uuid)
returns table (star_id uuid, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.created_at
  from public.profiles p
  where p.referred_by = uid
    and p.onboarded_at is not null
    and (select count(*) from public.chat_messages c where c.user_id = p.id and c.role = 'user') >= 3
    and not exists (select 1 from public.constellation_stars s where s.star_user_id = p.id)
  order by p.created_at, p.id;
$$;
revoke execute on function public.available_stars(uuid) from public, anon, authenticated;

create function public.sky_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if not public.is_aal2() then raise exception 'mfa required'; end if;
  return jsonb_build_object(
    'claims', coalesce((
      select jsonb_object_agg(constellation_id, n)
      from (select constellation_id, count(*) as n from public.constellation_claims group by 1) x
    ), '{}'::jsonb),
    'mine', coalesce((
      select jsonb_agg(constellation_id order by created_at) from public.constellation_claims where user_id = uid
    ), '[]'::jsonb),
    'availableStars', (select count(*) from public.available_stars(uid)),
    'invited', (select count(*) from public.profiles where referred_by = uid),
    'usedStars', (
      select count(*) from public.constellation_stars s
      join public.constellation_claims c on c.id = s.claim_id where c.user_id = uid
    ),
    'people', (select count(*) from public.profiles),
    'myCode', (select referral_code from public.profiles where id = uid)
  );
end;
$$;
revoke execute on function public.sky_state() from public, anon;
grant execute on function public.sky_state() to authenticated;

-- Reclamare una costellazione consuma tante stelle quante ne ha la figura.
-- Da 7 stelle in su: un mese Full time a chi la reclama, un mese Part time a ogni stella.
create function public.claim_constellation(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  c public.constellation_catalog;
  claim uuid;
  have integer;
  is_rewarded boolean;
  star record;
begin
  if not public.is_aal2() then raise exception 'mfa required'; end if;
  select * into c from public.constellation_catalog where id = p_id;
  if not found then raise exception 'unknown constellation'; end if;
  if exists (select 1 from public.constellation_claims where user_id = uid and constellation_id = p_id) then
    raise exception 'already claimed';
  end if;

  -- Blocca le righe del profilo per evitare due claim in parallelo con le stesse stelle.
  perform 1 from public.profiles where id = uid for update;
  select count(*) into have from public.available_stars(uid);
  if have < c.stars then raise exception 'not enough stars'; end if;

  is_rewarded := c.stars >= 7;
  insert into public.constellation_claims (user_id, constellation_id, stars, rewarded)
  values (uid, p_id, c.stars, is_rewarded)
  returning id into claim;

  for star in select star_id from public.available_stars(uid) limit c.stars loop
    insert into public.constellation_stars (claim_id, star_user_id) values (claim, star.star_id);
    if is_rewarded then
      insert into public.plan_grants (user_id, plan, starts_at, ends_at, source)
      select star.star_id, 'part', s, s + interval '30 days', 'constellation:' || p_id
      from (select greatest(now(), coalesce(max(ends_at), now())) as s
            from public.plan_grants where user_id = star.star_id and plan = 'part') x;
    end if;
  end loop;

  if is_rewarded then
    insert into public.plan_grants (user_id, plan, starts_at, ends_at, source)
    select uid, 'full', s, s + interval '30 days', 'constellation:' || p_id
    from (select greatest(now(), coalesce(max(ends_at), now())) as s
          from public.plan_grants where user_id = uid and plan = 'full') x;
  end if;

  return jsonb_build_object('constellation', p_id, 'stars', c.stars, 'rewarded', is_rewarded);
end;
$$;
revoke execute on function public.claim_constellation(text) from public, anon;
grant execute on function public.claim_constellation(text) to authenticated;

-- La vecchia mappa anonima è sostituita dal cielo.
drop function public.constellation_map();


-- Le funzioni della Forgia rispondono solo dopo la 2FA.
create or replace function public.forge_find_matches()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  me public.forge_profiles;
  cand record;
  made integer := 0;
  pair_score real;
  pair_topic text;
  note text;
begin
  if not public.is_aal2() then raise exception 'mfa required'; end if;
  select * into me from public.forge_profiles
  where user_id = (select auth.uid()) and status = 'active';
  if not found then
    return 0;
  end if;

  for cand in
    select p.user_id, p.project_type, p.style,
           array(select unnest(p.areas) intersect select unnest(me.areas) order by 1) as common
    from public.forge_profiles p
    where p.status = 'active'
      and p.user_id <> me.user_id
      and p.areas && me.areas
      and not exists (
        select 1 from public.forge_matches m
        where m.user_a = least(p.user_id, me.user_id) and m.user_b = greatest(p.user_id, me.user_id)
      )
    order by cardinality(array(select unnest(p.areas) intersect select unnest(me.areas))) desc, p.updated_at desc
    limit 3
  loop
    pair_score := 2 * cardinality(cand.common)
      + (case when cand.project_type = me.project_type then 1 else 0 end)
      + (case when cand.style = me.style then 0.5 else 0 end);
    pair_topic := array_to_string(cand.common, ', ');

    insert into public.forge_matches (user_a, user_b, topic, score)
    values (least(cand.user_id, me.user_id), greatest(cand.user_id, me.user_id), pair_topic, pair_score);

    note := 'Nella Forgia c''è un''altra persona che sta lavorando, per conto suo, su qualcosa di vicino al tuo: '
      || pair_topic || '. Vuoi parlarle? Puoi rispondere dalla pagina Forgia. Se dici di no, non succede niente.';
    insert into public.chat_messages (user_id, role, content, journaled)
    values (me.user_id, 'assistant', note, true), (cand.user_id, 'assistant', note, true);

    made := made + 1;
  end loop;
  return made;
end;
$$;

create or replace function public.forge_respond(p_match uuid, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.forge_matches;
  uid uuid := (select auth.uid());
  answer text := case when p_accept then 'accepted' else 'declined' end;
begin
  if not public.is_aal2() then raise exception 'mfa required'; end if;
  select * into m from public.forge_matches where id = p_match and uid in (user_a, user_b) for update;
  if not found then
    raise exception 'match not found';
  end if;
  if m.a_status = 'declined' or m.b_status = 'declined' then
    return 'closed';
  end if;

  if m.user_a = uid then
    update public.forge_matches set a_status = answer where id = p_match returning * into m;
  else
    update public.forge_matches set b_status = answer where id = p_match returning * into m;
  end if;

  if m.a_status = 'accepted' and m.b_status = 'accepted' then
    if not exists (select 1 from public.forge_messages where match_id = p_match) then
      insert into public.forge_messages (match_id, sender_id, role, content)
      values (p_match, null, 'elayra',
        'Eccovi. State lavorando entrambi su: ' || m.topic || '. Questo spazio è vostro. Cominciate da dove volete.');
    end if;
    return 'open';
  end if;
  if not p_accept then
    return 'closed';
  end if;
  return 'waiting';
end;
$$;

insert into public.constellation_catalog (id, name, name_it, stars) values
  ('And', 'Andromeda', 'Andromeda', 17),
  ('Ant', 'Antlia', 'Macchina Pneumatica', 3),
  ('Aps', 'Apus', 'Uccello del Paradiso', 4),
  ('Aqr', 'Aquarius', 'Acquario', 15),
  ('Aql', 'Aquila', 'Aquila', 8),
  ('Ara', 'Ara', 'Altare', 7),
  ('Ari', 'Aries', 'Ariete', 4),
  ('Aur', 'Auriga', 'Auriga', 9),
  ('Boo', 'Bootes', 'Boote', 12),
  ('Cae', 'Caelum', 'Bulino dello Incisore', 4),
  ('Cam', 'Camelopardalis', 'Giraffa', 8),
  ('Cnc', 'Cancer', 'Cancro', 5),
  ('CVn', 'Canes Venatici', 'Cani da Caccia', 2),
  ('CMa', 'Canis Maior', 'Cane Maggiore', 11),
  ('CMi', 'Canis Minor', 'Cane Minore', 2),
  ('Cap', 'Capricornus', 'Capricorno', 10),
  ('Car', 'Carina', 'Carena', 17),
  ('Cas', 'Cassiopeia', 'Cassiopeia', 5),
  ('Cen', 'Centaurus', 'Centauro', 16),
  ('Cep', 'Cepheus', 'Cefeo', 10),
  ('Cet', 'Cetus', 'Balena', 14),
  ('Cha', 'Chamaeleon', 'Camaleonte', 5),
  ('Cir', 'Circinus', 'Compasso', 3),
  ('Col', 'Columba', 'Colomba', 5),
  ('Com', 'Coma Berenices', 'Chioma di Berenice', 3),
  ('CrA', 'Corona Australis', 'Corona Australe', 8),
  ('CrB', 'Corona Borealis', 'Corona Boreale', 7),
  ('Crv', 'Corvus', 'Corvo', 5),
  ('Crt', 'Crater', 'Coppa', 9),
  ('Cru', 'Crux', 'Croce del Sud', 4),
  ('Cyg', 'Cygnus', 'Cigno', 9),
  ('Del', 'Delphinus', 'Delfino', 5),
  ('Dor', 'Dorado', 'Pesce Dorato', 6),
  ('Dra', 'Draco', 'Dragone', 15),
  ('Equ', 'Equuleus', 'Cavallo', 3),
  ('Eri', 'Eridanus', 'Fiume Eridano', 27),
  ('For', 'Fornax', 'Fornace', 3),
  ('Gem', 'Gemini', 'Gemelli', 12),
  ('Gru', 'Grus', 'Gru', 9),
  ('Her', 'Hercules', 'Ercole', 17),
  ('Hor', 'Horologium', 'Orologio', 6),
  ('Hya', 'Hydra', 'Idra femmina', 18),
  ('Hyi', 'Hydrus', 'Idra maschio', 6),
  ('Ind', 'Indus', 'Indiano', 5),
  ('Lac', 'Lacerta', 'Lucertola', 9),
  ('Leo', 'Leo', 'Leone', 9),
  ('LMi', 'Leo Minor', 'Leone Minore', 5),
  ('Lep', 'Lepus', 'Lepre', 11),
  ('Lib', 'Libra', 'Bilancia', 6),
  ('Lup', 'Lupus', 'Lupo', 12),
  ('Lyn', 'Lynx', 'Lince', 7),
  ('Lyr', 'Lyra', 'Lira', 6),
  ('Men', 'Mensa', 'Mensa', 4),
  ('Mic', 'Microscopium', 'Microscopio', 5),
  ('Mon', 'Monoceros', 'Unicorno', 9),
  ('Mus', 'Musca', 'Mosca', 6),
  ('Nor', 'Norma', 'Squadra', 4),
  ('Oct', 'Octans', 'Ottante', 3),
  ('Oph', 'Ophiuchus', 'Ofiucho', 16),
  ('Ori', 'Orion', 'Orione', 23),
  ('Pav', 'Pavo', 'Pavone', 10),
  ('Peg', 'Pegasus', 'Pegaso', 14),
  ('Per', 'Perseus', 'Perseo', 23),
  ('Phe', 'Phoenix', 'Fenice', 6),
  ('Pic', 'Pictor', 'Pittore', 3),
  ('Psc', 'Pisces', 'Pesci', 22),
  ('PsA', 'Piscis Austrinus', 'Pesce Australe', 8),
  ('Pup', 'Puppis', 'Poppa', 11),
  ('Pyx', 'Pyxis', 'Bussola', 4),
  ('Ret', 'Reticulum', 'Reticolo', 4),
  ('Sge', 'Sagitta', 'Freccia', 4),
  ('Sgr', 'Sagittarius', 'Sagittario', 25),
  ('Sco', 'Scorpius', 'Scorpione', 14),
  ('Scl', 'Sculptor', 'Scultore', 4),
  ('Sct', 'Scutum', 'Scudo', 4),
  ('Ser', 'Serpens', 'Serpente', 14),
  ('Sex', 'Sextans', 'Sestante', 4),
  ('Tau', 'Taurus', 'Toro', 12),
  ('Tel', 'Telescopium', 'Telescopio', 3),
  ('Tri', 'Triangulum', 'Triangolo', 3),
  ('TrA', 'Triangulum Australe', 'Triangolo Australe', 3),
  ('Tuc', 'Tucana', 'Tucano', 6),
  ('UMa', 'Ursa Maior', 'Orsa Maggiore', 20),
  ('UMi', 'Ursa Minor', 'Orsa Minore', 7),
  ('Vel', 'Vela', 'Vela', 8),
  ('Vir', 'Virgo', 'Vergine', 13),
  ('Vol', 'Volans', 'Pesce volante', 5),
  ('Vul', 'Vulpecula', 'Volpetta', 5);
