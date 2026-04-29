import { NextResponse } from 'next/server'
import { withAuth } from '@/src/lib/api-auth'

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const body = await request.json()
  const { projectId, archived } = body

  if (!projectId || archived === undefined) {
    return NextResponse.json(
      { success: false, error: 'projectId and archived are required' },
      { status: 400 }
    )
  }

  const { error } = await supabase
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
