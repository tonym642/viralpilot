'use client'

import { useState } from 'react'
import {
  generateAthleteStrategy,
  type AthleteStrategyObject,
  type AthleteStrategyData,
} from '@/src/lib/athleteStrategy'

type NavKey = 'overview' | 'profile' | 'brand' | 'pillars' | 'strategy' | 'content-plan' | 'library'

export default function AthleteStrategy({
  projectId,
  profile,
  brand,
  pillars,
  profileComplete,
  brandComplete,
  pillarsComplete,
  initialStrategy,
  onNavigate,
  onStrategyChange,
}: {
  projectId: string
  profile: Record<string, string> | null
  brand: Record<string, string> | null
  pillars: string[] | null
  profileComplete: boolean
  brandComplete: boolean
  pillarsComplete: boolean
  initialStrategy: AthleteStrategyObject | null
  onNavigate: (key: NavKey) => void
  onStrategyChange: (strategy: AthleteStrategyObject) => void
}) {
  const [strategy, setStrategy] = useState<AthleteStrategyObject>(
    initialStrategy || { generated: false, approved: false, approvedAt: null, generatedAt: null, version: 0, data: null }
  )
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  const allComplete = profileComplete && brandComplete && pillarsComplete

  const saveStrategy = async (s: AthleteStrategyObject) => {
    setStrategy(s)
    onStrategyChange(s)
    await fetch('/api/save-athlete-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, section: 'strategy', data: s }),
    })
  }

  const handleGenerate = async () => {
    if (!profile || !brand || !pillars) return
    setGenerating(true)
    // Small delay for UX feedback
    await new Promise((r) => setTimeout(r, 600))
    const data = generateAthleteStrategy(profile, brand, pillars)
    const newStrategy: AthleteStrategyObject = {
      generated: true,
      approved: false,
      approvedAt: null,
      generatedAt: new Date().toISOString(),
      version: strategy.version + 1,
      data,
    }
    await saveStrategy(newStrategy)
    setGenerating(false)
  }

  const handleRegenerate = async () => {
    setShowRegenConfirm(false)
    await handleGenerate()
  }

  const handleApprove = async () => {
    setApproving(true)
    const approved: AthleteStrategyObject = {
      ...strategy,
      approved: true,
      approvedAt: new Date().toISOString(),
    }
    await saveStrategy(approved)
    setApproving(false)
    setShowApprovalModal(true)
  }

  // --- Locked state ---
  if (!allComplete) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '22px', color: 'rgba(255,255,255,0.25)' }}>
          🔒
        </div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Strategy Locked</h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '400px', lineHeight: '1.6' }}>
          Before generating strategy, complete:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '280px' }}>
          <PrereqButton label="Athlete Profile" complete={profileComplete} onClick={() => onNavigate('profile')} actionLabel="Complete Profile" />
          <PrereqButton label="Brand Identity" complete={brandComplete} onClick={() => onNavigate('brand')} actionLabel="Complete Brand" />
          <PrereqButton label="Content Pillars (3+)" complete={pillarsComplete} onClick={() => onNavigate('pillars')} actionLabel="Complete Pillars" />
        </div>
      </div>
    )
  }

  // --- Empty state: ready to generate ---
  if (!strategy.generated || !strategy.data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ marginBottom: '20px', flexShrink: 0 }}>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Strategy</h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Generate a content strategy based on the athlete&apos;s profile, brand, and pillars.</p>
        </div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '40px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Ready to Generate Strategy</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: '1.6', maxWidth: '400px' }}>
            All prerequisites are complete. Generate a personalized content strategy based on the athlete&apos;s profile and brand identity.
          </p>
          <button className="btn-primary" style={{ fontSize: '13px', height: '36px', padding: '0 20px' }} onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Strategy'}
          </button>
        </div>
      </div>
    )
  }

  // --- Strategy exists: show it ---
  const d = strategy.data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Strategy</h1>
          {strategy.approved && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontWeight: 600 }}>Approved</span>
          )}
          {strategy.generated && !strategy.approved && (
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(90,154,245,0.1)', color: '#5a9af5', fontWeight: 600 }}>Generated</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="vp-btn" style={{ fontSize: '11px', height: '28px', padding: '0 10px' }} onClick={() => setShowRegenConfirm(true)} disabled={generating}>
            {generating ? 'Generating...' : 'Regenerate'}
          </button>
          {!strategy.approved && (
            <button className="btn-primary" style={{ fontSize: '11px', height: '28px', padding: '0 12px' }} onClick={handleApprove} disabled={approving}>
              {approving ? 'Approving...' : 'Approve Strategy'}
            </button>
          )}
          {strategy.approved && (
            <button className="btn-primary" style={{ fontSize: '11px', height: '28px', padding: '0 12px' }} onClick={() => onNavigate('content-plan')}>
              Go to Content Plan
            </button>
          )}
        </div>
      </div>

      {/* Status row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexShrink: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
        {strategy.generatedAt && <span>Generated {new Date(strategy.generatedAt).toLocaleDateString()}</span>}
        <span>Version {strategy.version}</span>
        {strategy.approvedAt && <span>Approved {new Date(strategy.approvedAt).toLocaleDateString()}</span>}
      </div>

      {/* Strategy content — two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary */}
          <Card title="Strategy Summary">
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.65' }}>{d.summary}</p>
          </Card>

          {/* Core Direction */}
          <Card title="Core Direction">
            <Field label="Primary Goal" value={d.primaryGoal} />
            <Field label="Target Audience" value={d.targetAudience} />
            <Field label="Core Brand Angle" value={d.coreBrandAngle} />
          </Card>

          {/* Content Direction */}
          <Card title="Content Direction">
            <TagField label="Content Mix" items={d.contentMix} />
            <TagField label="Pillar Focus" items={d.pillarFocus} color="purple" />
            <TagField label="Platforms" items={d.recommendedPlatforms} color="blue" />
            <Field label="Posting Cadence" value={d.postingCadence} />
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Creative Direction */}
          <Card title="Creative Direction">
            <ListField label="Hook Style" items={d.hookStyle} />
            <ListField label="Visual Style" items={d.visualStyle} />
            <ListField label="CTA Style" items={d.ctaStyle} />
          </Card>

          {/* Guidance */}
          <Card title="Guidance">
            <ListField label="Do More Of" items={d.doMoreOf} color="green" />
            <ListField label="Avoid" items={d.avoid} color="red" />
          </Card>
        </div>
      </div>

      {/* Regenerate confirmation modal */}
      {showRegenConfirm && (
        <Modal onClose={() => setShowRegenConfirm(false)}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Regenerate Strategy?</h3>
          <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-tertiary)' }}>
            This will replace the current strategy and remove its approval status.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button className="vp-btn" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={() => setShowRegenConfirm(false)}>Cancel</button>
            <button className="btn-primary" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={handleRegenerate}>Regenerate</button>
          </div>
        </Modal>
      )}

      {/* Approval success modal */}
      {showApprovalModal && (
        <Modal>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Strategy Approved</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-tertiary)' }}>
              Your athlete strategy is now locked in. The next step is to generate your content plan based on this strategy.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="vp-btn" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={() => setShowApprovalModal(false)}>Stay Here</button>
              <button className="btn-primary" style={{ fontSize: '12px', height: '32px', padding: '0 16px' }} onClick={() => { setShowApprovalModal(false); onNavigate('content-plan') }}>
                Go to Content Plan →
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// --- Sub-components ---

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ margin: 0, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{value}</p>
    </div>
  )
}

