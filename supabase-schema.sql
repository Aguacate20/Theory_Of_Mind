-- Run this in Supabase SQL Editor (once, before launch)

create table if not exists public.players (
  id          text primary key,
  name        text not null,
  height      integer default 0,
  zone        integer default 0,
  energy      integer default 100,
  correct     integer default 0,
  total       integer default 0,
  updated_at  timestamptz default now()
);

-- Enable Row Level Security (allow all reads, allow insert/update by anyone)
alter table public.players enable row level security;

create policy "Anyone can read players"
  on public.players for select using (true);

create policy "Anyone can upsert own player"
  on public.players for insert with check (true);

create policy "Anyone can update own player"
  on public.players for update using (true);

-- Enable realtime
alter publication supabase_realtime add table public.players;
