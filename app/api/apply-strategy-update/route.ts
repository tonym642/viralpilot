import { NextResponse } from 'next/server'
import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'
import { buildRawStrategyText, buildStructuredStrategy, generateAiInsights } from '@/src/lib/strategy'

const VALID_FIELDS = ['goal', 'audience', 'tone', 'content_style', 'platform_focus', 'cta', 'song_meaning', 'differentiator', 'assets_preference']

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const body = await request.json()
  const { projectId, field, value } = body

  if (!projectId || !field || value === undefined) {
    return NextResponse.json(
      { success: false, error: 'projectId, field, and value are required' },
      { status: 400 }
    )
  }

  if (!VALID_FIELDS.includes(field)) {
    return NextResponse.json(
      { success: false, error: `Invalid field: ${field}` },
      { status: 400 }
    )
  }

  const ownershipError = await requireProjectOwnership(projectId, supabase)
  if (ownershipError) return ownershipError

  const { data: interview, error: fetchError } = await supabase
    .from('project_interviews')
    .select('*')
    .eq('project_id', projectId)
    .single()

  if (fetchError || !interview) {
    return NextResponse.json(
      { success: false, error: 'Interview not found' },
      { status: 404 }
    )
  }

  const updatedAnswers: Record<string, string> = {}
  for (const f of VALID_FIELDS) {
    updatedAnswers[f] = f === field ? value : (interview[f] || '')
  }

  const rawStrategyText = buildRawStrategyText(updatedAnswers)
  const structuredStrategy = buildStructuredStrategy(updatedAnswers)

  const summary = [
    updatedAnswers.goal && `Goal: ${updatedAnswers.goal}`,
    updatedAnswers.audience && `Audience: ${updatedAnswers.audience}`,
    updatedAnswers.tone && `Tone: ${updatedAnswers.tone}`,
    updatedAnswers.content_style && `Style: ${updatedAnswers.content_style}`,
    updatedAnswers.platform_focus && `Platform: ${updatedAnswers.platform_focus}`,
    updatedAnswers.cta && `CTA: ${updatedAnswers.cta}`,
    updatedAnswers.song_meaning && `Meaning: ${updatedAnswers.song_meaning}`,
    updatedAnswers.differentiator && `Differentiator: ${updatedAnswers.differentiator}`,
  ].filter(Boolean).join('. ')

  const insights = await generateAiInsights(updatedAnswers)

  const updateData: Record<string, unknown> = {
    [field]: value,
    context_summary: summary,
    raw_strategy_text: rawStrategyText,
    structured_strategy: structuredStrategy,
    updated_at: new Date().toISOString(),
  }
  if (insights) {
    updateData.ai_insights = insights
  }

  const { data: updated, error: updateError } = await supabase
    .from('project_interviews')
    .update(updateData)
    .eq('project_id', projectId)
    .select()
    .single()

  if (updateError) {
    console.error('Apply strategy update error:', updateError)
    return NextResponse.json(
      { success: false, error: updateError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, interview: updated })
}
