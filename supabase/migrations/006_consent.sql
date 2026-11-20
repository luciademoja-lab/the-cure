-- Consenso esplicito a termini, privacy e trattamento dei contenuti intimi (art. 9 GDPR), registrato al primo accesso.
-- Lo scrive solo il server: la persona non può modificarlo da sola.
alter table public.profiles add column if not exists consented_at timestamptz;
