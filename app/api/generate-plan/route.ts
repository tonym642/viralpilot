/*
  Required Supabase table — run this SQL in the Supabase SQL Editor:

  create table content_plans (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    day integer not null,
    title text not null,
    description text not null,
    platform text not null,
    created_at timestamp default now()
  );
*/

import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export async function POST(request: Request) {
  const body = await request.json()
  const { projectId, projectName, projectType, description } = body

  if (!projectId || !projectName) {
    return Response.json(
      { success: false, error: 'projectId and projectName are required' },
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
          content: `You are ViralPilot, an expert in viral content strategy. Generate a 30-day content plan.

Return ONLY JSON in this format:
[
  {
    "day": 1,
    "title": "Short hook video",
    "description": "Emotional intro clip with strong hook",
    "platform": "TikTok"
  }
]`,
        },
        {
          role: 'user',
          content: `Create a 30-day content plan for this project:\n\nName: ${projectName}\nType: ${projectType || 'General'}\nDescription: ${description || 'No description'}`,
        },
      ],
    }),
  })

  if (!openaiRes.ok) {
    const errBody = await openaiRes.text()
    console.error('OpenAI error:', errBody)
    return Response.json(
      { success: false, error: 'AI request failed' },
      { status: 500 }
    )
  }

  const openaiData = await openaiRes.json()
  const raw = openaiData.choices?.[0]?.message?.content || ''

  let plan: { day: number; title: string; description: string; platform: string }[]
  try {
    const cleaned = raw.replace(/```json\n?|```\n?/g, '').trim()
    plan = JSON.parse(cleaned)
  } catch (e) {
    console.error('Failed to parse plan JSON:', e, raw)
    return Response.json(
      { success: false, error: 'Failed to parse AI response' },
      { status: 500 }
    )
  }

  const rows = plan.map((item) => ({
    project_id: projectId,
    day: item.day,
    title: item.title,
    description: item.description,
    platform: item.platform,
  }))

  const { error: insertError } = await supabaseAdmin
    .from('content_plans')
    .insert(rows)

  if (insertError) {
    console.error('Supabase insert error:', insertError)
    return Response.json(
      { success: false, error: 'Failed to save plan' },
      { status: 500 }
    )
  }

  return Response.json({ success: true, plan })
}
