// Deterministic strategy generator for Athlete mode — no AI

export type AthleteStrategyData = {
  primaryGoal: string
  targetAudience: string
  coreBrandAngle: string
  contentMix: string[]
  pillarFocus: string[]
  recommendedPlatforms: string[]
  postingCadence: string
  hookStyle: string[]
  visualStyle: string[]
  ctaStyle: string[]
  doMoreOf: string[]
  avoid: string[]
  summary: string
}

export type AthleteStrategyObject = {
  generated: boolean
  approved: boolean
  approvedAt: string | null
  generatedAt: string | null
  version: number
  data: AthleteStrategyData | null
}

const AUDIENCE_MAP: Record<string, string> = {
  'Recruiting Exposure': 'College coaches, recruiters, sports pages',
  'NIL / Sponsorships': 'Brands, local businesses, fans',
  'Personal Brand Growth': 'Fans, peers, sports community',
  'Fan Engagement': 'Followers, supporters, community',
  'Highlight Visibility': 'Sports pages, fans, recruiters',
}

const PLATFORMS_MAP: Record<string, string[]> = {
  'Recruiting Exposure': ['Instagram', 'X', 'Hudl', 'TikTok'],
  'NIL / Sponsorships': ['Instagram', 'TikTok', 'YouTube Shorts'],
  'Personal Brand Growth': ['TikTok', 'Instagram', 'YouTube Shorts'],
  'Fan Engagement': ['Instagram', 'TikTok'],
  'Highlight Visibility': ['Instagram', 'TikTok', 'Hudl'],
}

const CADENCE_MAP: Record<string, string> = {
  'Recruiting Exposure': '4 posts/week',
  'NIL / Sponsorships': '5 posts/week',
  'Personal Brand Growth': '5 posts/week',
  'Fan Engagement': '4 posts/week',
  'Highlight Visibility': '4 posts/week',
}

const HOOK_POOL: Record<string, string[]> = {
  'Leader': ['POV: the captain speaks', 'What leadership looks like at this level', 'Built different, lead different'],
  'Technician': ['Breaking down this play', 'Watch my footwork here', 'The details nobody notices'],
  'Motivator': ['POV: nobody saw the work behind this', 'Road to greatness', 'This is what dedication looks like'],
  'Showman': ['Wait for it...', 'Game day with...', 'They weren\'t ready for this'],
  'Grinder': ['4 AM workout. No excuses.', 'Outwork everyone. Period.', 'Built, not hyped'],
  'Funny': ['When coach says one more rep...', 'Athletes will understand this', 'My teammates are wild'],
  'Family': ['Why I play', 'For the ones watching', 'This one\'s for them'],
  'Lifestyle': ['Day in my life as a D1 athlete', 'What people don\'t see', 'Athlete life unfiltered'],
}

const VISUAL_POOL: Record<string, string[]> = {
  'Recruiting Exposure': ['clean highlight reels', 'vertical game clips', 'stat overlay graphics', 'practice footage', 'bold text overlays'],
  'NIL / Sponsorships': ['polished lifestyle shots', 'branded content moments', 'behind-the-scenes footage', 'clean training clips', 'product integration edits'],
  'Personal Brand Growth': ['vertical highlight edits', 'locker room moments', 'training montages', 'day-in-life vlogs', 'bold text overlays'],
  'Fan Engagement': ['behind-the-scenes footage', 'game day energy clips', 'team moments', 'fan interaction content', 'raw unfiltered clips'],
  'Highlight Visibility': ['vertical highlight edits', 'slow-motion replays', 'multi-angle clips', 'stat overlay graphics', 'bold text overlays'],
}

const CTA_POOL: Record<string, string[]> = {
  'Recruiting Exposure': ['Follow the journey', 'DM for film', 'Share with a coach'],
  'NIL / Sponsorships': ['Link in bio', 'Tag a brand', 'Watch till the end'],
  'Personal Brand Growth': ['Follow the journey', 'Drop your thoughts', 'Share this with someone who needs it'],
  'Fan Engagement': ['Tag a teammate', 'Drop your thoughts', 'Who can relate?'],
  'Highlight Visibility': ['Follow for more highlights', 'Watch till the end', 'Tag a sports page'],
}

