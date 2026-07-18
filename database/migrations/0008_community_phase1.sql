-- Migration 0008: Community Phase 1 (Votes, Bookmarks, Accepted Answers)
begin;

-- Add new columns to existing tables
alter table public.community_posts
  add column if not exists upvotes int not null default 0,
  add column if not exists downvotes int not null default 0,
  add column if not exists score int not null default 0; -- score = upvotes - downvotes

alter table public.community_replies
  add column if not exists upvotes int not null default 0,
  add column if not exists downvotes int not null default 0,
  add column if not exists score int not null default 0,
  add column if not exists is_accepted boolean not null default false;

-- Create community_votes table
create table if not exists public.community_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  reply_id uuid references public.community_replies(id) on delete cascade,
  vote_type smallint not null check (vote_type in (1, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Ensure a user can only vote once per post OR per reply
  check (
    (post_id is not null and reply_id is null) or 
    (post_id is null and reply_id is not null)
  )
);

create unique index if not exists idx_community_votes_post_user 
  on public.community_votes(user_id, post_id) where post_id is not null;

create unique index if not exists idx_community_votes_reply_user 
  on public.community_votes(user_id, reply_id) where reply_id is not null;

-- Create community_bookmarks table
create table if not exists public.community_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, post_id)
);

-- RLS setup
alter table public.community_votes enable row level security;
alter table public.community_bookmarks enable row level security;

-- Policies for community_votes
create policy "Users can read all votes"
  on public.community_votes for select to authenticated using (true);

create policy "Users can insert their own votes"
  on public.community_votes for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own votes"
  on public.community_votes for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own votes"
  on public.community_votes for delete to authenticated
  using (user_id = auth.uid());

-- Policies for community_bookmarks
create policy "Users can read their own bookmarks"
  on public.community_bookmarks for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own bookmarks"
  on public.community_bookmarks for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own bookmarks"
  on public.community_bookmarks for delete to authenticated
  using (user_id = auth.uid());

commit;
