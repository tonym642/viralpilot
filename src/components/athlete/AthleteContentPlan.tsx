'use client'

import { useState, useEffect } from 'react'
import {
  generateAthleteContentPlan,
  type AthleteContentPlanObject,
} from '@/src/lib/athleteContentPlan'
import { generateContentForItem } from '@/src/lib/athleteContentGenerator'
import type { AthleteStrategyData } from '@/src/lib/athleteStrategy'

type NavKey = 'overview' | 'profile' | 'brand' | 'pillars' | 'strategy' | 'content-plan' | 'library'

export default function AthleteContentPlan({
  projectId,
  strategyGenerated,
  strategyApproved,
  strategyData,
  profile,
  pillars,
  initialPlan,
  initialSelectedId,
  onNavigate,
  onPlanChange,
}: {
  projectId: string
  strategyGenerated: boolean
  strategyApproved: boolean
  strategyData: AthleteStrategyData | null
  profile: Record<string, string> | null
  pillars: string[] | null
  initialPlan: AthleteContentPlanObject | null
  initialSelectedId?: string | null
  onNavigate: (key: NavKey) => void
  onPlanChange: (plan: AthleteContentPlanObject) => void
}) {
  const [plan, setPlan] = useState<AthleteContentPlanObject>(
    initialPlan || { generated: false, generatedAt: null, version: 0, durationDays: 7, status: 'not_started', items: [] }
  )
  const [selectedDuration, setSelectedDuration] = useState<7 | 14 | 30>(
    (initialPlan?.durationDays as 7 | 14 | 30) || 7
  )
  const [generating, setGenerating] = useState(false)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null)
  const [platformFilter, setPlatformFilter] = useState<string>('All')

  const platforms = plan.items.length > 0
    ? ['All', ...Array.from(new Set(plan.items.map((i) => i.platform)))]
    : ['All']
  const filteredItems = platformFilter === 'All'
    ? plan.items
    : plan.items.filter((i) => i.platform === platformFilter)

  useEffect(() => {
    if (filteredItems.length > 0 && (!selectedId || !filteredItems.find((i) => i.id === selectedId))) {
      setSelectedId(filteredItems[0].id)
    }
  }, [filteredItems, selectedId])

  const selectedItem = selectedId ? plan.items.find((i) => i.id === selectedId) || null : null
  const durationMismatch = plan.generated && selectedDuration !== plan.durationDays
  const hasGeneratedContent = !!selectedItem?.generatedContent

  const savePlan = async (p: AthleteContentPlanObject) => {
    setPlan(p)
    onPlanChange(p)
    await fetch('/api/save-athlete-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, section: 'contentPlan', data: p }),
    })
  }

  const handleGeneratePlan = async () => {
    if (!strategyData || !profile || !pillars) return
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 500))
    const items = generateAthleteContentPlan(selectedDuration, strategyData, profile, pillars)
    const newPlan: AthleteContentPlanObject = {
      generated: true,
      generatedAt: new Date().toISOString(),
      version: plan.version + 1,
      durationDays: selectedDuration,
      status: 'generated',
      items,
    }
    setSelectedId(items[0]?.id || null)
    await savePlan(newPlan)
    setGenerating(false)
  }

  const handleRegenerate = async () => {
    setShowRegenConfirm(false)
    await handleGeneratePlan()
  }

  const handleGenerateContent = async () => {
    if (!selectedItem || !strategyData || !profile) return
    setGeneratingContent(true)
    await new Promise((r) => setTimeout(r, 400))
    const gen = generateContentForItem(selectedItem, profile, strategyData)
    const existingVersion = selectedItem.generatedContent?.version || 0
    const updated = {
      ...plan,
      items: plan.items.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              generatedContent: {
                ...gen,
                version: existingVersion + 1,
              },
            }
          : item
      ),
    }
    await savePlan(updated)
    setGeneratingContent(false)
  }

  const handleStatusChange = async (itemId: string, status: 'draft' | 'ready' | 'posted') => {
    const updated = {
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId ? { ...item, status } : item
      ),
    }
    await savePlan(updated)
  }

  // --- Gating ---
  if (!strategyGenerated) {
    return <LockedState icon="🔒" title="Content Plan Locked" message="Generate your strategy before creating a content plan." buttonLabel="Go to Strategy" onClick={() => onNavigate('strategy')} />
  }
  if (!strategyApproved) {
    return <LockedState icon="⚠️" title="Strategy Not Approved" message="Approve your strategy before creating a content plan." buttonLabel="Go to Strategy" onClick={() => onNavigate('strategy')} warning />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Content Plan</h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Your structured content calendar.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {([7, 14, 30] as const).map((d) => (
              <button key={d} onClick={() => setSelectedDuration(d)} style={{
                padding: '4px 12px', fontSize: '11px', fontWeight: 500, fontFamily: 'inherit', borderRadius: '5px',
                border: selectedDuration === d ? '1px solid rgba(90,154,245,0.4)' : '1px solid var(--border-default)',
                background: selectedDuration === d ? 'rgba(90,154,245,0.1)' : 'transparent',
                color: selectedDuration === d ? '#7db4ff' : 'var(--text-tertiary)',
                cursor: 'pointer', transition: 'all 0.12s',
              }}>{d}d</button>
            ))}
          </div>
          {!plan.generated ? (
            <button className="btn-primary" style={{ fontSize: '11px', height: '28px', padding: '0 12px' }} onClick={handleGeneratePlan} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Plan'}
            </button>
          ) : (
            <button className="vp-btn" style={{ fontSize: '11px', height: '28px', padding: '0 10px' }} onClick={() => setShowRegenConfirm(true)} disabled={generating}>
              {generating ? 'Generating...' : 'Regenerate'}
            </button>
          )}
        </div>
      </div>

      {/* Duration mismatch */}
      {durationMismatch && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', borderRadius: '6px', flexShrink: 0, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', fontSize: '12px', color: 'rgba(251,191,36,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Duration changed from {plan.durationDays} to {selectedDuration} days. Regenerate to apply.</span>
          <button className="vp-btn" style={{ fontSize: '10px', height: '24px', padding: '0 8px', borderColor: 'rgba(251,191,36,0.25)', color: 'rgba(251,191,36,0.8)' }} onClick={() => setShowRegenConfirm(true)}>Regenerate →</button>
        </div>
      )}

      {/* Empty state */}
      {!plan.generated && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '40px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Ready to Plan</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: '1.6', maxWidth: '360px' }}>Generate a {selectedDuration}-day content plan based on your approved strategy.</p>
          <button className="btn-primary" onClick={handleGeneratePlan} disabled={generating} style={{ fontSize: '13px', height: '36px', padding: '0 20px' }}>
            {generating ? 'Generating...' : 'Generate Content Plan'}
          </button>
        </div>
      )}

      {/* Plan exists — split layout */}
      {plan.generated && plan.items.length > 0 && (
        <>
          {/* Summary + filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
            <span className="muted" style={{ fontSize: '12px' }}>
              {filteredItems.length} of {plan.items.length} days
            </span>
            <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>v{plan.version}</span>
              {plan.generatedAt && <span>{new Date(plan.generatedAt).toLocaleDateString()}</span>}
              <span>{plan.items.filter((i) => i.status === 'ready').length} ready</span>
              <span>{plan.items.filter((i) => i.status === 'posted').length} posted</span>
              <span>{plan.items.filter((i) => i.generatedContent).length} content generated</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px', flexShrink: 0 }}>
            {platforms.map((pf) => (
              <button key={pf} onClick={() => setPlatformFilter(pf)} style={{
                padding: '3px 10px', fontSize: '11px', fontWeight: 500, fontFamily: 'inherit',
                borderRadius: '12px', border: '1px solid',
                borderColor: platformFilter === pf ? 'rgba(90,154,245,0.4)' : 'rgba(255,255,255,0.08)',
                background: platformFilter === pf ? 'rgba(90,154,245,0.15)' : 'transparent',
                color: platformFilter === pf ? '#7db4ff' : 'rgba(255,255,255,0.45)',
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>{pf}</button>
            ))}
          </div>

          {/* Split view */}
          <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
            {/* Left: item list */}
            <div style={{ width: '40%', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredItems.map((item) => {
                const isSelected = selectedId === item.id
                const isPosted = item.status === 'posted'
                return (
                  <div key={item.id} onClick={() => setSelectedId(item.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '7px 8px', marginBottom: '1px', borderRadius: '6px', cursor: 'pointer',
                    transition: 'background 0.1s',
                    background: isSelected ? 'rgba(90,154,245,0.12)' : isPosted ? 'rgba(255,255,255,0.015)' : 'transparent',
                    borderLeft: isSelected ? '2px solid #5a9af5' : isPosted ? '2px solid rgba(80,200,120,0.2)' : '2px solid transparent',
                  }}>
                    <span style={{ color: isPosted ? 'rgba(255,255,255,0.32)' : '#8b7cf5', fontWeight: 600, fontSize: '11px', minWidth: '36px', flexShrink: 0 }}>Day {item.day}</span>
                    <span style={{
                      flex: 1, fontSize: '13px',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected && !isPosted ? '#edf0f5' : isPosted ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.6)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{item.title}</span>
                    <span style={{ flex: '0 0 auto' }} />
                    {item.generatedContent && (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(74,222,128,0.5)', flexShrink: 0 }} />
                    )}
                    {item.status !== 'draft' && <StatusBadge status={item.status} />}
                    <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: isPosted ? 'rgba(255,255,255,0.04)' : 'rgba(139,124,245,0.08)', color: isPosted ? 'rgba(255,255,255,0.32)' : '#b0a4f5', fontWeight: 500, flexShrink: 0 }}>{item.platform}</span>
                  </div>
                )
              })}
            </div>

            {/* Right: detail panel */}
            <div style={{
              flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border-default)',
              borderRadius: '10px', padding: '14px 16px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column',
            }}>
              {selectedItem ? (
                <>
                  {/* Header + Generate button */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ color: '#8b7cf5', fontWeight: 700, fontSize: '11px' }}>Day {selectedItem.day}</span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>{selectedItem.platform}</span>
                      <span style={{ flex: 1 }} />
                      <button
                        className="vp-btn"
                        style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                        onClick={handleGenerateContent}
                        disabled={generatingContent}
                      >
                        {generatingContent ? 'Generating...' : hasGeneratedContent ? 'Regenerate' : 'Generate Content'}
                      </button>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#edf0f5' }}>{selectedItem.title}</h3>
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'rgba(255,255,255,0.45)' }}>{selectedItem.concept}</p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', marginBottom: '14px' }} />

                  {/* Content preview or empty state */}
                  {hasGeneratedContent ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Hook */}
                      <ContentSection label="Hook">
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#edf0f5', lineHeight: '1.5', borderLeft: '2px solid rgba(90,154,245,0.3)', paddingLeft: '10px' }}>
                          {selectedItem.hook}
                        </p>
                      </ContentSection>

                      {/* Script */}
                      <ContentSection label="Script">
                        <p style={{ margin: 0, fontSize: '13px', color: '#c0cad8', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                          {selectedItem.generatedContent!.script}
                        </p>
                      </ContentSection>

                      {/* Caption */}
                      <ContentSection label="Caption">
                        <p style={{ margin: 0, fontSize: '13px', color: '#c0cad8', lineHeight: '1.75' }}>
                          {selectedItem.generatedContent!.caption}
                        </p>
                      </ContentSection>

                      {/* Hashtags */}
                      <ContentSection label="Hashtags">
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                          {selectedItem.generatedContent!.hashtags.join('  ')}
                        </p>
                      </ContentSection>

                      {/* Visual Direction */}
                      <ContentSection label="Visual Direction">
                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
                          {selectedItem.generatedContent!.visualDirection}
                        </p>
                      </ContentSection>
                    </div>
                  ) : (
                    <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                      Click Generate Content to create hook, script, caption, and more.
                    </p>
                  )}

                  {/* Action bar */}
                  <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '6px' }}>
                    <span style={{ flex: 1 }} />
                    {selectedItem.status === 'draft' && (
                      <button className="btn-primary" style={{ fontSize: '10px', height: '26px', padding: '0 10px' }} onClick={() => handleStatusChange(selectedItem.id, 'ready')}>
                        Mark Ready
                      </button>
                    )}
                    {selectedItem.status === 'ready' && (
                      <button className="btn-primary" style={{ fontSize: '10px', height: '26px', padding: '0 10px', background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)' }} onClick={() => handleStatusChange(selectedItem.id, 'posted')}>
                        Mark Posted
                      </button>
                    )}
                    {selectedItem.status === 'posted' && (
                      <button className="vp-btn" style={{ fontSize: '10px', height: '26px', padding: '0 10px' }} onClick={() => handleStatusChange(selectedItem.id, 'draft')}>
                        Back to Draft
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>No item selected</p>
                  <p className="muted" style={{ margin: 0, fontSize: '12px' }}>Select a day from the list to view details.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Regenerate plan confirmation */}
      {showRegenConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowRegenConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '24px', width: '400px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Regenerate Content Plan?</h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-tertiary)' }}>This will replace your current content plan for this athlete project.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="vp-btn" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={() => setShowRegenConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={handleRegenerate}>Regenerate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    draft: { bg: 'rgba(255,255,255,0.05)', fg: 'var(--text-faint)' },
    ready: { bg: 'rgba(90,154,245,0.1)', fg: '#7db4ff' },
    posted: { bg: 'rgba(74,222,128,0.1)', fg: '#4ade80' },
  }
  const s = map[status] || map.draft
  return <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', fontWeight: 600, textTransform: 'capitalize', background: s.bg, color: s.fg }}>{status}</span>
}

function ContentSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 style={{ margin: '0 0 6px 0', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.32)' }}>{label}</h4>
      {children}
    </div>
  )
}

function LockedState({ icon, title, message, buttonLabel, onClick, warning }: { icon: string; title: string; message: string; buttonLabel: string; onClick: () => void; warning?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: warning ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '22px', color: 'rgba(255,255,255,0.25)' }}>{icon}</div>
      <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '360px', lineHeight: '1.6' }}>{message}</p>
      <button className="btn-primary" onClick={onClick}>{buttonLabel}</button>
    </div>
  )
}
