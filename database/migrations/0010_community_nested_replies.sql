-- Migration 0010: Community Nested Replies
begin;

-- Add parent_id to allow nested replies
alter table public.community_replies
  add column if not exists parent_id uuid references public.community_replies(id) on delete cascade;

-- Create index for faster querying of children
create index if not exists idx_community_replies_parent 
  on public.community_replies(parent_id) where parent_id is not null;

commit;
