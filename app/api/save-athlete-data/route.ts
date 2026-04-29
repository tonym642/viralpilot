import { NextResponse } from 'next/server'
import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'

export async function POST(request: Request) {
  try {
    const auth = await withAuth()
    if ('error' in auth) return auth.error
    const { supabase } = auth

    const { projectId, section, data } = await request.json()

    if (!projectId || !section || !data) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const ownershipError = await requireProjectOwnership(projectId, supabase)
    if (ownershipError) return ownershipError

    const { data: existing } = await supabase
      .from('project_interviews')
      .select('id, structured_strategy')
      .eq('project_id', projectId)
      .single()

    const currentData = (existing?.structured_strategy as Record<string, unknown>) || {}
    const updatedData = { ...currentData, [`athlete_${section}`]: data }

    if (existing) {
      const { error } = await supabase
        .from('project_interviews')
        .update({
          structured_strategy: updatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase
        .from('project_interviews')
        .insert({
          project_id: projectId,
          structured_strategy: updatedData,
          interview_completed: false,
          updated_at: new Date().toISOString(),
        })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Save athlete data error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
