import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { projectId, section, data } = await request.json()

    if (!projectId || !section || !data) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Fetch existing interview row (or create one)
    const { data: existing } = await supabaseAdmin
      .from('project_interviews')
      .select('id, structured_strategy')
      .eq('project_id', projectId)
      .single()

    const currentData = (existing?.structured_strategy as Record<string, unknown>) || {}
    const updatedData = { ...currentData, [`athlete_${section}`]: data }

    if (existing) {
      const { error } = await supabaseAdmin
        .from('project_interviews')
        .update({
          structured_strategy: updatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabaseAdmin
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
