import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export async function POST(request: Request) {
  const body = await request.json()
  const { projectId, archived } = body

  if (!projectId || archived === undefined) {
    return NextResponse.json(
      { success: false, error: 'projectId and archived are required' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('projects')
    .update({ archived: !!archived })
    .eq('id', projectId)

  if (error) {
    console.error('Archive project error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
