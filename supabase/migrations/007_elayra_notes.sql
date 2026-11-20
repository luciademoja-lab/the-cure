-- "Cosa Elayra sa di te": ciò che la persona sceglie di raccontare a Elayra su di sé,
-- letto da Elayra in ogni conversazione. Lo scrive e lo cambia solo la persona.
alter table public.profiles
  add column if not exists elayra_notes text check (elayra_notes is null or char_length(elayra_notes) <= 6000);
grant update (elayra_notes) on public.profiles to authenticated;
