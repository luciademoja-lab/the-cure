-- Profilo: avatar scelto tra punto, cerchio, triangolo, oppure una foto caricata dalla persona.
-- Le foto stanno nel bucket privato "avatars", ognuna nella cartella della propria persona.

alter table public.profiles
  add column if not exists avatar_kind text
    check (avatar_kind in ('point', 'circle', 'triangle', 'image')),
  add column if not exists avatar_path text
    check (avatar_path is null or avatar_path like id::text || '/%');

-- Come per il nome: la persona può cambiare solo questi campi della propria riga.
grant update (avatar_kind, avatar_path) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars: read own" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and public.is_aal2());

create policy "avatars: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and public.is_aal2());

create policy "avatars: replace own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and public.is_aal2())
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and public.is_aal2());

create policy "avatars: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and public.is_aal2());
