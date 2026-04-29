import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'

async function loadContext(supabase: SupabaseClient, projectId: string) {
  const [{ data: project }, { data: interviews }] = await Promise.all([
    supabase.from('projects').select('name, description, mode, song_style').eq('id', projectId).single(),
    supabase.from('project_interviews').select('structured_strategy').eq('project_id', projectId).limit(1),
  ])

  const ss = (interviews?.[0]?.structured_strategy as Record<string, unknown>) ?? {}
  const details = (ss.project_details as Record<string, Record<string, unknown>>) ?? {}
  const info = details.info ?? {}
  const questions = details.questions ?? {}
  const lyrics = details.lyrics ?? {}

  const assets = ((ss.project_assets ?? []) as Record<string, unknown>[])
  const analysisAsset = assets.find(
    (a) => a.asset_category === 'analysis' && a.source_step === 'track-analysis',
  )
  const trackAnalysis = (analysisAsset?.metadata_json as Record<string, unknown>) ?? null

  return {
    songTitle: (info.songTitle as string) || project?.name || '',
    artistName: (info.artistName as string) || '',
    genre: (info.genre as string) || '',
    language: (info.language as string) || '',
    description: (info.description as string) || project?.description || '',
    distributionPlatforms: info.distributionPlatforms || [],
    primaryGoal: (questions.primaryGoal as string) || '',
    targetAudience: questions.targetAudience || '',
    contentTone: (questions.contentTone as string) || '',
    platformFocus: questions.platformFocus || [],
    callToAction: (questions.callToAction as string) || '',
    uniqueAngle: (questions.uniqueAngle as string) || '',
    lyricsText: (lyrics.lyricsText as string) || '',
    styleNotes: (lyrics.styleNotes as string) || '',
    trackAnalysis,
  }
}

function buildPrompt(ctx: Awaited<ReturnType<typeof loadContext>>, refinement?: string, existingStrategy?: string) {
  const meta = [
    `Song: ${ctx.songTitle}`,
    ctx.artistName && `Artist: ${ctx.artistName}`,
    ctx.genre && `Genre: ${ctx.genre}`,
    ctx.language && `Language: ${ctx.language}`,
    ctx.description && `Description: ${ctx.description}`,
    ctx.primaryGoal && `Primary Goal: ${ctx.primaryGoal}`,
    ctx.contentTone && `Content Tone: ${ctx.contentTone}`,
    ctx.callToAction && `CTA: ${ctx.callToAction}`,
    ctx.uniqueAngle && `Unique Angle: ${ctx.uniqueAngle}`,
    Array.isArray(ctx.targetAudience) && ctx.targetAudience.length > 0 && `Target Audience: ${ctx.targetAudience.join(', ')}`,
    typeof ctx.targetAudience === 'string' && ctx.targetAudience && `Target Audience: ${ctx.targetAudience}`,
    Array.isArray(ctx.platformFocus) && ctx.platformFocus.length > 0 && `Platform Focus: ${ctx.platformFocus.join(', ')}`,
    Array.isArray(ctx.distributionPlatforms) && (ctx.distributionPlatforms as string[]).length > 0 && `Distribution: ${(ctx.distributionPlatforms as string[]).join(', ')}`,
    ctx.styleNotes && `Style Notes: ${ctx.styleNotes}`,
  ].filter(Boolean).join('\n')

  const trackBlock = ctx.trackAnalysis
    ? `\nTRACK ANALYSIS:\n${JSON.stringify(ctx.trackAnalysis, null, 2)}`
    : '\nNo track analysis available — base strategy on details and lyrics only.'

  const lyricsBlock = ctx.lyricsText ? `\nLYRICS:\n${ctx.lyricsText}` : '\nNo lyrics provided.'

  const refinementBlock = refinement
    ? `\n\nUSER REFINEMENT REQUEST:\n${refinement}\n\nCURRENT STRATEGY:\n${existingStrategy}\n\nApply the refinement to improve the strategy. Return the FULL updated strategy JSON.`
    : ''

  return `You are a music content strategist. Generate a structured content strategy for this music project.

Return ONLY valid JSON with this exact structure:

{
  "whyThisSongWins": "2-3 sentence summary explaining why this song works and what makes it compelling for content",
  "positioning": "How the song/artist should be positioned online",
  "audienceStrategy": {
    "primaryAudience": "Primary audience description",
    "secondaryAudience": "Secondary audience description",
    "audienceReasoning": "Why these audiences connect"
  },
  "contentPillars": [
    { "title": "Pillar name", "description": "What this pillar means" }
  ],
  "platformStrategy": [
    { "platform": "Platform name", "recommendation": "How to use it" }
  ],
  "creativeDirection": {
    "visualDirection": "Visual style recommendation",
    "tone": "Content tone",
    "deliveryStyle": "How content should be delivered",
    "emotionalEnergy": "Emotional energy level and type"
  },
  "hookStrategy": {
    "hookStyles": ["hook style 1", "hook style 2"],
    "strongestAngles": ["angle 1", "angle 2"]
  },
  "postingRhythm": {
    "recommendedPlanLength": "7-day | 14-day | 30-day",
    "cadence": "How often to post",
    "reasoning": "Why this rhythm"
  },
  "priorityRecommendations": ["recommendation 1", "recommendation 2"]
}

INSTRUCTIONS:
- Be specific to THIS song and artist, not generic.
- Use the track analysis data if provided to inform vocal, mood, and style decisions.
- Provide 3-5 content pillars.
- Recommend platforms based on the project's focus and audience.
- Keep recommendations actionable and clear.
- Return ONLY the JSON object. No markdown, no explanation.

PROJECT DATA:
${meta}
${trackBlock}
${lyricsBlock}
${refinementBlock}`
}

