/*
  Required Supabase table — run this SQL in the Supabase SQL Editor:

  create table project_music_assets (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    lyrics_text text,
    lyrics_summary text,
    song_upload_status text default 'none',
    video_upload_status text default 'none',
    reference_video_upload_status text default 'none',
    created_at timestamp default now(),
    updated_at timestamp default now()
  );

  -- One row per project
  alter table project_music_assets add constraint project_music_assets_project_unique unique (project_id);
*/

import { NextResponse } from 'next/server'
import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const body = await request.json()
  const { projectId, lyricsText } = body

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: 'projectId is required' },
      { status: 400 }
    )
  }

  const ownershipError = await requireProjectOwnership(projectId, supabase)
  if (ownershipError) return ownershipError

  const { data, error } = await supabase
    .from('project_music_assets')
    .upsert(
      {
        project_id: projectId,
        lyrics_text: lyricsText || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Save lyrics error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, assets: data })
}
