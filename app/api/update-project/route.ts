import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export async function POST(request: Request) {
  const body = await request.json()
  const { id, name, type, description } = body

  if (!id || !name) {
    return NextResponse.json(
      { success: false, error: 'id and name are required' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('projects')
    .update({ name, type, description })
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
