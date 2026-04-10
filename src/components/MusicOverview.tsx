'use client'

import { useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Workflow Dashboard – V1
// ---------------------------------------------------------------------------

type Project = {
  id: string
  name: string
  mode: string | null
  description: string | null
  lyrics_text?: string | null
  song_style?: string | null
}

type Plan = {
  id: string
  day: number
  title: string
  description: string
  platform: string
}

type ContentItem = {
  id: string
  day: number
  title: string
  platform: string
  status: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Workflow step config
// ---------------------------------------------------------------------------

type WorkflowStep = {
  number: number
  title: string
  path: string
  description: string
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { number: 1, title: 'Details',    path: 'details',    description: 'Song info, lyrics & style' },
  { number: 2, title: 'Track Analysis', path: 'transcript', description: 'Upload & analysis' },
  { number: 3, title: 'Strategy',   path: 'strategy',   description: 'AI audit & approval' },
  { number: 4, title: 'Content',    path: 'content',    description: '30-day content plan' },
  { number: 5, title: 'Scheduler',  path: 'scheduler',  description: 'Schedule & publish' },
]

// ---------------------------------------------------------------------------
// Completion & status helpers
// ---------------------------------------------------------------------------

function getStepStatuses(
  project: Project,
  interviewCompleted: boolean,
  strategyStatus: string | null,
  plans: Plan[],
  contentItems: ContentItem[],
): Record<number, boolean> {
  const hasLyrics = !!(project.lyrics_text?.trim())
  const hasSongStyle = !!(project.song_style?.trim())

  return {
    1: hasLyrics && hasSongStyle,
    2: true,                                                    // TODO: wire to real transcript completion
    3: strategyStatus === 'approved',
    4: false,                                                   // TODO: wire to real content completion
    5: false,                                                   // TODO: wire to real scheduler completion
  }
}

function getNextStep(statuses: Record<number, boolean>): WorkflowStep {
  return WORKFLOW_STEPS.find((s) => !statuses[s.number]) ?? WORKFLOW_STEPS[WORKFLOW_STEPS.length - 1]
}

function getStatusLabel(complete: boolean, isActive: boolean): string {
  if (isActive && !complete) return 'Ready to continue'
  if (complete) return 'Complete'
  return 'Not started'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MusicOverview({
  project,
  interviewCompleted,
  strategyStatus,
  plans,
  contentItems,
}: {
  project: Project
  interviewCompleted: boolean
  strategyStatus: string | null
  plans: Plan[]
  contentItems: ContentItem[]
}) {
  const router = useRouter()
  const basePath = `/projects/${project.id}`
  const statuses = getStepStatuses(project, interviewCompleted, strategyStatus, plans, contentItems)
  const nextStep = getNextStep(statuses)

  const navigateTo = (path: string) => router.push(`${basePath}/${path}`)

  return (
    <div className="vp-dashboard-intro" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, alignItems: 'center', paddingTop: '24px' }}>
      {/* ---- Intro section ---- */}
      <div style={{ textAlign: 'center', marginBottom: '40px', flexShrink: 0, maxWidth: '580px' }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Your Content System
        </h1>
        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
          Build your campaign step by step, from song details and transcript analysis to strategy, content planning, and scheduling.
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
          Each section below represents a key stage in the workflow, helping you move from raw input to finished promotional assets with clarity.
        </p>
      </div>

      {/* ---- Waveform visual ---- */}
      <svg className="vp-dashboard-waveform" width="320" height="48" viewBox="0 0 320 48" style={{ marginBottom: '32px', flexShrink: 0 }}>
        {Array.from({ length: 64 }, (_, i) => {
          const x = i * 5
          const baseH = 6 + Math.sin(i * 0.5) * 14 + Math.cos(i * 0.3) * 8
          return (
            <rect
              key={i}
              x={x}
              width="3"
              rx="1.5"
              fill={`rgba(90, 154, 245, ${0.15 + Math.sin(i * 0.4) * 0.1})`}
              style={{
                animation: `wave-eq 2s ease-in-out ${i * 0.05}s infinite alternate`,
                transformOrigin: `${x + 1.5}px 24px`,
              }}
            >
              <animate attributeName="y" values={`${24 - baseH / 2};${24 - baseH * 0.8 / 2};${24 - baseH * 0.4 / 2};${24 - baseH / 2}`} dur={`${1.5 + (i % 5) * 0.2}s`} repeatCount="indefinite" />
              <animate attributeName="height" values={`${baseH};${baseH * 0.8};${baseH * 0.4};${baseH}`} dur={`${1.5 + (i % 5) * 0.2}s`} repeatCount="indefinite" />
            </rect>
          )
        })}
      </svg>

      {/* ---- Card grid ---- */}
      <div
        className="vp-workflow-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '14px',
          height: '50%',
          width: '100%',
        }}
      >
        {WORKFLOW_STEPS.map((step) => {
          const complete = statuses[step.number]
          const isActive = step.number === nextStep.number

          return (
            <div
              key={step.number}
              onClick={() => navigateTo(step.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)'
                if (!isActive) e.currentTarget.style.borderColor = 'rgba(90,154,245,0.3)'
                const circle = e.currentTarget.querySelector('[data-circle]') as HTMLElement
                if (circle) circle.style.borderColor = '#5a9af5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = isActive
                  ? '0 0 12px rgba(90,154,245,0.15)'
                  : '0 1px 4px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = isActive
                  ? 'rgba(90,154,245,0.4)'
                  : 'var(--border-default)'
                const circle = e.currentTarget.querySelector('[data-circle]') as HTMLElement
                if (circle) circle.style.borderColor = isActive ? 'var(--accent-blue)' : 'var(--border-default)'
              }}
              style={{
                position: 'relative',
                background: isActive ? 'rgba(90,154,245,0.04)' : 'var(--surface-2)',
                border: `1px solid ${isActive ? 'rgba(90,154,245,0.4)' : 'var(--border-default)'}`,
                borderRadius: '10px',
                padding: '24px 16px 20px',
                minHeight: 0,
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                boxShadow: isActive
                  ? '0 0 12px rgba(90,154,245,0.15)'
                  : '0 1px 4px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {/* Status light — top-right */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: complete ? '#4ade80' : 'rgba(255,255,255,0.12)',
                  boxShadow: complete ? '0 0 6px rgba(74,222,128,0.4)' : 'none',
                  transition: 'background 0.2s',
                }}
              />

              {/* Centered circle with step number */}
              <div
                data-circle=""
                style={{
                  width: '112px',
                  height: '112px',
                  borderRadius: '50%',
                  border: `2px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                  background: isActive ? 'rgba(90,154,245,0.08)' : 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                  marginBottom: '12px',
                  flexShrink: 0,
                  transition: 'border-color 0.15s, color 0.15s',
                }}
              >
                {step.number}
              </div>

              {/* Title */}
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>
                {step.title}
              </h3>

              {/* Description */}
              <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.4', color: 'var(--text-muted)', textAlign: 'center' }}>
                {step.description}
              </p>

              {/* Bottom row: status + open link */}
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: complete ? '#4ade80' : isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                  }}
                >
                  {getStatusLabel(complete, isActive)}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', opacity: 0.6 }}>
                  Open &rarr;
                </span>
              </div>

              {/* Active badge */}
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '14px',
                    fontSize: '8px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--accent-blue)',
                    background: 'rgba(90,154,245,0.1)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                  }}
                >
                  Current Step
                </span>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
