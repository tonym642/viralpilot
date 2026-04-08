// Deterministic content generator for Athlete mode — no AI

import type { AthleteStrategyData } from './athleteStrategy'

export type GeneratedContent = {
  script: string
  caption: string
  hashtags: string[]
  visualDirection: string
  shotIdeas: string[]
  updatedAt: string | null
  version: number
}

// --- Script templates by content type ---
const SCRIPT_TEMPLATES: Record<string, string[]> = {
  'Highlight Clip': [
    `[OPEN on game footage — slow motion]\n"This is what they don't show you in the stats."\n[CUT to the play — full speed]\n[SLOW MO on the key moment]\n"Remember the name."\n[END with logo/handle]`,
    `[OPEN — walking onto the field]\n"Every game is a chance to prove something."\n[MONTAGE — 3-4 top plays]\n[CLOSE-UP reaction after the big play]\n"That's what work looks like."`,
  ],
  'Training Clip': [
    `[OPEN — alarm clock, 5 AM]\n"While they sleep, we work."\n[MONTAGE — drills, reps, conditioning]\n"No shortcuts. No excuses."\n[END — wiping sweat, walking off]`,
    `[OPEN — empty field/gym]\n"This is where it happens."\n[SEQUENCE — focused reps, coaching cues]\n"One rep at a time. Every day."\n[END — cool-down, reflection]`,
  ],
  'Game Day Post': [
    `[OPEN — getting dressed, taping up]\n"Game day hits different."\n[CUT — bus ride, arrival, warm-ups]\n"This is what we trained for."\n[END — tunnel walk, first whistle]`,
    `[OPEN — morning routine]\n"Pre-game focus is everything."\n[MONTAGE — meal prep, playlist, stretching]\n"Lock in. Lights on."\n[END — walking out to the field]`,
  ],
  'Behind-the-Scenes Reel': [
    `[OPEN — locker room chaos]\n"This is the side nobody sees."\n[CUTS — film study, team huddle, ice bath]\n"The grind is real. The bond is real."\n[END — team laughing, natural moment]`,
    `[OPEN — early morning arrival]\n"Before the lights come on..."\n[SEQUENCE — taping ankles, stretching, getting loose]\n"This is the process."\n[END — walking to practice]`,
  ],
  'Talking Head Clip': [
    `[DIRECT TO CAMERA]\n"Real talk — something I've been thinking about."\n[SHARE the insight/lesson/mindset shift]\n"If you're going through something similar, hear me out."\n[CLOSE with encouragement or challenge]`,
    `[DIRECT TO CAMERA — casual setting]\n"People always ask me about this..."\n[ANSWER — honest, specific, short]\n"That's my take. What do you think?"\n[END with question to audience]`,
  ],
  'Motivation Post': [
    `[OPEN — intense training moment]\n[VOICEOVER] "They'll doubt you. They'll question you."\n[MONTAGE — pushing through, grinding]\n"Let the work speak."\n[END — standing tall, breathing hard]`,
    `[OPEN — quiet moment of reflection]\n"Nobody talks about the days when you don't feel like showing up."\n[MONTAGE — showing up anyway]\n"That's what separates."\n[END — walking away, focused]`,
  ],
  'Story Post': [
    `[OPEN — childhood photo or hometown shot]\n"Where I come from, this wasn't supposed to happen."\n[TELL the story — 3-4 key moments]\n"But here I am."\n[END — current moment, looking forward]`,
    `[DIRECT TO CAMERA — personal]\n"Let me tell you about the moment everything changed."\n[SHARE the turning point]\n"That's why I play with this energy every day."\n[END — grateful, determined]`,
  ],
  'Lifestyle Post': [
    `[OPEN — morning alarm, getting up]\n"Day in the life of a student athlete."\n[SEQUENCE — breakfast, class, study, practice, recovery]\n"It's a lot. But I wouldn't trade it."\n[END — relaxing, phone down]`,
    `[OPEN — off-day vibes]\n"Even athletes need a reset."\n[CUTS — food, friends, music, downtime]\n"Balance is part of the game."\n[END — setting up for tomorrow]`,
  ],
  'Educational Tip': [
    `[DIRECT TO CAMERA]\n"One thing that changed my game..."\n[DEMONSTRATE — show the technique/drill]\n"Try this in your next session."\n[CLOSE — recap the key point]`,
    `[OPEN — at the field/gym]\n"Most people get this wrong."\n[BREAK DOWN — step by step with voiceover]\n"Small changes, big results."\n[END — before/after comparison]`,
  ],
  'Recap Post': [
    `[OPEN — scoreboard or stats graphic]\n"Let's talk about this week."\n[HIGHLIGHTS — 3-4 clips from games/practice]\n"Progress isn't always linear, but we're moving."\n[END — looking ahead]`,
    `[TEXT OVERLAY — weekly stats]\n[MONTAGE — best moments]\n"Another week in the books."\n[END — what's next, forward focus]`,
  ],
}

