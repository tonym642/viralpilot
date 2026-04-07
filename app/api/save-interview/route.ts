/*
  Required Supabase table — run this SQL in the Supabase SQL Editor:

  create table project_interviews (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    goal text,
    audience text,
    tone text,
    content_style text,
    platform_focus text,
    cta text,
    song_meaning text,
    differentiator text,
    assets_preference text,
    context_summary text,
    interview_completed boolean default true,
    created_at timestamp default now()
  );

  -- Add unique constraint so one interview per project
  alter table project_interviews add constraint project_interviews_project_unique unique (project_id);
*/

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

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

  const { data, error } = await supabaseAdmin
    .from('project_interviews')
    .upsert(
      {
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
        interview_completed: true,
      },
      { onConflict: 'project_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Save interview error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, interview: data })
}
