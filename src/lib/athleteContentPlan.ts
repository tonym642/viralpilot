// Deterministic content plan generator for Athlete mode — no AI

import type { AthleteStrategyData } from './athleteStrategy'

export type ContentPlanItem = {
  id: string
  day: number
  title: string
  contentType: string
  platform: string
  goal: string
  pillar: string
  hook: string
  concept: string
  cta: string
  status: 'draft' | 'ready' | 'posted'
  generatedContent?: {
    script: string
    caption: string
    hashtags: string[]
    visualDirection: string
    shotIdeas: string[]
    updatedAt: string | null
    version: number
  } | null
}

export type AthleteContentPlanObject = {
  generated: boolean
  generatedAt: string | null
  version: number
  durationDays: number
  status: 'not_started' | 'generated'
  items: ContentPlanItem[]
}

// --- Content type pools by goal ---
const CONTENT_TYPES_BY_GOAL: Record<string, string[]> = {
  'Recruiting Exposure': ['Highlight Clip', 'Training Clip', 'Game Day Post', 'Recap Post', 'Talking Head Clip', 'Behind-the-Scenes Reel', 'Educational Tip', 'Motivation Post'],
  'NIL / Sponsorships': ['Lifestyle Post', 'Behind-the-Scenes Reel', 'Talking Head Clip', 'Training Clip', 'Story Post', 'Highlight Clip', 'Motivation Post', 'Game Day Post'],
  'Personal Brand Growth': ['Story Post', 'Training Clip', 'Motivation Post', 'Lifestyle Post', 'Behind-the-Scenes Reel', 'Talking Head Clip', 'Highlight Clip', 'Educational Tip'],
  'Fan Engagement': ['Behind-the-Scenes Reel', 'Lifestyle Post', 'Talking Head Clip', 'Game Day Post', 'Story Post', 'Training Clip', 'Motivation Post', 'Recap Post'],
  'Highlight Visibility': ['Highlight Clip', 'Recap Post', 'Game Day Post', 'Training Clip', 'Behind-the-Scenes Reel', 'Motivation Post', 'Talking Head Clip', 'Story Post'],
}

const DEFAULT_CONTENT_TYPES = ['Training Clip', 'Highlight Clip', 'Behind-the-Scenes Reel', 'Talking Head Clip', 'Motivation Post', 'Lifestyle Post', 'Story Post', 'Game Day Post']

// --- Platform preferences by content type ---
const PLATFORM_PREFS: Record<string, string[]> = {
  'Highlight Clip': ['Instagram', 'TikTok', 'Hudl'],
  'Training Clip': ['TikTok', 'Instagram', 'YouTube Shorts'],
  'Game Day Post': ['Instagram', 'TikTok', 'X'],
  'Behind-the-Scenes Reel': ['TikTok', 'Instagram'],
  'Talking Head Clip': ['TikTok', 'Instagram', 'YouTube Shorts'],
  'Motivation Post': ['TikTok', 'Instagram'],
  'Story Post': ['TikTok', 'Instagram', 'YouTube Shorts'],
  'Lifestyle Post': ['TikTok', 'Instagram'],
  'Educational Tip': ['TikTok', 'Instagram', 'YouTube Shorts'],
  'Recap Post': ['Instagram', 'TikTok', 'X'],
}

// --- Goal per content type ---
const GOAL_MAP: Record<string, string> = {
  'Highlight Clip': 'Visibility',
  'Training Clip': 'Credibility',
  'Game Day Post': 'Attention',
  'Behind-the-Scenes Reel': 'Connection',
  'Talking Head Clip': 'Authority',
  'Motivation Post': 'Engagement',
  'Story Post': 'Connection',
  'Lifestyle Post': 'Engagement',
  'Educational Tip': 'Authority',
  'Recap Post': 'Visibility',
}

// --- Title templates ---
const TITLE_MAP: Record<string, string[]> = {
  'Highlight Clip': ['Highlight Drop', 'Top Play', 'Game Clip', 'Best Moment'],
  'Training Clip': ['Training Grind', 'Work Session', 'Drill Focus', 'Practice Mode'],
  'Game Day Post': ['Game Day Energy', 'Game Day Prep', 'Matchday Vibes', 'Pre-Game Focus'],
  'Behind-the-Scenes Reel': ['Behind the Work', 'Off Camera', 'The Real Side', 'What You Don\'t See'],
  'Talking Head Clip': ['Real Talk', 'Quick Take', 'My Perspective', 'Straight Up'],
  'Motivation Post': ['Built Different', 'Stay Locked In', 'No Shortcuts', 'The Grind Continues'],
  'Story Post': ['Athlete Story Clip', 'My Journey', 'How It Started', 'The Why'],
  'Lifestyle Post': ['Day in the Life', 'Off the Field', 'Life Update', 'Athlete Life'],
  'Educational Tip': ['Quick Tip', 'How I Do It', 'Pro Tip', 'Learn This'],
  'Recap Post': ['Week Recap', 'Season Check', 'Progress Update', 'Stat Drop'],
}

