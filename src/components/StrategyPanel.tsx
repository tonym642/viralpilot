'use client'

import { useState, useRef, useEffect } from 'react'
import MusicInterview from './MusicInterview'

type AiInsights = {
  coreObjective?: string
  audienceInsight?: string
  toneAndEnergy?: string[]
  contentAngles?: string[]
  hookDirections?: string[]
}

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
  ai_insights?: AiInsights | null
  interview_completed?: boolean | null
  strategy_status?: string | null
}

type Project = {
  id: string
  name: string
  mode: string | null
  type: string | null
  description: string | null
  lyrics_text?: string | null
  song_style?: string | null
}

type Recommendation = {
  title: string
  recommendation: string
  targetField: string
  suggestedValue: string
}

type ChatMessage = {
  id: string
  role: string
  content: string
  recommendations?: Recommendation[]
}

const REQUIRED_INTERVIEW_FIELDS = ['goal', 'audience', 'tone', 'content_style', 'cta'] as const

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

function InsightSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <h4 style={{
        margin: '0 0 5px 0',
        fontSize: '10px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'rgba(255,255,255,0.38)',
      }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
}

const RECS_TAG = /<!--RECS:([\s\S]*?)-->/

function parseMessageWithRecs(msg: ChatMessage): ChatMessage {
  if (msg.role !== 'assistant') return msg
  const match = msg.content.match(RECS_TAG)
  if (!match) return msg
  try {
    const recs = JSON.parse(match[1]) as Recommendation[]
    return { ...msg, content: msg.content.replace(RECS_TAG, '').trim(), recommendations: recs }
  } catch {
    return msg
  }
}

const FIELD_LABELS: Record<string, string> = {
  goal: 'Goal', audience: 'Audience', tone: 'Tone',
  content_style: 'Content Style', platform_focus: 'Platform Focus',
  cta: 'CTA', song_meaning: 'Song Meaning',
  differentiator: 'Differentiator', assets_preference: 'Assets Preference',
}

