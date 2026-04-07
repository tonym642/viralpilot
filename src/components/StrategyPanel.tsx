'use client'

import { useState } from 'react'
import MusicInterview from './MusicInterview'

type InterviewData = {
  goal?: string | null
  audience?: string | null
  tone?: string | null
  content_style?: string | null
  platform_focus?: string | null
  cta?: string | null
  song_meaning?: string | null
  differentiator?: string | null
  assets_preference?: string | null
  context_summary?: string | null
  interview_completed?: boolean | null
}

type Project = {
  id: string
  name: string
  mode: string | null
  type: string | null
  description: string | null
}

const fields: { key: keyof InterviewData; label: string }[] = [
  { key: 'goal', label: 'Goal' },
  { key: 'audience', label: 'Audience' },
  { key: 'tone', label: 'Tone' },
  { key: 'content_style', label: 'Content Style' },
  { key: 'platform_focus', label: 'Platform Focus' },
  { key: 'cta', label: 'CTA' },
  { key: 'song_meaning', label: 'Song Meaning' },
  { key: 'differentiator', label: 'Differentiator' },
  { key: 'assets_preference', label: 'Assets Preference' },
]

export default function StrategyPanel({
  project,
  interview,
  onSwitchToPlan,
}: {
  project: Project
  interview: InterviewData | null
  onSwitchToPlan: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [strategyChanged, setStrategyChanged] = useState(false)
  const [localInterview, setLocalInterview] = useState<InterviewData | null>(interview)

  // No interview yet
  if (!localInterview?.interview_completed && !editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>
          No strategy yet
        </h2>
        <p className="muted" style={{ margin: '0 0 20px 0', fontSize: '13px', maxWidth: '340px', lineHeight: '1.6' }}>
          Complete the interview to build your strategy.
        </p>
        <button className="btn-primary" onClick={onSwitchToPlan}>
          Start Interview
        </button>
      </div>
    )
  }

  // Editing mode — show interview with pre-filled answers
  if (editing) {
    const prefill: Record<string, string> = {}
    if (localInterview) {
      for (const f of fields) {
        const val = localInterview[f.key]
        if (val && typeof val === 'string') prefill[f.key] = val
      }
    }

    return (
      <MusicInterview
        projectId={project.id}
        projectName={project.name}
        projectMode={project.mode || ''}
        projectDescription={project.description || ''}
        initialAnswers={prefill}
        skipPlanGeneration
        onComplete={() => {
          setEditing(false)
          setStrategyChanged(true)
          // Refresh data by reloading
          window.location.reload()
        }}
      />
    )
  }

  // Display strategy
  return (
    <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Strategy</h2>
        <button
          className="vp-btn"
          style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
          onClick={() => setShowConfirm(true)}
        >
          Edit Strategy
        </button>
      </div>

      {strategyChanged && (
        <div style={{
          padding: '6px 12px',
          marginBottom: '14px',
          borderRadius: '8px',
          background: 'rgba(90,154,245,0.08)',
          border: '1px solid rgba(90,154,245,0.15)',
          fontSize: '12px',
          color: '#7db4ff',
        }}>
          Your strategy has changed. Regenerate your plan for updated content.
        </div>
      )}

      {fields.map((f) => {
        const val = localInterview?.[f.key]
        if (!val || typeof val !== 'string') return null
        return (
          <div key={f.key} style={{ marginBottom: '14px' }}>
            <h4 style={{
              margin: '0 0 3px 0',
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.32)',
            }}>
              {f.label}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#c0cad8', lineHeight: '1.6' }}>
              {val}
            </p>
          </div>
        )
      })}

      {localInterview?.context_summary && (
        <>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '16px 0' }} />
          <div>
            <h4 style={{
              margin: '0 0 3px 0',
              fontSize: '9px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.32)',
            }}>
              Context Summary
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
              {localInterview.context_summary}
            </p>
          </div>
        </>
      )}

      {/* Edit confirmation modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0c1320',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '16px',
              width: '360px',
              maxWidth: '90vw',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>
              Edit your strategy?
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.45)' }}>
              Updating your strategy may require regenerating your content plan.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="vp-btn"
                style={{ fontSize: '12px', height: '28px', padding: '0 12px' }}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: '12px', height: '28px', padding: '0 12px' }}
                onClick={() => {
                  setShowConfirm(false)
                  setEditing(true)
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