// --- Hook templates ---
const HOOK_TEMPLATES: Record<string, string[]> = {
  'Highlight Clip': ['Watch this play on repeat', 'They weren\'t ready for this', 'That moment everyone stopped'],
  'Training Clip': ['This rep matters more than you think', 'The work nobody sees', 'What 5 AM looks like'],
  'Game Day Post': ['Game day different', 'Lights on, let\'s go', 'This is what we train for'],
  'Behind-the-Scenes Reel': ['What people don\'t see behind game day', 'The real side of this life', 'Before the lights come on'],
  'Talking Head Clip': ['Something I had to get off my chest', 'Real talk for a second', 'Here\'s what I think about that'],
  'Motivation Post': ['POV: the work starts before the lights come on', 'Built in silence', 'Outwork everyone quietly'],
  'Story Post': ['This is why I play', 'The moment everything changed', 'Where I come from matters'],
  'Lifestyle Post': ['A day in the life of an athlete', 'What the offseason really looks like', 'Athlete life, unfiltered'],
  'Educational Tip': ['One thing that changed my game', 'Try this in your next session', 'Most people get this wrong'],
  'Recap Post': ['Let\'s talk about this week', 'Here\'s where we\'re at', 'Progress check'],
}

// --- Concept templates ---
const CONCEPT_TEMPLATES: Record<string, string[]> = {
  'Highlight Clip': ['Film and edit a vertical highlight clip from a recent game. Use slow-motion on the key moment and add a bold text overlay.', 'Compile 3-4 top plays into a quick-cut highlight reel with music and transitions.'],
  'Training Clip': ['Film a focused training drill from a unique angle. Show intensity and technique with minimal editing.', 'Record a full practice sequence showing work ethic. Add time-lapse for longer segments.'],
  'Game Day Post': ['Capture the pre-game routine from arrival to warm-up. Use vertical format with trending audio.', 'Film the game day atmosphere — locker room, tunnel walk, crowd energy. Keep it raw and authentic.'],
  'Behind-the-Scenes Reel': ['Show the less glamorous side — ice baths, film study, early mornings. Let the audience feel the grind.', 'Film a behind-the-scenes look at a typical day. Include teammates, coaches, and real moments.'],
  'Talking Head Clip': ['Record a direct-to-camera clip sharing a lesson, mindset shift, or response to something relevant. Keep it under 60 seconds.', 'Share a quick perspective on your journey, goals, or something happening in your sport.'],
  'Motivation Post': ['Film a high-energy training moment and pair it with a voiceover about discipline and purpose.', 'Create a montage of intense moments — training, competition, focus — with an inspiring overlay message.'],
  'Story Post': ['Tell a specific story from your journey — a setback, breakthrough, or defining moment. Keep it personal and authentic.', 'Share a personal story about why you play, who motivates you, or a turning point in your career.'],
  'Lifestyle Post': ['Show a full day — morning routine, classes, practice, recovery, downtime. Let people see the whole picture.', 'Film casual moments — meals, hanging with teammates, study sessions — to show the human side.'],
  'Educational Tip': ['Break down a technique or drill that helped you improve. Show it step by step with voiceover explanation.', 'Share a quick tip about nutrition, recovery, or mental preparation that your audience can apply.'],
  'Recap Post': ['Summarize the week\'s highlights and progress. Use stats, clips, and a brief reflection.', 'Create a quick recap of recent games or training milestones with clean text overlays.'],
}

// --- CTA pool ---
const CTA_POOL = [
  'Follow the journey',
  'Watch till the end',
  'Drop your thoughts',
  'Tag a teammate',
  'Share this with a coach',
  'Save this for later',
  'Double tap if you relate',
  'Who can relate?',
  'Link in bio for more',
]

function generateId(): string {
  return `acp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function generateAthleteContentPlan(
  duration: number,
  strategy: AthleteStrategyData,
  profile: Record<string, string>,
  pillars: string[]
): ContentPlanItem[] {
  const goal = strategy.primaryGoal || profile.primary_goal || 'Personal Brand Growth'
  const contentTypes = CONTENT_TYPES_BY_GOAL[goal] || DEFAULT_CONTENT_TYPES
  const recPlatforms = strategy.recommendedPlatforms || ['Instagram', 'TikTok']

  const items: ContentPlanItem[] = []

  for (let day = 1; day <= duration; day++) {
    // Rotate content type
    const contentType = contentTypes[(day - 1) % contentTypes.length]

    // Pick platform: prefer from strategy recommendations, intersected with content type prefs
    const typePlatforms = PLATFORM_PREFS[contentType] || ['Instagram', 'TikTok']
    const matchedPlatforms = recPlatforms.filter((p) => typePlatforms.includes(p))
    const platformPool = matchedPlatforms.length > 0 ? matchedPlatforms : typePlatforms.slice(0, 2)
    const platform = platformPool[(day - 1) % platformPool.length]

    // Rotate pillar
    const pillar = pillars[(day - 1) % pillars.length]

    // Goal
    const itemGoal = GOAL_MAP[contentType] || 'Engagement'

    // Title
    const titles = TITLE_MAP[contentType] || ['Content Post']
    const title = titles[(day - 1) % titles.length]

    // Hook
    const hooks = HOOK_TEMPLATES[contentType] || ['Check this out']
    const hook = hooks[(day - 1) % hooks.length]

    // Concept
    const concepts = CONCEPT_TEMPLATES[contentType] || ['Create engaging content for this day.']
    const concept = concepts[(day - 1) % concepts.length]

    // CTA
    const cta = CTA_POOL[(day - 1) % CTA_POOL.length]

    items.push({
      id: generateId(),
      day,
      title: `Day ${day} - ${title}`,
      contentType,
      platform,
      goal: itemGoal,
      pillar,
      hook,
      concept,
      cta,
      status: 'draft',
    })
  }

  return items
}

export function createInitialContentPlan(): AthleteContentPlanObject {
  return {
    generated: false,
    generatedAt: null,
    version: 0,
    durationDays: 7,
    status: 'not_started',
    items: [],
  }
}
