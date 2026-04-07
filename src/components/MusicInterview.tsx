'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Question = {
  key: string
  title: string
  type: 'choice' | 'text'
  options?: string[]
  required: boolean
  skipLabel?: string
}

const questions: Question[] = [
  {
    key: 'goal',
    title: 'What is your main goal with this release?',
    type: 'choice',
    options: ['Build hype before drop', 'Grow fanbase', 'Get streams', 'Go viral', 'Promote a tour/show', 'Build brand identity'],
    required: true,
  },
  {
    key: 'audience',
    title: 'Who is your target audience?',
    type: 'choice',
    options: ['Gen Z (16–24)', 'Millennials (25–35)', 'Broad / all ages', 'Niche community', 'Industry / tastemakers', 'Local scene'],
    required: true,
  },
  {
    key: 'tone',
    title: 'What tone fits this project?',
    type: 'choice',
    options: ['Emotional / vulnerable', 'Hype / energetic', 'Dark / moody', 'Playful / fun', 'Inspirational', 'Raw / authentic'],
    required: true,
  },
  {
    key: 'content_style',
    title: 'What type of content do you want to create?',
    type: 'choice',
    options: ['Short-form video (Reels, TikTok)', 'Behind the scenes', 'Lyric-focused clips', 'Storytelling / narrative', 'Fan interaction', 'Mixed / all of the above'],
    required: true,
  },
  {
    key: 'platform_focus',
    title: 'Where do you want to focus?',
    type: 'choice',
    options: ['TikTok first', 'Instagram first', 'YouTube Shorts first', 'Cross-platform equally', 'Twitter / X', 'Facebook'],
    required: true,
  },
  {
    key: 'cta',
    title: 'What should people do after seeing your content?',
    type: 'choice',
    options: ['Stream the song', 'Follow me', 'Share with friends', 'Pre-save', 'Comment / engage', 'Visit my website'],
    required: true,
  },
  {
    key: 'song_meaning',
    title: 'What is the song about? What does it mean to you?',
    type: 'text',
    required: true,
  },
  {
    key: 'differentiator',
    title: 'What makes you or this project different?',
    type: 'text',
    required: true,
  },
  {
    key: 'assets_preference',
    title: 'What assets do you have or want to create?',
    type: 'choice',
    options: ['Music video', 'Lyric video', 'Behind the scenes footage', 'Photos / artwork', 'I need help deciding', 'None yet'],
    required: false,
    skipLabel: 'Skip',
  },
]

