/*
  Required columns on project_interviews:
  -- alter table project_interviews add column if not exists ai_insights jsonb;
*/

import { NextResponse } from 'next/server'
import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'
import { buildRawStrategyText, buildStructuredStrategy } from '@/src/lib/strategy'

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const body = await request.json()
  const { projectId, answers } = body

  if (!projectId || !answers) {
    return NextResponse.json(
      { success: false, error: 'projectId and answers are required' },
      { status: 400 }
    )
  }

  const ownershipError = await requireProjectOwnership(projectId, supabase)
  if (ownershipError) return ownershipError

  const summary = [
    answers.goal && `Goal: ${answers.goal}`,
    answers.audience && `Audience: ${answers.audience}`,
    answers.tone && `Tone: ${answers.tone}`,
    answers.content_style && `Style: ${answers.content_style}`,
    answers.platform_focus && `Platform: ${answers.platform_focus}`,
    answers.cta && `CTA: ${answers.cta}`,
    answers.song_meaning && `Meaning: ${answers.song_meaning}`,
    answers.differentiator && `Differentiator: ${answers.differentiator}`,
    answers.assets_preference && `Assets: ${answers.assets_preference}`,
  ].filter(Boolean).join('. ')

  const rawStrategyText = buildRawStrategyText(answers)
  const structuredStrategy = buildStructuredStrategy(answers)

  const upsertData: Record<string, unknown> = {
    project_id: projectId,
    goal: answers.goal,
    audience: answers.audience,
    tone: answers.tone,
    content_style: answers.content_style,
    platform_focus: answers.platform_focus,
    cta: answers.cta,
    song_meaning: answers.song_meaning,
    differentiator: answers.differentiator,
    assets_preference: answers.assets_preference || null,
    context_summary: summary,
    raw_strategy_text: rawStrategyText,
    structured_strategy: structuredStrategy,
    interview_completed: true,
    strategy_status: null,
    ai_insights: null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('project_interviews')
    .upsert(upsertData, { onConflict: 'project_id' })
    .select()
    .single()

  if (error) {
    console.error('Save interview error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  const projectUpdate: Record<string, unknown> = {}
  if (answers.song_style) projectUpdate.song_style = answers.song_style
  if (answers.lyrics_text) projectUpdate.lyrics_text = answers.lyrics_text

  if (Object.keys(projectUpdate).length > 0) {
    await supabase
      .from('projects')
      .update(projectUpdate)
      .eq('id', projectId)
  }

  return NextResponse.json({ success: true, interview: data })
}
