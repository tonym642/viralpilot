// Strategy helper functions for ViralPilot
// Converts interview answers into structured strategy data and builds AI prompts

export type StructuredStrategy = {
  targetAudience: string | null
  toneOfVoice: string | null
  contentPillars: string[]
  platforms: string[]
  goals: string[]
  offers: string | null
  callToActionStyle: string | null
  brandAngle: string | null
  doRules: string[]
  dontRules: string[]
  postingFrequency: string | null
  notes: string | null
}

export type InterviewAnswers = {
  goal?: string | null
  audience?: string | null
  tone?: string | null
  content_style?: string | null
  platform_focus?: string | null
  cta?: string | null
  song_meaning?: string | null
  differentiator?: string | null
  assets_preference?: string | null
}

/**
 * Parse interview answers into a structured strategy object.
 */
export function buildStructuredStrategy(answers: InterviewAnswers): StructuredStrategy {
  return {
    targetAudience: answers.audience || null,
    toneOfVoice: answers.tone || null,
    contentPillars: answers.content_style ? [answers.content_style] : [],
    platforms: answers.platform_focus ? [answers.platform_focus] : [],
    goals: answers.goal ? [answers.goal] : [],
    offers: null,
    callToActionStyle: answers.cta || null,
    brandAngle: [answers.song_meaning, answers.differentiator].filter(Boolean).join(' — ') || null,
    doRules: [],
    dontRules: [],
    postingFrequency: 'Daily (30-day plan)',
    notes: answers.assets_preference || null,
  }
}

/**
 * Build a human-readable raw strategy text from interview answers.
 */
export function buildRawStrategyText(answers: InterviewAnswers): string {
  const lines: string[] = []
  if (answers.goal) lines.push(`Goal: ${answers.goal}`)
  if (answers.audience) lines.push(`Target Audience: ${answers.audience}`)
  if (answers.tone) lines.push(`Tone: ${answers.tone}`)
  if (answers.content_style) lines.push(`Content Style: ${answers.content_style}`)
  if (answers.platform_focus) lines.push(`Platform Focus: ${answers.platform_focus}`)
  if (answers.cta) lines.push(`Call to Action: ${answers.cta}`)
  if (answers.song_meaning) lines.push(`Song Meaning / Brand Story: ${answers.song_meaning}`)
  if (answers.differentiator) lines.push(`Differentiator: ${answers.differentiator}`)
  if (answers.assets_preference) lines.push(`Assets: ${answers.assets_preference}`)
  return lines.join('\n')
}

/**
 * Build the strategy section for AI prompts (used in plan and content generation).
 */
export function buildStrategyPromptBlock(
  raw: string | null,
  structured: StructuredStrategy | null
): string {
  if (!raw && !structured) return ''

  const parts: string[] = ['--- PROJECT STRATEGY ---']

  if (structured) {
    if (structured.targetAudience) parts.push(`Target Audience: ${structured.targetAudience}`)
    if (structured.toneOfVoice) parts.push(`Tone: ${structured.toneOfVoice}`)
    if (structured.goals.length > 0) parts.push(`Goals: ${structured.goals.join(', ')}`)
    if (structured.contentPillars.length > 0) parts.push(`Content Pillars: ${structured.contentPillars.join(', ')}`)
    if (structured.platforms.length > 0) parts.push(`Platforms: ${structured.platforms.join(', ')}`)
    if (structured.callToActionStyle) parts.push(`CTA Style: ${structured.callToActionStyle}`)
    if (structured.brandAngle) parts.push(`Brand Angle: ${structured.brandAngle}`)
    if (structured.doRules.length > 0) parts.push(`Do: ${structured.doRules.join(', ')}`)
    if (structured.dontRules.length > 0) parts.push(`Don't: ${structured.dontRules.join(', ')}`)
    if (structured.postingFrequency) parts.push(`Posting Frequency: ${structured.postingFrequency}`)
    if (structured.notes) parts.push(`Notes: ${structured.notes}`)
  }

  if (raw) {
    parts.push('')
    parts.push('Full Strategy Context:')
    parts.push(raw)
  }

  parts.push('--- END STRATEGY ---')
  return parts.join('\n')
}

/**
 * Check if the content plan is outdated relative to the strategy.
 * Returns true if strategy was updated after the plan was generated.
 */
export function isPlanOutdated(
  strategyUpdatedAt: string | null,
  planCreatedAt: string | null
): boolean {
  if (!strategyUpdatedAt || !planCreatedAt) return false
  return new Date(strategyUpdatedAt).getTime() > new Date(planCreatedAt).getTime()
}

/**
 * Build a music-context prompt block from lyrics.
 * Formats lyrics for AI consumption with guidance on what to extract.
 */
export function buildMusicContextPromptBlock(
  lyricsText: string | null,
  songStyle: string | null = null
): string {
  const parts: string[] = []

  if (songStyle?.trim()) {
    parts.push(`Song Style: ${songStyle.trim()}`)
  }

  if (lyricsText?.trim()) {
    parts.push(`\nLyrics:\n${lyricsText.trim()}`)
  }

  if (parts.length === 0) return ''

  return `--- SONG CONTEXT ---
The user has provided song details for this project. Use them as core creative inputs.

When generating strategy or content, consider:
- The song's genre, mood, and energy from the style description
- Emotional tone and themes from the lyrics
- Memorable lines that could become hooks or captions
- Visual imagery and content angles inspired by the music
- Audience resonance — who would connect with this sound and these words

${parts.join('\n')}
--- END SONG CONTEXT ---`
}

/**
 * V1 project modes.
 */
export type ProjectMode = 'Music' | 'Athlete'

/**
 * Check if a project is in Music mode.
 */
export function isMusicMode(mode: string | null | undefined): boolean {
  return mode === 'Music'
}
