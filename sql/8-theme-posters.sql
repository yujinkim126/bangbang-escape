-- Only use images supplied or approved by their owner.
alter table public.themes add column if not exists poster_url text;