// --- Strategy Chat with audit support ---
function StrategyChat({
  projectId,
  initialMessages,
  disabled,
  disabledReason,
  onAuditComplete,
}: {
  projectId: string
  initialMessages: ChatMessage[]
  disabled?: boolean
  disabledReason?: string
  onAuditComplete?: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages.map(parseMessageWithRecs))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [auditing, setAuditing] = useState(false)
  const [applyingField, setApplyingField] = useState<string | null>(null)
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set())
  const endRef = useRef<HTMLDivElement>(null)

  const handleApply = async (field: string, value: string) => {
    setApplyingField(field)
    try {
      const res = await fetch('/api/apply-strategy-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, field, value }),
      })
      const data = await res.json()
      if (data.success) {
        setAppliedFields((prev) => new Set(prev).add(field))
        setTimeout(() => window.location.reload(), 600)
      }
    } catch { /* */ }
    finally { setApplyingField(null) }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || disabled) return
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: text }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.success ? data.reply : 'Something went wrong.',
        recommendations: data.recommendations || undefined,
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'Network error. Try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleAudit = async () => {
    if (disabled || auditing) return
    setAuditing(true)
    await sendMessage('Review our current strategy and give us structured recommendations for improvement. Audit each field and suggest specific changes.')
    // Mark as audited and generate insights
    try {
      await fetch('/api/update-strategy-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, status: 'audited' }),
      })
      onAuditComplete?.()
    } catch { /* */ }
    finally { setAuditing(false) }
  }

  const quickActions = [
    'Generate 3 hook ideas',
    'Improve my tone',
    'Give me content angles',
    'Make this more viral',
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      background: 'var(--surface-2)',
      border: '1px solid var(--border-default)',
      borderRadius: '10px',
      overflow: 'hidden',
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
    }}>
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'rgba(90,154,245,0.6)',
        }}>
          Strategy Assistant
        </h3>
        <button
          className="btn-primary"
          style={{ fontSize: '10px', height: '24px', padding: '0 10px' }}
          onClick={handleAudit}
          disabled={disabled || auditing || loading}
        >
          {auditing ? 'Auditing...' : 'Run Strategy Audit'}
        </button>
      </div>

      {disabled && disabledReason && (
        <div style={{ padding: '10px 12px', fontSize: '11px', color: 'rgba(251,191,36,0.7)', background: 'rgba(251,191,36,0.05)' }}>
          {disabledReason}
        </div>
      )}

      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {messages.length === 0 && !disabled && (
          <div style={{ margin: 'auto 0', textAlign: 'center', padding: '16px 8px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.42)' }}>
              Run a strategy audit or ask a question
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg-row ${msg.role}`}>
            <span className="chat-msg-label">
              {msg.role === 'user' ? 'You' : 'ViralPilot'}
            </span>
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
              {stripMarkdown(msg.content)}
            </div>
            {msg.recommendations && msg.recommendations.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', maxWidth: '95%' }}>
                {msg.recommendations.map((rec, i) => {
                  const isApplying = applyingField === rec.targetField
                  const isApplied = appliedFields.has(rec.targetField)
                  return (
                    <div key={i} style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isApplied ? '1px solid rgba(74,222,128,0.2)' : '1px solid var(--border-default)',
                      background: isApplied ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#c8d1de' }}>{rec.title}</span>
                        <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(90,154,245,0.1)', color: 'rgba(90,154,245,0.7)', fontWeight: 500 }}>
                          {FIELD_LABELS[rec.targetField] || rec.targetField}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                        {rec.recommendation}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>→ {rec.suggestedValue}</span>
                        <span style={{ flex: 1 }} />
                        {isApplied ? (
                          <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 500 }}>Applied</span>
                        ) : (
                          <button
                            onClick={() => handleApply(rec.targetField, rec.suggestedValue)}
                            disabled={isApplying || !!applyingField}
                            style={{
                              padding: '3px 8px', fontSize: '10px', fontFamily: 'inherit', fontWeight: 600,
                              borderRadius: '5px', border: '1px solid rgba(90,154,245,0.3)',
                              background: 'rgba(90,154,245,0.08)', color: '#5a9af5',
                              cursor: isApplying ? 'wait' : 'pointer', transition: 'all 0.12s',
                            }}
                          >
                            {isApplying ? 'Applying...' : 'Apply to Strategy'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {loading && <div className="chat-thinking">ViralPilot is thinking...</div>}
        <div ref={endRef} />
      </div>

      <div style={{ flexShrink: 0, padding: '6px 10px 8px', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
          {quickActions.map((action) => (
            <button key={action} onClick={() => sendMessage(action)} disabled={loading || disabled}
              style={{ padding: '3px 8px', fontSize: '10px', fontFamily: 'inherit', fontWeight: 500, borderRadius: '5px', border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(90,154,245,0.3)'; e.currentTarget.style.color = '#c8d1de' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
            >{action}</button>
          ))}
        </div>
        <div className="chat-input-row">
          <input type="text" placeholder="Ask about hooks, angles, tone..." value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input.trim()) } }}
            style={{ fontSize: '12px' }} disabled={disabled}
          />
          <button className={`chat-send-icon${input.trim() ? ' active' : ''}`}
            onClick={() => sendMessage(input.trim())} disabled={loading || !input.trim() || disabled}
          >↑</button>
        </div>
      </div>
    </div>
  )
}

// --- Main Strategy Panel ---
export default function StrategyPanel({
  project,
  interview,
  onSwitchToPlan,
  onSwitchToAssets,
  onStrategyApproved,
  messages: initialChatMessages = [],
}: {
  project: Project
  interview: InterviewData | null
  onSwitchToPlan: () => void
  onSwitchToAssets?: () => void
  onStrategyApproved?: () => void
  messages?: ChatMessage[]
}) {
  const [editing, setEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [localInterview, setLocalInterview] = useState<InterviewData | null>(interview)
  const [strategyStatus, setStrategyStatus] = useState<string | null>(
    (interview as Record<string, unknown>)?.strategy_status as string | null ?? null
  )
  const [approving, setApproving] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  const isMusic = project.mode === 'Music'

  // Compute missing required fields
  const missingFields: string[] = []
  for (const f of REQUIRED_INTERVIEW_FIELDS) {
    const val = localInterview?.[f]
    if (!val || (typeof val === 'string' && !val.trim())) {
      missingFields.push(FIELD_LABELS[f] || f)
    }
  }
  if (isMusic && !project.lyrics_text?.trim()) missingFields.push('Lyrics')
  if (isMusic && !project.song_style?.trim()) missingFields.push('Song Style')

  const hasMusicMissing = isMusic && (missingFields.includes('Lyrics') || missingFields.includes('Song Style'))
  const allFieldsComplete = missingFields.length === 0
  const isAudited = strategyStatus === 'audited' || strategyStatus === 'approved'
  const isApproved = strategyStatus === 'approved'

  // No interview yet — show start prompt or inline interview
  if (!localInterview?.interview_completed && !editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px 20px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>No strategy yet</h2>
        <p className="muted" style={{ margin: '0 0 20px 0', fontSize: '13px', maxWidth: '340px', lineHeight: '1.6' }}>
          Complete the interview to build your strategy.
        </p>
        <button className="btn-primary" onClick={() => setEditing(true)}>Start Interview</button>
      </div>
    )
  }

  // Editing mode
  if (editing) {
    const prefill: Record<string, string> = {}
    if (localInterview) {
      for (const f of fields) {
        const val = localInterview[f.key]
        if (val && typeof val === 'string') prefill[f.key] = val
      }
    }
    // Prefill music fields from project
    if (project.song_style) prefill.song_style = project.song_style
    if (project.lyrics_text) prefill.lyrics_text = project.lyrics_text
    return (
      <MusicInterview
        projectId={project.id} projectName={project.name}
        projectMode={project.mode || ''} projectDescription={project.description || ''}
        initialAnswers={prefill} skipPlanGeneration
        onComplete={() => { setEditing(false); window.location.reload() }}
      />
    )
  }

  const filledFields = fields.filter((f) => {
    const val = localInterview?.[f.key]
    return val && typeof val === 'string'
  })

  const insights = localInterview?.ai_insights as AiInsights | null
  const hasInsights = insights && (insights.coreObjective || insights.contentAngles?.length)

  const handleApprove = async () => {
    setApproving(true)
    try {
      const res = await fetch('/api/update-strategy-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, status: 'approved' }),
      })
      const data = await res.json()
      if (data.success) {
        setStrategyStatus('approved')
        onStrategyApproved?.()
        setShowApprovalModal(true)
      }
    } catch { /* */ }
    finally { setApproving(false) }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Strategy</h2>
          {isApproved && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontWeight: 600 }}>
              Approved
            </span>
          )}
          {isAudited && !isApproved && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(90,154,245,0.1)', color: '#5a9af5', fontWeight: 600 }}>
              Audited
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isAudited && !isApproved && (
            <button
              className="btn-primary"
              style={{ fontSize: '11px', height: '28px', padding: '0 12px' }}
              onClick={handleApprove}
              disabled={approving}
            >
              {approving ? 'Approving...' : 'Approve Strategy'}
            </button>
          )}
          <button
            className="vp-btn"
            style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
            onClick={() => setShowConfirm(true)}
          >
            Edit Strategy
          </button>
        </div>
      </div>

      {/* Missing fields warning */}
      {!allFieldsComplete && (
        <div style={{
          padding: '10px 14px', marginBottom: '10px', borderRadius: '6px',
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
          fontSize: '12px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <span style={{ color: 'rgba(251,191,36,0.7)', lineHeight: '1.5' }}>
            {hasMusicMissing
              ? 'Complete your music inputs before running the AI audit. Lyrics and Song Style are required to generate accurate recommendations.'
              : `Complete these fields before audit: ${missingFields.join(', ')}`
            }
          </span>
          {hasMusicMissing && onSwitchToAssets && (
            <button
              className="vp-btn"
              style={{ fontSize: '11px', height: '26px', padding: '0 10px', flexShrink: 0, borderColor: 'rgba(251,191,36,0.25)', color: 'rgba(251,191,36,0.8)' }}
              onClick={onSwitchToAssets}
            >
              Go to Assets →
            </button>
          )}
        </div>
      )}

      {/* Ready message */}
      {allFieldsComplete && !isAudited && (
        <div style={{
          padding: '8px 12px', marginBottom: '10px', borderRadius: '6px',
          background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.12)',
          fontSize: '12px', color: 'rgba(74,222,128,0.7)', flexShrink: 0,
        }}>
          You&apos;re ready to run the Strategy Audit.
        </div>
      )}

      {/* Three-column layout */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Left: Strategy Assistant */}
        <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <StrategyChat
            projectId={project.id}
            initialMessages={initialChatMessages}
            disabled={!allFieldsComplete}
            disabledReason={!allFieldsComplete ? `Complete required fields first: ${missingFields.join(', ')}` : undefined}
            onAuditComplete={() => {
              setStrategyStatus('audited')
              setTimeout(() => window.location.reload(), 800)
            }}
          />
        </div>

        {/* Center: Strategy Fields */}
        <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border-default)',
            borderRadius: '10px', padding: '14px', flex: 1, overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.38)' }}>
              Strategy Fields
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filledFields.map((f) => {
                const val = localInterview?.[f.key] as string
                return (
                  <div key={f.key}>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.38)' }}>
                      {f.label}
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#c8d1de', lineHeight: '1.5' }}>{val}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: AI Insights */}
        <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border-default)',
            borderRadius: '10px', padding: '14px', flex: 1, overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(90,154,245,0.6)' }}>
              AI Insights
            </h3>

            {hasInsights ? (
              <>
                {insights.coreObjective && (
                  <InsightSection title="Core Objective">
                    <p style={{ margin: 0, fontSize: '12px', color: '#c8d1de', lineHeight: '1.65' }}>{insights.coreObjective}</p>
                  </InsightSection>
                )}
                {insights.audienceInsight && (
                  <InsightSection title="Audience Insight">
                    <p style={{ margin: 0, fontSize: '12px', color: '#c8d1de', lineHeight: '1.65' }}>{insights.audienceInsight}</p>
                  </InsightSection>
                )}
                {insights.toneAndEnergy && insights.toneAndEnergy.length > 0 && (
                  <InsightSection title="Tone & Energy">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {insights.toneAndEnergy.map((tag, i) => (
                        <span key={i} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(139,124,245,0.1)', color: '#a99cf0', fontWeight: 500 }}>{tag}</span>
                      ))}
                    </div>
                  </InsightSection>
                )}
                {insights.contentAngles && insights.contentAngles.length > 0 && (
                  <InsightSection title="Content Angles">
                    <ul style={{ margin: 0, paddingLeft: '14px', listStyle: 'none' }}>
                      {insights.contentAngles.map((angle, i) => (
                        <li key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.58)', lineHeight: '1.7', position: 'relative', paddingLeft: '2px' }}>
                          <span style={{ position: 'absolute', left: '-12px', color: 'rgba(90,154,245,0.4)' }}>-</span>{angle}
                        </li>
                      ))}
                    </ul>
                  </InsightSection>
                )}
                {insights.hookDirections && insights.hookDirections.length > 0 && (
                  <InsightSection title="Hook Directions">
                    <ul style={{ margin: 0, paddingLeft: '14px', listStyle: 'none' }}>
                      {insights.hookDirections.map((hook, i) => (
                        <li key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.58)', lineHeight: '1.7', position: 'relative', paddingLeft: '2px' }}>
                          <span style={{ position: 'absolute', left: '-12px', color: 'rgba(90,154,245,0.4)' }}>-</span>{hook}
                        </li>
                      ))}
                    </ul>
                  </InsightSection>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.42)' }}>No insights yet</p>
                <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.25)', lineHeight: '1.5' }}>
                  Run a strategy audit to generate AI insights.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit confirmation modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowConfirm(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '16px', width: '360px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>Edit your strategy?</h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.45)' }}>
              This will reset your audit status and require re-approval.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="vp-btn" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }}
                onClick={() => { setShowConfirm(false); setEditing(true) }}
              >Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Approval success modal */}
      {showApprovalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '24px', width: '400px', maxWidth: '90vw', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>Strategy Approved</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.55)' }}>
              Your strategy is now complete and ready. We&apos;ll use it to generate your content plan and all future content.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                className="vp-btn"
                style={{ fontSize: '12px', height: '28px', padding: '0 12px' }}
                onClick={() => setShowApprovalModal(false)}
              >
                Stay Here
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: '12px', height: '32px', padding: '0 16px' }}
                onClick={() => {
                  setShowApprovalModal(false)
                  onSwitchToPlan()
                }}
              >
                Go to Content Plan →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
