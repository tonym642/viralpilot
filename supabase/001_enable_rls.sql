-- ViralPilot RLS migration
-- Run this AFTER creating your auth user in Supabase Studio
-- (Authentication → Users → Add user → enter your email + password)
--
-- Then replace the placeholder UUID below with that user's ID
-- (find it in Authentication → Users, click the user, copy "User UID")
--
-- Run the whole file in one go in Supabase Studio → SQL Editor.
-- Tables in the list that don't exist yet are skipped with a NOTICE.

-- =========================================================================
-- 0. Set the existing-data owner (REPLACE THIS UUID)
-- =========================================================================
do $$
declare
  owner_id uuid := '09b35568-6d99-4f50-8886-3e23f2b6f91b'; -- <<< REPLACE
begin
  if owner_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'You must replace the placeholder UUID with your auth.users id';
  end if;

  if not exists (select 1 from auth.users where id = owner_id) then
    raise exception 'Auth user % does not exist. Create the user first in Authentication → Users.', owner_id;
  end if;

  perform set_config('viralpilot.owner_id', owner_id::text, true);
end $$;

-- =========================================================================
-- 1–5. For each known table: add user_id, backfill, NOT NULL + default,
--      enable RLS, recreate own-row policies. Skip if the table doesn't exist.
-- =========================================================================
do $$
declare
  t text;
  tables text[] := array[
    'projects',
    'project_interviews',
    'project_messages',
    'project_music_assets',
    'content_items',
    'content_plans'
  ];
  owner_id uuid := current_setting('viralpilot.owner_id')::uuid;
begin
  foreach t in array tables loop
    if to_regclass('public.' || quote_ident(t)) is null then
      raise notice 'Skipping % — table does not exist in public schema', t;
      continue;
    end if;

    -- Add user_id (idempotent)
    execute format(
      'alter table public.%I add column if not exists user_id uuid references auth.users(id) on delete cascade',
      t
    );

    -- Backfill any NULL user_id rows to the chosen owner
    execute format('update public.%I set user_id = $1 where user_id is null', t)
      using owner_id;

    -- NOT NULL + default to auth.uid() so future inserts auto-stamp the user
    execute format(
      'alter table public.%I alter column user_id set not null, alter column user_id set default auth.uid()',
      t
    );

    -- Enable RLS
    execute format('alter table public.%I enable row level security', t);

    -- Drop + recreate own-row policies for all four operations
    execute format('drop policy if exists %I on public.%I', 'own ' || t || ': select', t);
    execute format('drop policy if exists %I on public.%I', 'own ' || t || ': insert', t);
    execute format('drop policy if exists %I on public.%I', 'own ' || t || ': update', t);
    execute format('drop policy if exists %I on public.%I', 'own ' || t || ': delete', t);

    execute format(
      'create policy %I on public.%I for select using (auth.uid() = user_id)',
      'own ' || t || ': select', t
    );
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
      'own ' || t || ': insert', t
    );
    execute format(
      'create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      'own ' || t || ': update', t
    );
    execute format(
      'create policy %I on public.%I for delete using (auth.uid() = user_id)',
      'own ' || t || ': delete', t
    );

    raise notice 'Migrated table: %', t;
  end loop;
end $$;

-- =========================================================================
-- Done. Verify with:
--   select tablename, rowsecurity from pg_tables where schemaname = 'public';
-- =========================================================================
