-- Run once in the Supabase SQL Editor before publishing the app.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('card-media', 'card-media', true, 10485760, array['image/jpeg']::text[])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.shared_cards (
  id text primary key check (id ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{10}$'),
  title text not null check (char_length(title) <= 40),
  note_text text not null check (char_length(note_text) <= 200),
  card_images text[] not null check (cardinality(card_images) = 3),
  main_photo text not null,
  colors jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.shared_cards enable row level security;
revoke all on table public.shared_cards from anon, authenticated;

create or replace function public.create_shared_card(
  p_id text,
  p_title text,
  p_note_text text,
  p_card_images text[],
  p_main_photo text,
  p_colors jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_id !~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{10}$' then
    raise exception 'Invalid card id';
  end if;
  if char_length(p_title) > 40 or char_length(p_note_text) > 200 or cardinality(p_card_images) <> 3 then
    raise exception 'Invalid card data';
  end if;

  insert into public.shared_cards (id, title, note_text, card_images, main_photo, colors)
  values (p_id, p_title, p_note_text, p_card_images, p_main_photo, p_colors);

  return p_id;
end;
$$;

create or replace function public.get_shared_card(p_id text)
returns table (
  title text,
  note_text text,
  card_images text[],
  main_photo text,
  colors jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.title, c.note_text, c.card_images, c.main_photo, c.colors
  from public.shared_cards as c
  where c.id = p_id
    and p_id ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{10}$'
$$;

revoke all on function public.create_shared_card(text, text, text, text[], text, jsonb) from public, anon, authenticated;
revoke all on function public.get_shared_card(text) from public, anon, authenticated;
grant execute on function public.create_shared_card(text, text, text, text[], text, jsonb) to anon;
grant execute on function public.get_shared_card(text) to anon;

drop policy if exists "Anonymous uploads for shared cards" on storage.objects;
create policy "Anonymous uploads for shared cards"
on storage.objects for insert to anon
with check (
  bucket_id = 'card-media'
  and cardinality(storage.foldername(name)) = 1
  and (storage.foldername(name))[1] ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{10}$'
  and storage.filename(name) in ('card-1.jpg', 'card-2.jpg', 'card-3.jpg', 'main-photo.jpg')
);
