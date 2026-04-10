/*
  Required Supabase table — run this SQL in the Supabase SQL Editor:

  create table content_items (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    day integer not null,
    title text not null,
    platform text not null,
    hook text,
    script text,
    caption text,
    hashtags text,
    visual_direction text,
    status text default 'draft',
    created_at timestamp default now()
  );
*/

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

function parseSection(raw: string, key: string, nextKey: string | null): string {
  const start = raw.indexOf(key + ':')
  if (start === -1) return ''
  const after = start + key.length + 1
  const end = nextKey ? raw.indexOf(nextKey + ':') : -1
  return (end === -1 ? raw.slice(after) : raw.slice(after, end)).trim()
}

export async function POST(request: Request) {
  const body = await request.json()
  const { projectId, projectName, projectType, description, day, title, platform } = body

  if (!title || !day || !projectId) {
    return NextResponse.json(
      { success: false, error: 'projectId, day, and title are required' },
      { status: 400 }
    )
  }

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are ViralPilot, an expert content strategist.

Generate content for this plan item. Return ONLY the structured output below with no extra commentary:

HOOK:
(a short attention-grabbing opening line)

SCRIPT:
(a short script or scene direction, 2-4 sentences)

CAPTION:
(a social media caption, 1-2 sentences)

HASHTAGS:
(5-8 relevant hashtags)

VISUAL_DIRECTION:
(brief visual/aesthetic direction, 1-2 sentences)`,
        },
        {
          role: 'user',
          content: `Day: ${day}\nTitle: ${title}\nPlatform: ${platform}\nProject: ${projectName} (${projectType || 'General'})\nDescription: ${description || 'N/A'}`,
        },
      ],
    }),
  })

  if (!openaiRes.ok) {
    const errBody = await openaiRes.text()
    console.error('OpenAI error:', errBody)
    return NextResponse.json(
      { success: false, error: 'AI request failed' },
      { status: 500 }
    )
  }

  const data = await openaiRes.json()
  const content = data.choices?.[0]?.message?.content || ''

  const keys = ['HOOK', 'SCRIPT', 'CAPTION', 'HASHTAGS', 'VISUAL_DIRECTION']
  const hook = parseSection(content, keys[0], keys[1])
  const script = parseSection(content, keys[1], keys[2])
  const caption = parseSection(content, keys[2], keys[3])
  const hashtags = parseSection(content, keys[3], keys[4])
  const visual_direction = parseSection(content, keys[4], null)

  const { data: saved, error: insertError } = await supabaseAdmin
    .from('content_items')
    .upsert(
      {
        project_id: projectId,
        day,
        title,
        platform,
        hook,
        script,
        caption,
        hashtags,
        visual_direction,
        status: 'draft',
      },
      { onConflict: 'project_id,day' }
    )
    .select()
    .single()

  if (insertError) {
    console.error('Supabase insert error:', insertError)
    // Still return the content even if save fails
    return NextResponse.json({ success: true, content, saved: null })
  }

  return NextResponse.json({ success: true, content, saved })
}
