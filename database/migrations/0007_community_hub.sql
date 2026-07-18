-- Migration 0007: Community Hub feature
begin;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  post_type varchar(50) not null check (post_type in ('question', 'tip', 'guide')),
  grade_level smallint check (grade_level between 1 and 12),
  subject_id uuid references public.subjects(id) on delete set null,
  title varchar(255) not null,
  content text not null,
  view_count int not null default 0,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_community_posts_org on public.community_posts(org_id);
create index if not exists idx_community_posts_grade on public.community_posts(org_id, grade_level);
create index if not exists idx_community_posts_subject on public.community_posts(org_id, subject_id);
create index if not exists idx_community_replies_post on public.community_replies(post_id, created_at);

-- Set up Row Level Security
alter table public.community_posts enable row level security;
alter table public.community_replies enable row level security;

-- Policies for community_posts
create policy "Users can read posts in their organization"
  on public.community_posts for select
  to authenticated
  using (org_id = (select org_id from public.profiles where id = auth.uid()));

create policy "Users can insert posts in their organization"
  on public.community_posts for insert
  to authenticated
  with check (
    org_id = (select org_id from public.profiles where id = auth.uid()) and
    author_id = auth.uid()
  );

create policy "Authors can update their own posts"
  on public.community_posts for update
  to authenticated
  using (author_id = auth.uid());

-- Policies for community_replies
create policy "Users can read replies for posts in their organization"
  on public.community_replies for select
  to authenticated
  using (
    exists (
      select 1 from public.community_posts
      where id = community_replies.post_id and org_id = (select org_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can insert replies to posts in their organization"
  on public.community_replies for insert
  to authenticated
  with check (
    author_id = auth.uid() and
    exists (
      select 1 from public.community_posts
      where id = post_id and org_id = (select org_id from public.profiles where id = auth.uid())
    )
  );

create policy "Authors can update their own replies"
  on public.community_replies for update
  to authenticated
  using (author_id = auth.uid());

commit;