function TagField({ label, items, color = 'default' }: { label: string; items: string[]; color?: string }) {
  const bg = color === 'purple' ? 'rgba(139,124,245,0.1)' : color === 'blue' ? 'rgba(90,154,245,0.1)' : 'rgba(255,255,255,0.05)'
  const fg = color === 'purple' ? '#a99cf0' : color === 'blue' ? '#7db4ff' : 'var(--text-secondary)'
  return (
    <div>
      <span style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
        {items.map((item) => (
          <span key={item} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: bg, color: fg, fontWeight: 500 }}>{item}</span>
        ))}
      </div>
    </div>
  )
}

function ListField({ label, items, color = 'default' }: { label: string; items: string[]; color?: string }) {
  const bullet = color === 'green' ? '#4ade80' : color === 'red' ? '#f87171' : 'rgba(90,154,245,0.5)'
  return (
    <div>
      <span style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px', listStyle: 'none' }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7', position: 'relative', paddingLeft: '2px' }}>
            <span style={{ position: 'absolute', left: '-12px', color: bullet }}>-</span>{item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '24px', width: '400px', maxWidth: '90vw' }}>
        {children}
      </div>
    </div>
  )
}

function PrereqButton({ label, complete, onClick, actionLabel }: { label: string; complete: boolean; onClick: () => void; actionLabel: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px',
      border: complete ? '1px solid rgba(74,222,128,0.15)' : '1px solid var(--border-default)',
      background: complete ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
      color: complete ? '#4ade80' : 'var(--text-secondary)',
      fontSize: '13px', fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer', textAlign: 'left', width: '100%',
    }}>
      <span style={{
        width: '20px', height: '20px', borderRadius: '50%',
        border: complete ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
        background: complete ? '#4ade80' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', flexShrink: 0,
      }}>
        {complete ? '✓' : ''}
      </span>
      {label}
      {!complete && <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--accent-blue)' }}>{actionLabel} →</span>}
    </button>
  )
}
