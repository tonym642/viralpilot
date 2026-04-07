/*
  Required Supabase table — run this SQL in the Supabase SQL Editor:

  create table project_messages (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    role text not null,
    content text not null,
    created_at timestamp default now()
  );
*/

import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export async function POST(request: Request) {
  const body = await request.json()
  const { projectId, message } = body

  if (!projectId || !message) {
    return Response.json(
      { success: false, error: 'projectId and message are required' },
      { status: 400 }
    )
  }

  // Save user message
  const { error: insertError } = await supabaseAdmin
    .from('project_messages')
    .insert({ project_id: projectId, role: 'user', content: message })

  if (insertError) {
    console.error('Error saving user message:', insertError)
    return Response.json(
      { success: false, error: 'Failed to save message' },
      { status: 500 }
    )
  }

  // Load recent messages for context
  const { data: recentMessages } = await supabaseAdmin
    .from('project_messages')
    .select('role, content')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(50)

  const openaiMessages = [
    {
      role: 'system' as const,
      content:
        'You are ViralPilot, an AI content strategist helping users create social media content plans, clips, and promotion strategies for their project.',
    },
    ...(recentMessages || []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  // Call OpenAI
  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
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
  const reply = openaiData.choices?.[0]?.message?.content || 'No response.'

  // Save assistant reply
  await supabaseAdmin
    .from('project_messages')
    .insert({ project_id: projectId, role: 'assistant', content: reply })

  return Response.json({ success: true, reply })
}
