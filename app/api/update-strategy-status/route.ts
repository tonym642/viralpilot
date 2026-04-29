import { NextResponse } from 'next/server'
import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'
import { generateAiInsights } from '@/src/lib/strategy'

const VALID_STATUSES = ['audited', 'approved']

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const body = await request.json()
  const { projectId, status } = body

  if (!projectId || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { success: false, error: 'projectId and valid status are required' },
      { status: 400 }
    )
  }

  const ownershipError = await requireProjectOwnership(projectId, supabase)
  if (ownershipError) return ownershipError

  const updateData: Record<string, unknown> = {
    strategy_status: status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'audited') {
    const { data: interview } = await supabase
      .from('project_interviews')
      .select('goal, audience, tone, content_style, platform_focus, cta, song_meaning, differentiator')
      .eq('project_id', projectId)
      .single()

    if (interview) {
      const insights = await generateAiInsights(interview as Record<string, string>)
      if (insights) {
        updateData.ai_insights = insights
      }
    }
  }

  const { data, error } = await supabase
    .from('project_interviews')
    .update(updateData)
    .eq('project_id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Update strategy status error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, interview: data })
}