// --- Caption templates ---
const CAPTION_TEMPLATES: Record<string, string[]> = {
  'Highlight Clip': [
    'Work speaks louder than words. Watch this.\n\nEvery rep, every drill, every sacrifice — it shows up when the lights are on.',
    'That moment when everything clicks.\n\nThis is what preparation looks like in real time.',
  ],
  'Training Clip': [
    'Nobody sees this part. But this is where it all starts.\n\nThe gym doesn\'t lie. The work doesn\'t lie.',
    'Another day, another chance to get better.\n\nConsistency over everything.',
  ],
  'Game Day Post': [
    'Game day energy is unmatched.\n\nLocked in. Ready to go.',
    'This is what we work for. Every single day leads to this moment.',
  ],
  'Behind-the-Scenes Reel': [
    'The other side of the highlight reel.\n\nThis is the real work that makes everything else possible.',
    'Behind every performance is a process.\n\nHere\'s what mine looks like.',
  ],
  'Talking Head Clip': [
    'Had to get this off my chest.\n\nSometimes you just need to say it out loud.',
    'Real talk. No filter.\n\nTake it or leave it, but this is what I believe.',
  ],
  'Motivation Post': [
    'Built in silence. Proven in the spotlight.\n\nKeep going. Your time is coming.',
    'The days when you don\'t feel like it? Those are the most important ones.\n\nShow up anyway.',
  ],
  'Story Post': [
    'Every athlete has a story. This is mine.\n\nIt wasn\'t easy, but it\'s worth it.',
    'Where I come from matters. Where I\'m going matters more.\n\nThis is why I play.',
  ],
  'Lifestyle Post': [
    'Athlete life isn\'t just highlights and game days.\n\nHere\'s the full picture.',
    'Balance is part of the game.\n\nTraining hard, living well.',
  ],
  'Educational Tip': [
    'This small change made a huge difference in my game.\n\nTry it and let me know.',
    'Learn from experience. I wish someone told me this earlier.',
  ],
  'Recap Post': [
    'Another week, another step forward.\n\nHere\'s where we\'re at.',
    'Progress isn\'t always linear, but we keep moving.\n\nWeek in review.',
  ],
}

// --- Visual direction templates ---
const VISUAL_TEMPLATES: Record<string, string[]> = {
  'Highlight Clip': ['Film vertically from sideline or elevated angle. Use slow-motion on the key play. Add bold text overlay with stat or reaction. Keep edits sharp with fast cuts and trending audio. End with athlete logo or handle graphic.'],
  'Training Clip': ['Shoot close-up details — hands, feet, sweat, weights. Use natural gym/field lighting. Minimal editing, raw feel. Time-lapse for longer drill sequences. Add subtle motivational text overlay.'],
  'Game Day Post': ['Capture the full atmosphere — tunnel walk, crowd, warm-ups. Mix wide shots with intimate close-ups. Use real game audio underneath. Vertical format with cinematic transitions.'],
  'Behind-the-Scenes Reel': ['Handheld, authentic camera work. No over-editing. Capture real moments — team interactions, prep, recovery. Let the audio breathe. Quick cuts between scenes.'],
  'Talking Head Clip': ['Direct to camera, well-lit face. Clean background or sports setting. Eye contact with lens. Subtitles required. Keep it under 60 seconds. Natural, conversational tone.'],
  'Motivation Post': ['High-energy montage with dramatic pacing. Mix training footage with game moments. Bold text overlays on key lines. Epic or trending audio. Build intensity throughout.'],
  'Story Post': ['Personal, intimate feel. Mix old photos/videos with current footage. Voiceover style. Slower pacing. Let emotional moments breathe. End with a powerful forward-looking shot.'],
  'Lifestyle Post': ['Casual, lifestyle aesthetic. Well-lit daily routine shots. Mix activities naturally. Feel approachable and relatable. Light background music. Show personality.'],
  'Educational Tip': ['Clear, instructional framing. Show technique from 2-3 angles. Use arrows or circles to highlight key points. Voiceover explanation. Before/after if applicable.'],
  'Recap Post': ['Stats graphic overlay on clips. Quick-cut montage of best moments. Clean text transitions between sections. Upbeat audio. End with forward-looking message.'],
}

