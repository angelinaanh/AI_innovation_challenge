-- Migration 0009: Community Storage
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community_media', 
  'community_media', 
  true,
  20971520, -- 20MB in bytes
  '{"image/*","video/*"}'
) on conflict (id) do nothing;

create policy "Community Media Public Access" 
  on storage.objects for select 
  using (bucket_id = 'community_media');

create policy "Community Media Auth Insert" 
  on storage.objects for insert 
  to authenticated 
  with check (bucket_id = 'community_media');

commit;
