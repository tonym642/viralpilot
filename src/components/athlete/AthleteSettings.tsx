'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AthleteStrategyObject } from '@/src/lib/athleteStrategy'
import type { AthleteContentPlanObject } from '@/src/lib/athleteContentPlan'

export default function AthleteSettings({
  projectId,
  profile,
  brand,
  pillars,
  strategy,
  contentPlan,
  profileComplete,
  brandComplete,
  pillarsComplete,
  strategyGenerated,
  strategyApproved,
  planGenerated,
  onStrategyChange,
  onContentPlanChange,
}: {
  projectId: string
  profile: Record<string, string> | null
  brand: Record<string, string> | null
  pillars: string[] | null
  strategy: AthleteStrategyObject | null
  contentPlan: AthleteContentPlanObject | null
  profileComplete: boolean
  brandComplete: boolean
  pillarsComplete: boolean
  strategyGenerated: boolean
  strategyApproved: boolean
  planGenerated: boolean
  onStrategyChange: (s: AthleteStrategyObject | null) => void
  onContentPlanChange: (p: AthleteContentPlanObject | null) => void
}) {
  const router = useRouter()
  const [modal, setModal] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const items = contentPlan?.items || []
  const generatedItems = items.filter((i) => i.generatedContent)
  const draftCount = items.filter((i) => i.status === 'draft').length
  const readyCount = items.filter((i) => i.status === 'ready').length
  const postedCount = items.filter((i) => i.status === 'posted').length

  const saveSection = async (section: string, data: unknown) => {
    await fetch('/api/save-athlete-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, section, data }),
    })
  }

  const handleResetStrategy = async () => {
    setActing(true)
    const reset: AthleteStrategyObject = { generated: false, approved: false, approvedAt: null, generatedAt: null, version: 0, data: null }
    onStrategyChange(reset)
    await saveSection('strategy', reset)
    setActing(false)
    setModal(null)
  }

  const handleResetContentPlan = async () => {
    setActing(true)
    const reset: AthleteContentPlanObject = { generated: false, generatedAt: null, version: 0, durationDays: 7, status: 'not_started', items: [] }
    onContentPlanChange(reset)
    await saveSection('contentPlan', reset)
    setActing(false)
    setModal(null)
  }

  const handleDuplicate = async () => {
    setActing(true)
    try {
      const { supabase } = await import('@/src/lib/supabaseClient')
      const name = `${profile?.athlete_name || 'Athlete'} Copy`
      const { data: newProject } = await supabase.from('projects').insert([{
        name,
        mode: 'Athlete',
        type: 'Athlete',
        description: `Duplicate of ${profile?.athlete_name || 'athlete project'}`,
      }]).select().single()
      if (newProject) {
        const fullData: Record<string, unknown> = {}
        if (profile) fullData.athlete_profile = profile
        if (brand) fullData.athlete_brand = brand
        if (pillars) fullData.athlete_pillars = pillars
        if (strategy) fullData.athlete_strategy = strategy
        if (contentPlan) fullData.athlete_contentPlan = contentPlan
        await fetch('/api/save-athlete-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: newProject.id, section: 'profile', data: profile }),
        })
        // Save all sections
        for (const [key, val] of Object.entries(fullData)) {
          const section = key.replace('athlete_', '')
          await fetch('/api/save-athlete-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: newProject.id, section, data: val }),
          })
        }
        router.push(`/projects/${newProject.id}`)
      }
    } catch (err) {
      console.error('Duplicate error:', err)
    }
    setActing(false)
    setModal(null)
  }

  const handleDelete = async () => {
    setActing(true)
    try {
      const { supabase } = await import('@/src/lib/supabaseClient')
      await supabase.from('project_interviews').delete().eq('project_id', projectId)
      await supabase.from('content_plans').delete().eq('project_id', projectId)
      await supabase.from('content_items').delete().eq('project_id', projectId)
      await supabase.from('project_messages').delete().eq('project_id', projectId)
      await supabase.from('projects').delete().eq('id', projectId)
      router.push('/projects')
    } catch (err) {
      console.error('Delete error:', err)
    }
    setActing(false)
  }

  const handleArchive = async () => {
    setActing(true)
    try {
      const { supabase } = await import('@/src/lib/supabaseClient')
      await supabase.from('projects').update({ archived: true }).eq('id', projectId)
      router.push('/projects')
    } catch (err) {
      console.error('Archive error:', err)
    }
    setActing(false)
    setModal(null)
  }

  const projectName = profile?.athlete_name || 'this project'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ marginBottom: '20px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Project controls and configuration.</p>
      </div>

      {/* Top row — full width, 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', flexShrink: 0 }}>
        {/* --- Project Actions --- */}
        <SettingsCard title="Project Actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ActionRow label="Duplicate Project" desc="Clone this project with all data" onClick={() => setModal('duplicate')} />
            <ActionRow label="Archive Project" desc="Hide from project list" onClick={() => setModal('archive')} />
            <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
            <ActionRow label="Reset Strategy" desc="Clear strategy and approval status" onClick={() => setModal('reset-strategy')} warning disabled={!strategyGenerated} />
            <ActionRow label="Reset Content Plan" desc="Remove all planned and generated content" onClick={() => setModal('reset-plan')} warning disabled={!planGenerated} />
            <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
            <ActionRow label="Delete Project" desc="Permanently delete this project" onClick={() => setModal('delete')} danger />
          </div>
        </SettingsCard>

        {/* --- Project Status --- */}
        <SettingsCard title="Project Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <StatusRow label="Athlete Profile" status={profileComplete ? 'Complete' : 'Incomplete'} done={profileComplete} />
            <StatusRow label="Brand Identity" status={brandComplete ? 'Complete' : 'Incomplete'} done={brandComplete} />
            <StatusRow label="Content Pillars" status={pillarsComplete ? `${pillars?.length || 0} selected` : `${pillars?.length || 0} selected (min 3)`} done={pillarsComplete} />
            <StatusRow label="Strategy" status={strategyApproved ? 'Approved' : strategyGenerated ? 'Generated' : 'Not started'} done={strategyApproved} partial={strategyGenerated} />
            <StatusRow label="Content Plan" status={planGenerated ? `${contentPlan?.durationDays || 7}-day plan` : 'Not started'} done={planGenerated} />
            <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
            <StatusRow label="Generated Content" status={`${generatedItems.length} items`} done={generatedItems.length > 0} />
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-faint)', paddingLeft: '2px' }}>
              <span>Draft: {draftCount}</span>
              <span>Ready: {readyCount}</span>
              <span>Posted: {postedCount}</span>
            </div>
          </div>
        </SettingsCard>

      </div>

      {/* Bottom row — full width, fills remaining height */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* --- Content Preferences --- */}
        <SettingsCard title="Content Preferences">
          <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: 'var(--text-faint)' }}>These settings will influence future content generation.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <PreferenceField label="Primary Platform">
              <select className="input" style={{ fontSize: '12px' }} defaultValue={strategy?.data?.recommendedPlatforms?.[0] || ''}>
                <option value="">Auto (from strategy)</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="YouTube Shorts">YouTube Shorts</option>
              </select>
            </PreferenceField>
            <PreferenceField label="Posting Frequency">
              <select className="input" style={{ fontSize: '12px' }} defaultValue={strategy?.data?.postingCadence || ''}>
                <option value="">Auto (from strategy)</option>
                <option value="3 posts/week">3 posts/week</option>
                <option value="4 posts/week">4 posts/week</option>
                <option value="5 posts/week">5 posts/week</option>
                <option value="Daily">Daily</option>
              </select>
            </PreferenceField>
            <PreferenceField label="Content Style Bias">
              <select className="input" style={{ fontSize: '12px' }} defaultValue="">
                <option value="">Balanced</option>
                <option value="highlights">More Highlights</option>
                <option value="lifestyle">More Lifestyle</option>
                <option value="training">More Training</option>
                <option value="story">More Story</option>
              </select>
            </PreferenceField>
          </div>
        </SettingsCard>

        {/* --- Strategy Info --- */}
        <SettingsCard title="Strategy Info">
          {strategy?.generated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <StatusBadge label={strategyApproved ? 'Approved' : 'Generated'} color={strategyApproved ? 'green' : 'blue'} />
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>v{strategy.version}</span>
                {strategy.generatedAt && <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{new Date(strategy.generatedAt).toLocaleDateString()}</span>}
              </div>
              {strategy.data && (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
                  {strategy.data.summary}
                </div>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-faint)' }}>No strategy generated yet.</p>
          )}
        </SettingsCard>
      </div>

      {/* --- Modals --- */}
      {modal === 'reset-strategy' && (
        <ConfirmModal
          title="Reset Strategy?"
          body="This will remove your current strategy and its approval status. Your content plan will remain but may become outdated."
          confirmLabel="Reset Strategy"
          onConfirm={handleResetStrategy}
          onCancel={() => setModal(null)}
          acting={acting}
          danger
        />
      )}
      {modal === 'reset-plan' && (
        <ConfirmModal
          title="Reset Content Plan?"
          body="This will remove all planned and generated content. This cannot be undone."
          confirmLabel="Reset Plan"
          onConfirm={handleResetContentPlan}
          onCancel={() => setModal(null)}
          acting={acting}
          danger
        />
      )}
      {modal === 'duplicate' && (
        <ConfirmModal
          title="Duplicate Project?"
          body={`This will create a copy of "${projectName}" with all data including profile, brand, strategy, and content plan.`}
          confirmLabel="Duplicate"
          onConfirm={handleDuplicate}
          onCancel={() => setModal(null)}
          acting={acting}
        />
      )}
      {modal === 'archive' && (
        <ConfirmModal
          title="Archive Project?"
          body="This will hide the project from your main list. You can restore it later from the archived view."
          confirmLabel="Archive"
          onConfirm={handleArchive}
          onCancel={() => setModal(null)}
          acting={acting}
        />
      )}
      {modal === 'delete' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '24px', width: '420px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Delete Project?</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-tertiary)' }}>
              This will permanently delete this project and all its data. This cannot be undone.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Type project name to confirm
              </label>
              <input
                className="input"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={projectName}
                style={{ fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="vp-btn" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={() => { setModal(null); setDeleteConfirmName('') }}>Cancel</button>
              <button
                className="btn-primary"
                style={{ fontSize: '12px', height: '28px', padding: '0 12px', background: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)', opacity: deleteConfirmName === projectName ? 1 : 0.4 }}
                onClick={handleDelete}
                disabled={deleteConfirmName !== projectName || acting}
              >
                {acting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Sub-components ---

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '16px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{title}</h3>
      {children}
    </div>
  )
}

function ActionRow({ label, desc, onClick, warning, danger, disabled }: { label: string; desc: string; onClick: () => void; warning?: boolean; danger?: boolean; disabled?: boolean }) {
  const color = danger ? '#f87171' : warning ? 'rgba(251,191,36,0.8)' : 'var(--text-secondary)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', opacity: disabled ? 0.4 : 1 }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color }}>{label}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{desc}</div>
      </div>
      <button className="vp-btn" style={{ fontSize: '10px', height: '24px', padding: '0 10px', flexShrink: 0 }} onClick={onClick} disabled={disabled}>
        {label.split(' ')[0]}
      </button>
    </div>
  )
}

function StatusRow({ label, status, done, partial }: { label: string; status: string; done: boolean; partial?: boolean }) {
  const dotColor = done ? '#4ade80' : partial ? '#5a9af5' : 'rgba(255,255,255,0.18)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: '11px', color: done ? '#4ade80' : partial ? '#5a9af5' : 'var(--text-faint)', fontWeight: 500 }}>{status}</span>
    </div>
  )
}

function PreferenceField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <label style={{ width: '120px', flexShrink: 0, fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)' }}>{label}</label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function StatusBadge({ label, color }: { label: string; color: 'green' | 'blue' }) {
  const bg = color === 'green' ? 'rgba(74,222,128,0.1)' : 'rgba(90,154,245,0.1)'
  const fg = color === 'green' ? '#4ade80' : '#5a9af5'
  return <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: bg, color: fg, fontWeight: 600 }}>{label}</span>
}

function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel, acting, danger }: {
  title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; acting: boolean; danger?: boolean
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '24px', width: '400px', maxWidth: '90vw' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-tertiary)' }}>{body}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="vp-btn" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            style={{ fontSize: '12px', height: '28px', padding: '0 12px', ...(danger ? { background: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)' } : {}) }}
            onClick={onConfirm}
            disabled={acting}
          >
            {acting ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
