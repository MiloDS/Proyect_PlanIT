-- PlanIt: fotos de perfil en Supabase Storage

-- Bucket público: la foto se muestra con su URL (como las de Google) a las personas de los
-- planes. Cada archivo se guarda en una carpeta con el id del usuario, con un nombre nuevo en
-- cada cambio para que los teléfonos no muestren la foto anterior desde su caché. La app
-- reduce la foto a 512 px en JPEG antes de subirla; el límite de 2 MB es un tope de seguridad.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Para ver la foto basta la URL pública; estas políticas solo controlan quién sube, lista y
-- borra archivos: cada persona, únicamente dentro de su propia carpeta
create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Listar es necesario para borrar las fotos anteriores
create policy "Users can list their own avatars"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own avatars"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
