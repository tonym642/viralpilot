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

import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'
import { buildStrategyPromptBlock, buildMusicContextPromptBlock, buildInsightsPromptBlock, isMusicMode, type StructuredStrategy, type AiInsights } from '@/src/lib/strategy'

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const body = await request.json()
  const { projectId, projectName, description } = body

  if (!projectId || !projectName) {
    return Response.json(
      { success: false, error: 'projectId and projectName are required' },
      { status: 400 }
    )
  }

  const ownershipError = await requireProjectOwnership(projectId, supabase)
  if (ownershipError) return ownershipError

  const { data: proj } = await supabase
    .from('projects')
    .select('mode, lyrics_text, song_style')
    .eq('id', projectId)
    .single()

  const projectMode = proj?.mode || null

  const { data: interview } = await supabase
    .from('project_interviews')
    .select('raw_strategy_text, structured_strategy, context_summary, ai_insights')
    .eq('project_id', projectId)
    .limit(1)
    .single()

  const rawStrategy = interview?.raw_strategy_text || interview?.context_summary || null
  const structured = (interview?.structured_strategy as StructuredStrategy) || null
  const insights = (interview?.ai_insights as AiInsights) || null
  const strategyBlock = buildStrategyPromptBlock(rawStrategy, structured)
  const insightsBlock = buildInsightsPromptBlock(insights)

  let musicBlock = ''
  if (isMusicMode(projectMode)) {
    musicBlock = buildMusicContextPromptBlock(proj?.lyrics_text || null, proj?.song_style || null)
  }

  const systemPrompt = `You are ViralPilot, an expert in viral content strategy. Generate a 30-day content plan.

${strategyBlock ? `The user has a saved strategy for this project. You MUST align every day of the plan with this strategy — matching the tone, audience, platforms, goals, CTA style, and content pillars described below.\n\n${strategyBlock}\n\n` : ''}${insightsBlock ? `${insightsBlock}\n\n` : ''}${musicBlock ? `${musicBlock}\n\n` : ''}Return ONLY JSON in this format:
[
  {
    "day": 1,
    "title": "Short hook video",
    "description": "Emotional intro clip with strong hook",
    "platform": "TikTok"
  }
]

Rules:
- Create exactly 30 days
- Each day must clearly reflect the strategy's tone, audience, and goals
- Distribute content across the strategy's preferred platforms
- Vary content types using the strategy's content pillars
- Include the strategy's CTA style naturally in descriptions
- Reference the brand angle / story where relevant
- If lyrics are provided, use themes, mood, and memorable lines to inspire content ideas`

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Create a 30-day content plan for this project:\n\nName: ${projectName}\nMode: ${projectMode || 'General'}\nDescription: ${description || 'No description'}`,
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

  await supabase
    .from('content_plans')
    .delete()
    .eq('project_id', projectId)

  const rows = plan.map((item) => ({
    project_id: projectId,
    day: item.day,
    title: item.title,
    description: item.description,
    platform: item.platform,
  }))

  const { error: insertError } = await supabase
    .from('content_plans')
    .insert(rows)

  if (insertError) {
    console.error('Supabase insert error:', insertError)
    return Response.json(
      { success: false, error: 'Failed to save plan' },
      { status: 500 }
    )
  }

  return Response.json({
    success: true,
    plan,
    generatedFromStrategy: !!strategyBlock,
  })
}
