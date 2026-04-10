'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectStrategy, ContentPillar, PlatformRec } from '@/src/lib/strategyTypes'
import WorkflowGuide from '@/src/components/WorkflowGuide'
import { WORKFLOW_STEPS } from '@/src/lib/workflowConfig'

type Stage = 'idle' | 'generating' | 'refining' | 'done' | 'error'
const RIGHT_TABS = ['Overview', 'Content', 'Platforms', 'Execution'] as const
type RightTab = (typeof RIGHT_TABS)[number]
const QUICK_CHIPS = ['Make it more viral', 'More emotional', 'More aggressive', 'Focus on TikTok', 'Target Gen Z']

export default function StrategyEditor({
  projectId,
  initialStrategy,
  hasDetails,
  hasTrackAnalysis,
}: {
  projectId: string
  initialStrategy: Record<string, unknown> | null
  hasDetails: boolean
  hasTrackAnalysis: boolean
}) {
  const router = useRouter()
  const [strategy, setStrategy] = useState<ProjectStrategy | null>(initialStrategy as ProjectStrategy | null)
  const [stage, setStage] = useState<Stage>(strategy ? 'done' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>('Overview')
  const [refinementInput, setRefinementInput] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const generate = async (refinement?: string) => {
    setError(null)
    setStage(refinement ? 'refining' : 'generating')
    if (refinement) { setMessages((prev) => [...prev, { role: 'user', text: refinement }]); setRefinementInput('') }

    try {
      const res = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, refinement, existingStrategy: strategy ? JSON.stringify(strategy) : undefined }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Generation failed'); setStage('error')
        if (refinement) setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${data.error}` }])
        return
      }
      setStrategy(data.strategy as ProjectStrategy); setStage('done')
      if (refinement) setMessages((prev) => [...prev, { role: 'assistant', text: 'Strategy updated.' }])
      else { setMessages([{ role: 'assistant', text: 'Strategy generated! Browse the tabs on the right and refine here.' }]); setRightTab('Overview') }
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); setStage('error') }
  }

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!refinementInput.trim() || stage === 'generating' || stage === 'refining') return
    generate(refinementInput.trim())
  }

  const isWorking = stage === 'generating' || stage === 'refining'

  return (
    <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>

      {/* ══════════ LEFT PANEL: AI ASSISTANT (38%) ══════════ */}
      <div style={{ width: '38%', flexShrink: 0, background: 'var(--surface-2)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', borderRadius: '10px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Strategy Assistant</h2>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Generate and refine your content strategy</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <StatusBadge label="Details" ok={hasDetails} />
            <StatusBadge label="Analysis" ok={hasTrackAnalysis} />
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!hasDetails && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(251,191,36,0.06)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(251,191,36,0.15)', fontSize: '12px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 500, color: '#fbbf24' }}>Add project details first</p>
              <button className="btn-primary" style={{ fontSize: '11px', height: '28px', padding: '0 12px' }} onClick={() => router.push(`/projects/${projectId}/details`)}>Go to Details</button>
            </div>
          )}

          {hasDetails && !strategy && messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>Ready to generate your strategy</p>
              <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {hasTrackAnalysis ? 'Using your details, lyrics, and track analysis.' : 'Using your details and lyrics. Add track analysis for richer results.'}
              </p>
              <button className="btn-primary" style={{ fontSize: '12px', height: '34px', padding: '0 20px' }} onClick={() => generate()} disabled={isWorking}>
                {isWorking ? 'Generating...' : 'Generate Strategy'}
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: '1.5',
                background: msg.role === 'user' ? 'rgba(90,154,245,0.12)' : 'rgba(255,255,255,0.04)',
                color: msg.role === 'user' ? '#7db4ff' : 'var(--text-secondary)',
              }}>{msg.text}</div>
            </div>
          ))}

          {isWorking && (
            <div style={{ display: 'flex', gap: '4px', padding: '8px 0' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse 1s infinite' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse 1s infinite 0.2s' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse 1s infinite 0.4s' }} />
            </div>
          )}
        </div>

        {/* Quick chips */}
        {strategy && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 16px 0', flexShrink: 0 }}>
            {QUICK_CHIPS.map((chip) => (
              <button key={chip} onClick={() => setRefinementInput(chip)} style={{
                padding: '4px 10px', fontSize: '10px', fontWeight: 500, fontFamily: 'inherit',
                borderRadius: '12px', borderWidth: '1px', borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.08)', background: 'transparent',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(90,154,245,0.3)'; e.currentTarget.style.color = '#7db4ff' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
              >{chip}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleRefineSubmit} style={{ padding: '10px 16px 12px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--surface-3)', borderWidth: '1px', borderStyle: 'solid',
            borderColor: refinementInput.trim() ? 'rgba(90,154,245,0.4)' : 'var(--border-default)',
            borderRadius: '22px', padding: '6px 6px 6px 14px', transition: 'border-color 0.15s',
          }}>
            <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 }} title="Attach file">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <input
              value={refinementInput}
              onChange={(e) => setRefinementInput(e.target.value)}
              placeholder={strategy ? 'Add an idea, question, or direction...' : 'Generate a strategy first'}
              disabled={!strategy || isWorking}
              style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', padding: '4px 0' }}
            />
            <button type="submit" disabled={!strategy || isWorking || !refinementInput.trim()} style={{
              width: '28px', height: '28px', borderRadius: '50%', border: 'none',
              cursor: refinementInput.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s',
              background: refinementInput.trim() ? '#eef1f6' : 'rgba(255,255,255,0.06)',
              color: refinementInput.trim() ? '#15181e' : 'var(--text-muted)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* ══════════ RIGHT PANEL: STRATEGY OUTPUT (62%) ══════════ */}
      <div style={{ flex: 1, background: 'var(--surface-2)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', borderRadius: '10px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Header + tabs */}
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: strategy ? 'none' : '1px solid var(--border-subtle)', paddingBottom: strategy ? '0' : '12px' }}>
            <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Strategy</h2>
            {strategy && (
              <button className="vp-btn" style={{ fontSize: '10px', height: '26px', padding: '0 10px' }} onClick={() => generate()} disabled={isWorking}>
                {isWorking ? '...' : 'Regenerate'}
              </button>
            )}
          </div>

          {/* Tabs inside right panel */}
          {strategy && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', borderBottom: '1px solid var(--border-subtle)', marginTop: '6px' }}>
              {RIGHT_TABS.map((tab) => (
                <button key={tab} onClick={() => setRightTab(tab)} style={{
                  padding: '7px 14px', fontSize: '12px', fontWeight: rightTab === tab ? 600 : 400,
                  color: rightTab === tab ? '#eef1f6' : 'rgba(255,255,255,0.5)',
                  background: 'transparent', border: 'none',
                  borderBottom: rightTab === tab ? '2px solid #5a9af5' : '2px solid transparent',
                  cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px', transition: 'color 0.15s',
                }}>{tab}</button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {/* Empty */}
          {!strategy && !isWorking && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: '300px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>No strategy generated yet</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', maxWidth: '280px', textAlign: 'center', lineHeight: '1.5' }}>
                Use the assistant on the left to generate your strategy.
              </p>
            </div>
          )}

          {/* Loading */}
          {isWorking && !strategy && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: '300px' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--accent-blue)' }}>Generating strategy...</p>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {strategy && rightTab === 'Overview' && (
            <div style={{ padding: '16px 20px' }}>
              {strategy.whyThisSongWins && (
                <div style={{ background: 'rgba(90,154,245,0.04)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(90,154,245,0.15)', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 600, color: '#7db4ff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Why This Song Wins</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7' }}>{strategy.whyThisSongWins}</p>
                </div>
              )}
              {strategy.positioning && <Row label="Positioning"><p style={txt}>{strategy.positioning}</p></Row>}
              {strategy.audienceStrategy?.primaryAudience && <Row label="Primary Audience"><p style={txt}>{strategy.audienceStrategy.primaryAudience}</p></Row>}
              {strategy.audienceStrategy?.secondaryAudience && <Row label="Secondary Audience"><p style={txt}>{strategy.audienceStrategy.secondaryAudience}</p></Row>}
              {strategy.audienceStrategy?.audienceReasoning && <Row label="Audience Reasoning"><p style={muted}>{strategy.audienceStrategy.audienceReasoning}</p></Row>}
              {strategy.creativeDirection?.tone && <Row label="Tone"><Tag text={strategy.creativeDirection.tone} /></Row>}

              {/* Workflow guide */}
              <WorkflowGuide
                projectId={projectId}
                {...WORKFLOW_STEPS[2].guide}
              />
            </div>
          )}

          {/* ── CONTENT ── */}
          {strategy && rightTab === 'Content' && (
            <div style={{ padding: '16px 20px' }}>
              {strategy.contentPillars && strategy.contentPillars.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Content Pillars</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    {strategy.contentPillars.map((p: ContentPillar, i: number) => (
                      <div key={i} style={{ background: 'var(--surface-3)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', borderRadius: '8px', padding: '14px' }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</h4>
                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.5' }}>{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {strategy.hookStrategy?.strongestAngles?.length > 0 && <Row label="Strongest Angles"><Tags items={strategy.hookStrategy.strongestAngles} /></Row>}
              {strategy.hookStrategy?.hookStyles?.length > 0 && <Row label="Hook Styles"><Tags items={strategy.hookStrategy.hookStyles} accent /></Row>}
              {strategy.creativeDirection?.deliveryStyle && <Row label="Delivery Style"><Tag text={strategy.creativeDirection.deliveryStyle} /></Row>}
              {strategy.creativeDirection?.emotionalEnergy && <Row label="Emotional Energy"><Tag text={strategy.creativeDirection.emotionalEnergy} /></Row>}
              {strategy.creativeDirection?.visualDirection && <Row label="Visual Direction"><p style={txt}>{strategy.creativeDirection.visualDirection}</p></Row>}
            </div>
          )}

          {/* ── PLATFORMS ── */}
          {strategy && rightTab === 'Platforms' && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {strategy.platformStrategy && strategy.platformStrategy.length > 0 ? (
                strategy.platformStrategy.map((p: PlatformRec, i: number) => (
                  <div key={i} style={{ background: 'var(--surface-3)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', borderRadius: '8px', padding: '14px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#b0a4f5', minWidth: '110px', flexShrink: 0 }}>{p.platform}</span>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>{p.recommendation}</p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No platform strategy yet</p>
              )}
            </div>
          )}

          {/* ── EXECUTION ── */}
          {strategy && rightTab === 'Execution' && (
            <div style={{ padding: '16px 20px' }}>
              {strategy.postingRhythm && (
                <>
                  <Row label="Plan Length">
                    <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '14px', fontSize: '13px', fontWeight: 700, background: 'rgba(90,154,245,0.12)', color: '#7db4ff', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(90,154,245,0.25)' }}>
                      {strategy.postingRhythm.recommendedPlanLength}
                    </span>
                  </Row>
                  {strategy.postingRhythm.cadence && <Row label="Cadence"><p style={txt}>{strategy.postingRhythm.cadence}</p></Row>}
                  {strategy.postingRhythm.reasoning && <Row label="Why This Rhythm"><p style={muted}>{strategy.postingRhythm.reasoning}</p></Row>}
                </>
              )}
              {strategy.priorityRecommendations && strategy.priorityRecommendations.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Priority Actions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {strategy.priorityRecommendations.map((r: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 12px', background: 'var(--surface-3)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', borderRadius: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-blue)', minWidth: '20px' }}>{i + 1}.</span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }`}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const txt: React.CSSProperties = { margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7' }
const muted: React.CSSProperties = { margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ width: '140px', flexShrink: 0, fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: '2px' }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

function Tag({ text }: { text: string }) {
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500, background: 'rgba(139,124,245,0.08)', color: '#b0a4f5' }}>{text}</span>
}

function Tags({ items, accent }: { items: string[]; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.map((t, i) => (
        <span key={i} style={{
          padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500,
          background: accent ? 'rgba(90,154,245,0.1)' : 'rgba(255,255,255,0.04)',
          color: accent ? '#7db4ff' : 'rgba(255,255,255,0.6)',
          borderWidth: '1px', borderStyle: 'solid',
          borderColor: accent ? 'rgba(90,154,245,0.2)' : 'rgba(255,255,255,0.06)',
        }}>{t}</span>
      ))}
    </div>
  )
}

function StatusBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span style={{
      padding: '3px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600,
      background: ok ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)',
      color: ok ? '#4ade80' : 'var(--text-muted)',
      borderWidth: '1px', borderStyle: 'solid',
      borderColor: ok ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
    }}>{label}</span>
  )
}