// --- Shot ideas ---
const SHOT_IDEAS: Record<string, string[]> = {
  'Highlight Clip': ['wide shot of the play developing', 'slow-motion impact moment', 'crowd/bench reaction', 'close-up celebration', 'replay from second angle', 'stat overlay graphic', 'walking off the field'],
  'Training Clip': ['close-up on hands/feet during drill', 'sweat dripping during rep', 'coach giving instruction', 'full-body drill from side angle', 'time-lapse of full session', 'loading weights/equipment', 'cool-down stretch'],
  'Game Day Post': ['bus arrival at venue', 'getting taped up', 'headphones in, locked in', 'tunnel walk', 'warm-up drills', 'first whistle moment', 'team huddle'],
  'Behind-the-Scenes Reel': ['locker room prep', 'film study on tablet', 'ice bath recovery', 'team meal together', 'walking through hallways', 'equipment setup', 'post-practice laughs'],
  'Talking Head Clip': ['face well-lit, centered frame', 'hands gesturing naturally', 'cut to relevant b-roll', 'reaction shot', 'end with direct eye contact'],
  'Motivation Post': ['sunrise training silhouette', 'pushing through final rep', 'deep breath before play', 'staring down the field', 'walking through fog/smoke', 'putting on gear dramatically', 'standing alone on empty field'],
  'Story Post': ['childhood photo/video', 'hometown establishing shot', 'family moment', 'turning point visual', 'current training clip', 'looking at camera, present day', 'jersey/equipment close-up'],
  'Lifestyle Post': ['morning alarm/wake-up', 'making breakfast', 'walking to class', 'study session', 'casual hangout with friends', 'listening to music', 'evening wind-down'],
  'Educational Tip': ['technique demo from front', 'technique from side angle', 'close-up on body position', 'wrong vs right comparison', 'slow-motion breakdown', 'result/outcome shot'],
  'Recap Post': ['scoreboard capture', 'best play from each game', 'stats graphic overlay', 'team celebration', 'personal milestone moment', 'looking ahead shot'],
}

export function generateContentForItem(
  item: { contentType: string; hook: string; concept: string; cta: string; pillar: string; platform: string; goal: string },
  profile: Record<string, string>,
  _strategy: AthleteStrategyData
): GeneratedContent {
  const type = item.contentType
  const sport = profile.sport || 'sports'
  const position = profile.position || 'athlete'
  const name = profile.athlete_name || 'Athlete'

  // Script
  const scripts = SCRIPT_TEMPLATES[type] || SCRIPT_TEMPLATES['Training Clip']
  const script = scripts[Math.floor(Math.random() * scripts.length)]
    .replace(/\[SPORT\]/g, sport)
    .replace(/\[POSITION\]/g, position)
    .replace(/\[NAME\]/g, name)

  // Caption
  const captions = CAPTION_TEMPLATES[type] || CAPTION_TEMPLATES['Training Clip']
  const caption = captions[Math.floor(Math.random() * captions.length)]

  // Hashtags
  const baseHashtags = ['#Athlete', `#${sport.replace(/\s+/g, '')}`, '#StudentAthlete', '#Grind', '#GameDay']
  const typeHashtags: Record<string, string[]> = {
    'Highlight Clip': ['#Highlights', '#TopPlays', '#BallIsLife'],
    'Training Clip': ['#Training', '#WorkEthic', '#NoDaysOff'],
    'Game Day Post': ['#GameDay', '#MatchDay', '#LetsGo'],
    'Behind-the-Scenes Reel': ['#BTS', '#BehindTheScenes', '#TheProcess'],
    'Talking Head Clip': ['#RealTalk', '#AthleteMindset', '#Perspective'],
    'Motivation Post': ['#Motivation', '#KeepGoing', '#BuiltDifferent'],
    'Story Post': ['#MyStory', '#Journey', '#WhyIPlay'],
    'Lifestyle Post': ['#AthleteLife', '#DayInTheLife', '#Balance'],
    'Educational Tip': ['#ProTip', '#LearnAndGrow', '#GetBetter'],
    'Recap Post': ['#WeekInReview', '#Progress', '#LevelUp'],
  }
  const hashtags = [...baseHashtags, ...(typeHashtags[type] || ['#Content'])].slice(0, 10)

  // Visual Direction
  const visuals = VISUAL_TEMPLATES[type] || ['Film clean vertical content with good lighting and clear audio.']
  const visualDirection = visuals[0]

  // Shot Ideas
  const shots = SHOT_IDEAS[type] || ['wide establishing shot', 'close-up detail', 'action moment', 'reaction shot', 'outro/end card']

  return {
    script,
    caption,
    hashtags,
    visualDirection,
    shotIdeas: shots.slice(0, 7),
    updatedAt: new Date().toISOString(),
    version: 1,
  }
}
