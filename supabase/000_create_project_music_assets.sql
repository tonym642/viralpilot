-- Creates project_music_assets — backing table for /api/save-lyrics.
-- Run this BEFORE 001_enable_rls.sql so the RLS migration covers it too.
-- Schema mirrors the comment in app/api/save-lyrics/route.ts.

create table if not exists public.project_music_assets (
  id                            uuid primary key default gen_random_uuid(),
  project_id                    uuid not null references public.projects(id) on delete cascade,
  lyrics_text                   text,
  lyrics_summary                text,
  song_upload_status            text default 'none',
  video_upload_status           text default 'none',
  reference_video_upload_status text default 'none',
  created_at                    timestamp default now(),
  updated_at                    timestamp default now()
);

-- One asset row per project (route uses upsert on project_id)
alter table public.project_music_assets
  drop constraint if exists project_music_assets_project_unique;

alter table public.project_music_assets
  add constraint project_music_assets_project_unique unique (project_id);
