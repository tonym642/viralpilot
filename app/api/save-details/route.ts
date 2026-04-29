import { NextResponse } from 'next/server'
import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const body = await request.json()
  const { projectId, details } = body

  if (!projectId || !details) {
    return NextResponse.json(
      { success: false, error: 'projectId and details are required' },
      { status: 400 },
    )
  }

  const ownershipError = await requireProjectOwnership(projectId, supabase)
  if (ownershipError) return ownershipError

  const { data: existing } = await supabase
    .from('project_interviews')
    .select('id, structured_strategy')
    .eq('project_id', projectId)
    .limit(1)

  const row = existing?.[0]

  if (row) {
    const current = (row.structured_strategy as Record<string, unknown>) ?? {}
    const merged = { ...current, project_details: details }

    const { error } = await supabase
      .from('project_interviews')
      .update({ structured_strategy: merged })
      .eq('id', row.id)

    if (error) {
      console.error('Save details error:', error)
      return NextResponse.json({ success: false, error: 'Failed to save details' }, { status: 500 })
    }
  } else {
    const { error } = await supabase
      .from('project_interviews')
      .insert({
        project_id: projectId,
        structured_strategy: { project_details: details },
      })

    if (error) {
      console.error('Save details insert error:', error)
      return NextResponse.json({ success: false, error: 'Failed to save details' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
