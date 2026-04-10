import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export async function POST(request: Request) {
  const body = await request.json()
  const { projectId, details } = body

  if (!projectId || !details) {
    return NextResponse.json(
      { success: false, error: 'projectId and details are required' },
      { status: 400 },
    )
  }

  // Check if an interview row already exists for this project
  const { data: existing } = await supabaseAdmin
    .from('project_interviews')
    .select('id, structured_strategy')
    .eq('project_id', projectId)
    .limit(1)

  const row = existing?.[0]

  if (row) {
    // Merge details into structured_strategy, preserving other keys
    const current = (row.structured_strategy as Record<string, unknown>) ?? {}
    const merged = { ...current, project_details: details }

    const { error } = await supabaseAdmin
      .from('project_interviews')
      .update({ structured_strategy: merged })
      .eq('id', row.id)

    if (error) {
      console.error('Save details error:', error)
      return NextResponse.json({ success: false, error: 'Failed to save details' }, { status: 500 })
    }
  } else {
    // Create a new interview row with the details
    const { error } = await supabaseAdmin
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
