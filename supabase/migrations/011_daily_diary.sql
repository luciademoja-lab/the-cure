-- Il diario si scrive da solo: a mezzanotte la conversazione del giorno diventa una pagina.

-- Il giorno della pagina (nel fuso della persona) e le sue parole, così come le ha scritte.
alter table public.journal_entries add column if not exists day date;
alter table public.journal_entries add column if not exists user_words text[] not null default '{}';

-- Una pagina per giorno: se due richieste chiudono lo stesso giorno insieme, ne resta una.
create unique index if not exists journal_entries_user_day_key on public.journal_entries (user_id, day);

-- Chi aveva già scoperto tutte le pagine trova anche il Diario.
update public.profiles
set discovered_pages = array_append(discovered_pages, 'diary')
where 'path' = any(discovered_pages) and not ('diary' = any(discovered_pages));