async function saveStrategy(supabase: SupabaseClient, projectId: string, strategy: Record<string, unknown>) {
  const { data } = await supabase
    .from('project_interviews')
    .select('id, structured_strategy')
    .eq('project_id', projectId)
    .limit(1)

  const row = data?.[0]
  if (!row) {
    await supabase.from('project_interviews').insert({
      project_id: projectId,
      structured_strategy: { project_strategy: strategy },
    })
  } else {
    const ss = (row.structured_strategy as Record<string, unknown>) ?? {}
    await supabase.from('project_interviews').update({
      structured_strategy: { ...ss, project_strategy: strategy },
    }).eq('id', row.id)
  }
}

export async function POST(request: Request) {
  try {
    const auth = await withAuth()
    if ('error' in auth) return auth.error
    const { supabase } = auth

    const body = await request.json()
    const { projectId, refinement, existingStrategy } = body

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 })
    }

    const ownershipError = await requireProjectOwnership(projectId, supabase)
    if (ownershipError) return ownershipError

    const ctx = await loadContext(supabase, projectId)

    if (!ctx.songTitle && !ctx.lyricsText) {
      return NextResponse.json({ success: false, error: 'Add song details before generating a strategy.' }, { status: 400 })
    }

    const prompt = buildPrompt(ctx, refinement, existingStrategy)

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
      }),
    })

    if (!gptRes.ok) {
      console.error('GPT error:', await gptRes.text())
      return NextResponse.json({ success: false, error: 'Strategy generation failed' }, { status: 500 })
    }

    const gptData = await gptRes.json()
    const raw = gptData.choices?.[0]?.message?.content || ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let strategy: Record<string, unknown>
    try {
      strategy = JSON.parse(cleaned)
    } catch {
      console.error('Strategy JSON parse failed:', raw)
      return NextResponse.json({ success: false, error: 'Failed to parse strategy output' }, { status: 500 })
    }

    await saveStrategy(supabase, projectId, strategy)

    return NextResponse.json({ success: true, strategy })
  } catch (err) {
    console.error('Strategy error:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Strategy generation failed' }, { status: 500 })
  }
}
