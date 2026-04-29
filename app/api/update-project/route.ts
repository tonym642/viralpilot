import { NextResponse } from 'next/server'
import { withAuth } from '@/src/lib/api-auth'

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const body = await request.json()
  const { id, name, mode, type, description, lyrics_text, song_style } = body

  if (!id || !name) {
    return NextResponse.json(
      { success: false, error: 'id and name are required' },
      { status: 400 }
    )
  }

  const update: Record<string, unknown> = { name, type, description }
  if (mode !== undefined) {
    update.mode = mode
  }
  if (lyrics_text !== undefined) {
    update.lyrics_text = lyrics_text
  }
  if (song_style !== undefined) {
    update.song_style = song_style
  }

  const { error } = await supabase
    .from('projects')
    .update(update)
    .eq('id', id)

  if (error) {
    console.error('Update project error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
