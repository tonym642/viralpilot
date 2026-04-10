// ---------------------------------------------------------------------------
// Strategy data types
// ---------------------------------------------------------------------------

export type ContentPillar = { title: string; description: string }
export type PlatformRec = { platform: string; recommendation: string }

export type ProjectStrategy = {
  whyThisSongWins: string
  positioning: string
  audienceStrategy: {
    primaryAudience: string
    secondaryAudience: string
    audienceReasoning: string
  }
  contentPillars: ContentPillar[]
  platformStrategy: PlatformRec[]
  creativeDirection: {
    visualDirection: string
    tone: string
    deliveryStyle: string
    emotionalEnergy: string
  }
  hookStrategy: {
    hookStyles: string[]
    strongestAngles: string[]
  }
  postingRhythm: {
    recommendedPlanLength: string
    cadence: string
    reasoning: string
  }
  priorityRecommendations: string[]
}
