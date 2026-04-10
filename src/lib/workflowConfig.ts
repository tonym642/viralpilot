// ---------------------------------------------------------------------------
// Workflow configuration — 5-step music mode workflow
// ---------------------------------------------------------------------------

export type StepState = 'completed' | 'current' | 'upcoming'

export type WorkflowStepConfig = {
  num: number
  key: string
  label: string
  href: string
  guide: {
    completedTitle: string
    completedSummary: string
    nextLabel: string
    ctaText: string
    nextHref: string
  }
}

export const WORKFLOW_STEPS: WorkflowStepConfig[] = [
  {
    num: 1, key: 'details', label: 'Details', href: 'details',
    guide: {
      completedTitle: 'Project Setup Complete',
      completedSummary: 'You defined your project, audience, and core inputs.',
      nextLabel: 'Next: Track Analysis',
      ctaText: 'Go to Track Analysis',
      nextHref: 'transcript',
    },
  },
  {
    num: 2, key: 'track-analysis', label: 'Analysis', href: 'transcript',
    guide: {
      completedTitle: 'Track Analysis Ready',
      completedSummary: 'AI analyzed your track structure, energy, and potential angles.',
      nextLabel: 'Next: Strategy',
      ctaText: 'Go to Strategy',
      nextHref: 'strategy',
    },
  },
  {
    num: 3, key: 'strategy', label: 'Strategy', href: 'strategy',
    guide: {
      completedTitle: 'Strategy Complete',
      completedSummary: 'You created a structured content strategy aligned with your audience and goals.',
      nextLabel: 'Next: Content',
      ctaText: 'Go to Content',
      nextHref: 'content',
    },
  },
  {
    num: 4, key: 'content', label: 'Content', href: 'content',
    guide: {
      completedTitle: 'Content Plan Ready',
      completedSummary: 'Your content ideas are generated and ready to refine.',
      nextLabel: 'Next: Scheduler',
      ctaText: 'Go to Scheduler',
      nextHref: 'scheduler',
    },
  },
  {
    num: 5, key: 'scheduler', label: 'Scheduler', href: 'scheduler',
    guide: {
      completedTitle: 'Ready to Publish',
      completedSummary: 'Your content is scheduled and ready to go live.',
      nextLabel: '',
      ctaText: 'View Schedule',
      nextHref: 'scheduler',
    },
  },
]

// ---------------------------------------------------------------------------
// Determine step states from completion booleans
// ---------------------------------------------------------------------------

export type WorkflowCompletion = {
  details: boolean
  trackAnalysis: boolean
  strategy: boolean
  content: boolean
  scheduler: boolean
}

const COMPLETION_KEYS: (keyof WorkflowCompletion)[] = [
  'details', 'trackAnalysis', 'strategy', 'content', 'scheduler',
]

export function getStepStates(completion: WorkflowCompletion): StepState[] {
  let foundCurrent = false
  return COMPLETION_KEYS.map((key) => {
    if (completion[key]) return 'completed'
    if (!foundCurrent) { foundCurrent = true; return 'current' }
    return 'upcoming'
  })
}

export function getCurrentStepIndex(completion: WorkflowCompletion): number {
  const states = getStepStates(completion)
  const idx = states.indexOf('current')
  return idx === -1 ? WORKFLOW_STEPS.length - 1 : idx
}
