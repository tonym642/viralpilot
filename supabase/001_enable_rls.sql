-- ViralPilot RLS migration
-- Run this AFTER creating your auth user in Supabase Studio
-- (Authentication → Users → Add user → enter your email + password)
--
-- Then replace the placeholder UUID below with that user's ID
-- (find it in Authentication → Users, click the user, copy "User UID")
--
-- Run the whole file in one go in Supabase Studio → SQL Editor.

-- =========================================================================
-- 0. Set the existing-data owner (REPLACE THIS UUID)
-- =========================================================================
do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000000'; -- <<< REPLACE
begin
  if owner_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'You must replace the placeholder UUID with your auth.users id';
  end if;

  if not exists (select 1 from auth.users where id = owner_id) then
    raise exception 'Auth user % does not exist. Create the user first in Authentication → Users.', owner_id;
  end if;

  -- Stash the chosen owner so the rest of the script can read it.
  perform set_config('viralpilot.owner_id', owner_id::text, true);
end $$;

-- =========================================================================
-- 1. Add user_id column to every table (idempotent)
-- =========================================================================
alter table public.projects              add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.project_interviews    add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.project_messages      add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.project_music_assets  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.content_items         add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.content_plans         add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- =========================================================================
-- 2. Backfill existing rows to the chosen owner
-- =========================================================================
do $$
declare
  owner_id uuid := current_setting('viralpilot.owner_id')::uuid;
begin
  update public.projects             set user_id = owner_id where user_id is null;
  update public.project_interviews   set user_id = owner_id where user_id is null;
  update public.project_messages     set user_id = owner_id where user_id is null;
  update public.project_music_assets set user_id = owner_id where user_id is null;
  update public.content_items        set user_id = owner_id where user_id is null;
  update public.content_plans        set user_id = owner_id where user_id is null;
end $$;

-- =========================================================================
-- 3. Enforce NOT NULL + default to auth.uid() for new rows
-- =========================================================================
alter table public.projects              alter column user_id set not null, alter column user_id set default auth.uid();
alter table public.project_interviews    alter column user_id set not null, alter column user_id set default auth.uid();
alter table public.project_messages      alter column user_id set not null, alter column user_id set default auth.uid();
alter table public.project_music_assets  alter column user_id set not null, alter column user_id set default auth.uid();
alter table public.content_items         alter column user_id set not null, alter column user_id set default auth.uid();
alter table public.content_plans         alter column user_id set not null, alter column user_id set default auth.uid();

-- =========================================================================
-- 4. Enable RLS on every table
-- =========================================================================
alter table public.projects              enable row level security;
alter table public.project_interviews    enable row level security;
alter table public.project_messages      enable row level security;
alter table public.project_music_assets  enable row level security;
alter table public.content_items         enable row level security;
alter table public.content_plans         enable row level security;

-- =========================================================================
-- 5. Policies — own-row by user_id, all four operations
--    Drop-then-create makes this re-runnable.
-- =========================================================================

-- projects
drop policy if exists "own projects: select" on public.projects;
drop policy if exists "own projects: insert" on public.projects;
drop policy if exists "own projects: update" on public.projects;
drop policy if exists "own projects: delete" on public.projects;
create policy "own projects: select" on public.projects for select using  (auth.uid() = user_id);
create policy "own projects: insert" on public.projects for insert with check (auth.uid() = user_id);
create policy "own projects: update" on public.projects for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own projects: delete" on public.projects for delete using  (auth.uid() = user_id);

-- project_interviews
drop policy if exists "own project_interviews: select" on public.project_interviews;
drop policy if exists "own project_interviews: insert" on public.project_interviews;
drop policy if exists "own project_interviews: update" on public.project_interviews;
drop policy if exists "own project_interviews: delete" on public.project_interviews;
create policy "own project_interviews: select" on public.project_interviews for select using  (auth.uid() = user_id);
create policy "own project_interviews: insert" on public.project_interviews for insert with check (auth.uid() = user_id);
create policy "own project_interviews: update" on public.project_interviews for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own project_interviews: delete" on public.project_interviews for delete using  (auth.uid() = user_id);

-- project_messages
drop policy if exists "own project_messages: select" on public.project_messages;
drop policy if exists "own project_messages: insert" on public.project_messages;
drop policy if exists "own project_messages: update" on public.project_messages;
drop policy if exists "own project_messages: delete" on public.project_messages;
create policy "own project_messages: select" on public.project_messages for select using  (auth.uid() = user_id);
create policy "own project_messages: insert" on public.project_messages for insert with check (auth.uid() = user_id);
create policy "own project_messages: update" on public.project_messages for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own project_messages: delete" on public.project_messages for delete using  (auth.uid() = user_id);

-- project_music_assets
drop policy if exists "own project_music_assets: select" on public.project_music_assets;
drop policy if exists "own project_music_assets: insert" on public.project_music_assets;
drop policy if exists "own project_music_assets: update" on public.project_music_assets;
drop policy if exists "own project_music_assets: delete" on public.project_music_assets;
create policy "own project_music_assets: select" on public.project_music_assets for select using  (auth.uid() = user_id);
create policy "own project_music_assets: insert" on public.project_music_assets for insert with check (auth.uid() = user_id);
create policy "own project_music_assets: update" on public.project_music_assets for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own project_music_assets: delete" on public.project_music_assets for delete using  (auth.uid() = user_id);

-- content_items
drop policy if exists "own content_items: select" on public.content_items;
drop policy if exists "own content_items: insert" on public.content_items;
drop policy if exists "own content_items: update" on public.content_items;
drop policy if exists "own content_items: delete" on public.content_items;
create policy "own content_items: select" on public.content_items for select using  (auth.uid() = user_id);
create policy "own content_items: insert" on public.content_items for insert with check (auth.uid() = user_id);
create policy "own content_items: update" on public.content_items for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own content_items: delete" on public.content_items for delete using  (auth.uid() = user_id);

-- content_plans
drop policy if exists "own content_plans: select" on public.content_plans;
drop policy if exists "own content_plans: insert" on public.content_plans;
drop policy if exists "own content_plans: update" on public.content_plans;
drop policy if exists "own content_plans: delete" on public.content_plans;
create policy "own content_plans: select" on public.content_plans for select using  (auth.uid() = user_id);
create policy "own content_plans: insert" on public.content_plans for insert with check (auth.uid() = user_id);
create policy "own content_plans: update" on public.content_plans for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own content_plans: delete" on public.content_plans for delete using  (auth.uid() = user_id);

-- =========================================================================
-- Done. Verify with:
--   select tablename, rowsecurity from pg_tables where schemaname = 'public';
-- =========================================================================
