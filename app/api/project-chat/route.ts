import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'
import { buildStrategyPromptBlock, buildInsightsPromptBlock, buildMusicContextPromptBlock, isMusicMode, type StructuredStrategy, type AiInsights } from '@/src/lib/strategy'

const STRATEGY_FIELDS = ['goal', 'audience', 'tone', 'content_style', 'platform_focus', 'cta', 'song_meaning', 'differentiator', 'assets_preference']

const RECOMMENDATION_KEYWORDS = [
  'recommend', 'improve', 'suggest', 'change', 'update', 'fix',
  'better', 'optimize', 'refine', 'adjust', 'enhance', 'review',
]

function looksLikeRecommendationRequest(message: string): boolean {
  const lower = message.toLowerCase()
  return RECOMMENDATION_KEYWORDS.some((kw) => lower.includes(kw))
}

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const body = await request.json()
  const { projectId, message } = body

  if (!projectId || !message) {
    return Response.json(
      { success: false, error: 'projectId and message are required' },
      { status: 400 }
    )
  }

  const ownershipError = await requireProjectOwnership(projectId, supabase)
  if (ownershipError) return ownershipError

  const { error: insertError } = await supabase
    .from('project_messages')
    .insert({ project_id: projectId, role: 'user', content: message })

  if (insertError) {
    console.error('Error saving user message:', insertError)
    return Response.json(
      { success: false, error: 'Failed to save message' },
      { status: 500 }
    )
  }

  const [{ data: proj }, { data: interview }, { data: recentMessages }] = await Promise.all([
    supabase
      .from('projects')
      .select('name, mode, description, lyrics_text, song_style')
      .eq('id', projectId)
      .single(),
    supabase
      .from('project_interviews')
      .select('raw_strategy_text, structured_strategy, ai_insights, context_summary')
      .eq('project_id', projectId)
      .limit(1)
      .single(),
    supabase
      .from('project_messages')
      .select('role, content')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(50),
  ])

  const rawStrategy = interview?.raw_strategy_text || interview?.context_summary || null
  const structured = (interview?.structured_strategy as StructuredStrategy) || null
  const insights = (interview?.ai_insights as AiInsights) || null
  const strategyBlock = buildStrategyPromptBlock(rawStrategy, structured)
  const insightsBlock = buildInsightsPromptBlock(insights)

  let musicBlock = ''
  if (isMusicMode(proj?.mode)) {
    musicBlock = buildMusicContextPromptBlock(proj?.lyrics_text || null, proj?.song_style || null)
  }

  const contextSections = [
    `Project: ${proj?.name || 'Unknown'} (${proj?.mode || 'General'})`,
    proj?.description ? `Description: ${proj.description}` : '',
    strategyBlock,
    insightsBlock,
    musicBlock,
  ].filter(Boolean).join('\n\n')

  const wantsRecommendations = looksLikeRecommendationRequest(message)

  const recommendationInstructions = wantsRecommendations ? `

When giving strategy recommendations, you MUST return a JSON object with this exact structure:
{
  "text": "Your introduction or summary text here (plain text, no markdown)",
  "recommendations": [
    {
      "title": "Short title for this recommendation",
      "recommendation": "1-2 sentence explanation of what to change and why",
      "targetField": "one of: ${STRATEGY_FIELDS.join(', ')}",
      "suggestedValue": "The exact new value to use for that field"
    }
  ]
}

Rules for recommendations:
- Each recommendation must map to exactly one targetField
- suggestedValue should be a clean, concise value (not a paragraph)
- Include 2-5 recommendations
- Only recommend changes that would meaningfully improve the strategy
- Return ONLY the JSON object, nothing else` : ''

  const systemPrompt = `You are ViralPilot, an AI content strategist. You help users create social media content plans, hooks, scripts, and promotion strategies.

You have full context about this project's strategy, AI insights, and creative inputs. Use them to give specific, actionable advice — not generic suggestions.

Do not use markdown formatting. No **, ##, ###. Write in plain text with clean line breaks.
${recommendationInstructions}

${contextSections}`

  const openaiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...(recentMessages || []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

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
  const rawReply = openaiData.choices?.[0]?.message?.content || 'No response.'

  let reply = rawReply
  let recommendations = null

  if (wantsRecommendations) {
    try {
      const cleaned = rawReply.replace(/```json\n?|```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)
      if (parsed.text && Array.isArray(parsed.recommendations)) {
        reply = parsed.text
        recommendations = parsed.recommendations.filter(
          (r: { targetField?: string }) => r.targetField && STRATEGY_FIELDS.includes(r.targetField)
        )
        if (recommendations.length === 0) recommendations = null
      }
    } catch {
      // Not valid JSON — use raw reply as plain text
    }
  }

  const savedContent = recommendations
    ? `${reply}\n<!--RECS:${JSON.stringify(recommendations)}-->`
    : reply

  await supabase
    .from('project_messages')
    .insert({ project_id: projectId, role: 'assistant', content: savedContent })

  return Response.json({ success: true, reply, recommendations })
}
