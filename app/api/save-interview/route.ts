/*
  Required columns on project_interviews:
  -- alter table project_interviews add column if not exists ai_insights jsonb;
*/

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { buildRawStrategyText, buildStructuredStrategy } from '@/src/lib/strategy'

export async function POST(request: Request) {
  const body = await request.json()
  const { projectId, answers } = body

  if (!projectId || !answers) {
    return NextResponse.json(
      { success: false, error: 'projectId and answers are required' },
      { status: 400 }
    )
  }

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

  // Reset strategy status when strategy changes — requires re-audit
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

  const { data, error } = await supabaseAdmin
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

  // Save song_style and lyrics_text to the projects table if provided
  const projectUpdate: Record<string, unknown> = {}
  if (answers.song_style) projectUpdate.song_style = answers.song_style
  if (answers.lyrics_text) projectUpdate.lyrics_text = answers.lyrics_text

  if (Object.keys(projectUpdate).length > 0) {
    await supabaseAdmin
      .from('projects')
      .update(projectUpdate)
      .eq('id', projectId)
  }

  return NextResponse.json({ success: true, interview: data })
}