export default function MusicInterview({
  projectId,
  projectName,
  projectType,
  projectDescription,
  onComplete,
  initialAnswers,
  skipPlanGeneration = false,
}: {
  projectId: string
  projectName: string
  projectType: string
  projectDescription: string
  onComplete: () => void
  initialAnswers?: Record<string, string>
  skipPlanGeneration?: boolean
}) {
  const [step, setStep] = useState(initialAnswers ? 0 : -1)
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers || {})
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const totalQuestions = questions.length
  const isIntro = step === -1
  const isSummary = step === totalQuestions
  const current = step >= 0 && step < totalQuestions ? questions[step] : null

  const setAnswer = (value: string) => {
    if (!current) return
    setAnswers((prev) => ({ ...prev, [current.key]: value }))
    // Auto-advance on choice
    if (current.type === 'choice') {
      setTimeout(() => setStep((s) => s + 1), 150)
    }
  }

  const canContinue = () => {
    if (!current) return false
    if (!current.required) return true
    return !!answers[current.key]?.trim()
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/save-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, answers }),
      })
      const data = await res.json()
      if (data.success) {
        if (skipPlanGeneration) {
          onComplete()
          return
        }

        // Move to generating state
        setSaving(false)
        setStep(totalQuestions + 1) // generating screen

        // Auto-generate plan
        try {
          const planRes = await fetch('/api/generate-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              projectName,
              projectType,
              description: projectDescription,
            }),
          })
          const planData = await planRes.json()
          if (planData.success) {
            onComplete()
            router.refresh()
          } else {
            console.error('Generate plan error:', planData.error)
            onComplete()
            router.refresh()
          }
        } catch (planErr) {
          console.error('Generate plan error:', planErr)
          onComplete()
          router.refresh()
        }
      } else {
        console.error('Save interview error:', data.error)
        setSaving(false)
      }
    } catch (err) {
      console.error('Save interview error:', err)
      setSaving(false)
    }
  }

  // Generating screen
  if (step === totalQuestions + 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px 20px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid rgba(255,255,255,0.08)',
          borderTop: '2px solid #5a9af5',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px',
        }} />
        <h2 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600 }}>
          Creating your 30-day content plan...
        </h2>
        <p className="muted" style={{ margin: 0, fontSize: '13px', maxWidth: '320px', lineHeight: '1.5' }}>
          This may take a moment. AI is building a strategy based on your answers.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Intro screen
  if (isIntro) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700 }}>
          Let&apos;s build your strategy
        </h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)', maxWidth: '380px', lineHeight: '1.6' }}>
          Answer a few quick questions so AI can create a better content plan tailored to your music.
        </p>
        <button
          className="btn-primary"
          onClick={() => setStep(0)}
        >
          Start Interview
        </button>
      </div>
    )
  }

  // Summary screen
  if (isSummary) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '4px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Here&apos;s what I understand</h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="vp-btn"
              style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
              onClick={() => setStep(0)}
            >
              Edit
            </button>
            <button
              className="btn-primary"
              style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
              onClick={handleConfirm}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>

        <div>
          {questions.map((q) => {
            const val = answers[q.key]
            if (!val) return null
            return (
              <div key={q.key} style={{ marginBottom: '12px' }}>
                <h4 style={{
                  margin: '0 0 3px 0',
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.25)',
                }}>
                  {q.title}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  {val}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Question screen
  if (!current) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '4px 0' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexShrink: 0 }}>
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'inherit',
              color: 'rgba(255,255,255,0.3)',
              padding: '2px 6px',
              borderRadius: '4px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
          >
            ← Back
          </button>
        )}
        <span className="muted" style={{ fontSize: '11px' }}>
          {step + 1} of {totalQuestions}
        </span>
        <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / totalQuestions) * 100}%`,
            background: '#5a9af5',
            borderRadius: '1px',
            transition: 'width 0.2s',
          }} />
        </div>
      </div>

      {/* Question */}
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, lineHeight: '1.4' }}>
        {current.title}
      </h3>

      {/* Options */}
      {current.type === 'choice' && current.options && (
        <div style={{ display: 'grid', gap: '6px' }}>
          {current.options.map((opt) => (
            <button
              key={opt}
              onClick={() => setAnswer(opt)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                border: answers[current.key] === opt
                  ? '1px solid rgba(90,154,245,0.4)'
                  : '1px solid rgba(255,255,255,0.06)',
                background: answers[current.key] === opt
                  ? 'rgba(90,154,245,0.1)'
                  : 'rgba(255,255,255,0.03)',
                color: answers[current.key] === opt
                  ? '#f0f4fa'
                  : 'rgba(255,255,255,0.6)',
                fontSize: '13px',
                fontFamily: 'inherit',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.1s',
              }}
            >
              {opt}
            </button>
          ))}
          {!current.required && current.skipLabel && (
            <button
              onClick={() => {
                setAnswers((prev) => ({ ...prev, [current.key]: '' }))
                setStep((s) => s + 1)
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'inherit',
                color: 'rgba(255,255,255,0.25)',
                padding: '8px 0',
                textAlign: 'left',
              }}
            >
              {current.skipLabel}
            </button>
          )}
        </div>
      )}

      {/* Text input */}
      {current.type === 'text' && (
        <div>
          <textarea
            className="input"
            placeholder="Type your answer..."
            value={answers[current.key] || ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [current.key]: e.target.value }))}
            style={{ minHeight: '80px', resize: 'vertical', marginBottom: '12px' }}
          />
          <button
            className="btn-primary"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue()}
            style={{ fontSize: '12px', height: '32px', padding: '0 14px' }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