export function generateAthleteStrategy(
  profile: Record<string, string>,
  brand: Record<string, string>,
  pillars: string[]
): AthleteStrategyData {
  const goal = profile.primary_goal || 'Personal Brand Growth'
  const personality = brand.personality_type || 'Motivator'

  // Primary Goal
  const primaryGoal = goal

  // Target Audience
  const targetAudience = profile.target_audience || AUDIENCE_MAP[goal] || AUDIENCE_MAP['Personal Brand Growth']

  // Core Brand Angle
  const position = profile.position ? ` ${profile.position.toLowerCase()}` : ''
  const sport = profile.sport ? ` in ${profile.sport.toLowerCase()}` : ''
  const storyBit = brand.story_background
    ? ` driven by ${brand.story_background.split('.')[0].toLowerCase().slice(0, 60)}`
    : ''
  const coreBrandAngle = `A ${personality.toLowerCase()}${position}${sport} building a ${(brand.brand_vibe || 'sharp').toLowerCase()} brand${storyBit}.`

  // Content Mix — based on pillars + goal
  const baseMix: string[] = []
  if (pillars.includes('Highlights')) baseMix.push('Highlight clips')
  if (pillars.includes('Training')) baseMix.push('Training content')
  if (pillars.includes('Game Day')) baseMix.push('Game day moments')
  if (pillars.includes('Lifestyle')) baseMix.push('Lifestyle moments')
  if (pillars.includes('Motivation')) baseMix.push('Motivational talking clips')
  if (pillars.includes('Education')) baseMix.push('Educational tips')
  if (pillars.includes('Story')) baseMix.push('Journey/storytelling posts')
  // Fill to at least 4
  const extras = ['Behind-the-scenes content', 'Quick tips & drills', 'Team culture moments', 'Personal updates']
  for (const e of extras) {
    if (baseMix.length >= 6) break
    if (!baseMix.includes(e)) baseMix.push(e)
  }
  const contentMix = baseMix.slice(0, 6)

  // Pillar Focus
  const pillarFocus = [...pillars]

  // Recommended Platforms
  const recommendedPlatforms = PLATFORMS_MAP[goal] || PLATFORMS_MAP['Personal Brand Growth']

  // Posting Cadence
  const postingCadence = CADENCE_MAP[goal] || '4 posts/week'

  // Hook Style
  const personalityHooks = HOOK_POOL[personality] || HOOK_POOL['Motivator']
  const genericHooks = ['What people don\'t see', 'Road to the next level']
  const hookStyle = [...personalityHooks, ...genericHooks].slice(0, 5)

  // Visual Style
  const visualStyle = VISUAL_POOL[goal] || VISUAL_POOL['Personal Brand Growth']

  // CTA Style
  const ctaStyle = CTA_POOL[goal] || CTA_POOL['Personal Brand Growth']

  // Do More Of
  const doMoreOf: string[] = []
  if (pillars.includes('Training')) doMoreOf.push('Share real training footage consistently')
  if (pillars.includes('Highlights')) doMoreOf.push('Post highlights within 24 hours of games')
  if (pillars.includes('Story')) doMoreOf.push('Tell your personal story — people connect with authenticity')
  doMoreOf.push('Use trending sounds and formats on TikTok/Reels')
  doMoreOf.push('Engage with comments and build community')
  const finalDoMore = doMoreOf.slice(0, 5)

  // Avoid
  const avoid = [
    'Inconsistent posting schedule',
    'Random unrelated content that dilutes brand',
    'Low-quality or blurry clips',
    'Weak or missing captions',
    'Unclear athlete identity across platforms',
  ]

  // Summary
  const summary = `${profile.athlete_name || 'This athlete'} should focus on ${goal.toLowerCase()} through a ${personality.toLowerCase()}-driven brand. Content should center on ${pillarFocus.slice(0, 3).join(', ').toLowerCase()} with ${postingCadence} across ${recommendedPlatforms.slice(0, 2).join(' and ')}. The brand voice should feel ${(brand.brand_vibe || 'authentic and consistent').toLowerCase()}.`

  return {
    primaryGoal,
    targetAudience,
    coreBrandAngle,
    contentMix,
    pillarFocus,
    recommendedPlatforms,
    postingCadence,
    hookStyle,
    visualStyle,
    ctaStyle,
    doMoreOf: finalDoMore,
    avoid,
    summary,
  }
}

export function createInitialStrategyObject(): AthleteStrategyObject {
  return {
    generated: false,
    approved: false,
    approvedAt: null,
    generatedAt: null,
    version: 0,
    data: null,
  }
}
