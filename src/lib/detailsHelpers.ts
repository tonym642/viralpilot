// ---------------------------------------------------------------------------
// Details data types & helpers
// ---------------------------------------------------------------------------

export type ProjectDetails = {
  info?: {
    songTitle?: string
    artistName?: string
    author?: string
    genre?: string
    language?: string
    languageOther?: string
    description?: string
    releaseDate?: string
    distributionPlatforms?: string[]
    distributionOther?: string
  }
  questions?: {
    primaryGoal?: string
    primaryGoalOther?: string
    targetAudience?: string[]
    targetAudienceOther?: string
    contentTone?: string
    contentToneOther?: string
    platformFocus?: string[]
    platformFocusOther?: string
    callToAction?: string
    callToActionOther?: string
    uniqueAngle?: string
  }
  lyrics?: {
    lyricsText?: string
    styleNotes?: string
  }
}

/**
 * Returns true when the minimum required Details fields are filled in.
 */
export function isDetailsComplete(details: ProjectDetails | null | undefined): boolean {
  if (!details) return false
  const i = details.info
  const q = details.questions
  const l = details.lyrics
  return !!(
    i?.songTitle?.trim() &&
    i?.artistName?.trim() &&
    i?.genre?.trim() &&
    i?.language?.trim() &&
    q?.primaryGoal?.trim() &&
    (q?.targetAudience?.length ?? 0) > 0 &&
    l?.lyricsText?.trim()
  )
}
