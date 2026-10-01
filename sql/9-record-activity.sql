alter table public.records add column if not exists felt_activity smallint
  check (felt_activity between 0 and 3);
