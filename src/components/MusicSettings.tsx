'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Project = {
  id: string
  name: string
  mode: string | null
  description: string | null
  lyrics_text?: string | null
  song_style?: string | null
}

type Plan = { id: string }
type ContentItem = { id: string; status: string }

export default function MusicSettings({
  project,
  interviewData,
  interviewCompleted,
  strategyStatus,
  plans,
  contentItems,
}: {
  project: Project
  interviewData: Record<string, unknown> | null
  interviewCompleted: boolean
  strategyStatus: string | null
  plans: Plan[]
  contentItems: ContentItem[]
}) {
  const router = useRouter()
  const [modal, setModal] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const hasLyrics = !!(project.lyrics_text?.trim())
  const hasSongStyle = !!(project.song_style?.trim())
  const songSetupComplete = hasLyrics && hasSongStyle
  const strategyGenerated = strategyStatus === 'audited' || strategyStatus === 'approved'
  const strategyApproved = strategyStatus === 'approved'
  const hasPlan = plans.length > 0
  const hasContent = contentItems.length > 0

  const draftCount = contentItems.filter((i) => i.status === 'draft').length
  const readyCount = contentItems.filter((i) => i.status === 'ready').length
  const postedCount = contentItems.filter((i) => i.status === 'posted').length

  const getSupabase = async () => {
    const { supabase } = await import('@/src/lib/supabaseClient')
    return supabase
  }

  const handleResetStrategy = async () => {
    setActing(true)
    try {
      const supabase = await getSupabase()
      await supabase.from('project_interviews').update({
        strategy_status: null,
        ai_insights: null,
        raw_strategy_text: null,
        structured_strategy: null,
      }).eq('project_id', project.id)
    } catch (e) { console.error(e) }
    setActing(false)
    setModal(null)
    router.refresh()
  }

  const handleResetContentPlan = async () => {
    setActing(true)
    try {
      const supabase = await getSupabase()
      await supabase.from('content_items').delete().eq('project_id', project.id)
      await supabase.from('content_plans').delete().eq('project_id', project.id)
    } catch (e) { console.error(e) }
    setActing(false)
    setModal(null)
    router.refresh()
  }

  const handleDuplicate = async () => {
    setActing(true)
    try {
      const supabase = await getSupabase()
      const { data: newProject } = await supabase.from('projects').insert([{
        name: `${project.name} Copy`,
        mode: project.mode,
        type: project.mode,
        description: project.description,
        lyrics_text: project.lyrics_text,
        song_style: project.song_style,
      }]).select().single()
      if (newProject) {
        router.push(`/projects/${newProject.id}`)
      }
    } catch (e) { console.error(e) }
    setActing(false)
    setModal(null)
  }

  const handleArchive = async () => {
    setActing(true)
    try {
      const supabase = await getSupabase()
      await supabase.from('projects').update({ archived: true }).eq('id', project.id)
      router.push('/projects')
    } catch (e) { console.error(e) }
    setActing(false)
    setModal(null)
  }

  const handleDelete = async () => {
    setActing(true)
    try {
      const supabase = await getSupabase()
      await supabase.from('project_interviews').delete().eq('project_id', project.id)
      await supabase.from('content_plans').delete().eq('project_id', project.id)
      await supabase.from('content_items').delete().eq('project_id', project.id)
      await supabase.from('project_messages').delete().eq('project_id', project.id)
      await supabase.from('projects').delete().eq('id', project.id)
      router.push('/projects')
    } catch (e) { console.error(e) }
    setActing(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <div style={{ marginBottom: '20px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>Project controls and configuration.</p>
      </div>

      {/* Top row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', flexShrink: 0 }}>
        {/* Project Actions */}
        <SettingsCard title="Project Actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ActionRow label="Duplicate Project" desc="Clone this project with song data" onClick={() => setModal('duplicate')} />
            <ActionRow label="Archive Project" desc="Hide from project list" onClick={() => setModal('archive')} />
            <Divider />
            <ActionRow label="Reset Strategy" desc="Clear strategy and approval status" onClick={() => setModal('reset-strategy')} warning disabled={!strategyGenerated} />
            <ActionRow label="Reset Content Plan" desc="Remove all planned and generated content" onClick={() => setModal('reset-plan')} warning disabled={!hasPlan} />
            <Divider />
            <ActionRow label="Delete Project" desc="Permanently delete this project" onClick={() => setModal('delete')} danger />
          </div>
        </SettingsCard>

        {/* Project Status */}
        <SettingsCard title="Project Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <StatusRow label="Song Setup" status={songSetupComplete ? 'Complete' : 'Incomplete'} done={songSetupComplete} />
            <StatusRow label="Lyrics" status={hasLyrics ? 'Added' : 'Missing'} done={hasLyrics} />
            <StatusRow label="Song Style" status={hasSongStyle ? 'Added' : 'Missing'} done={hasSongStyle} />
            <StatusRow label="Strategy Interview" status={interviewCompleted ? 'Complete' : 'Not started'} done={interviewCompleted} />
            <StatusRow label="Strategy" status={strategyApproved ? 'Approved' : strategyGenerated ? 'Audited' : 'Not started'} done={strategyApproved} partial={strategyGenerated} />
            <StatusRow label="Content Plan" status={hasPlan ? `${plans.length}-day plan` : 'Not started'} done={hasPlan} />
            <Divider />
            <StatusRow label="Generated Content" status={`${contentItems.length} items`} done={hasContent} />
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-faint)', paddingLeft: '2px' }}>
              <span>Draft: {draftCount}</span>
              <span>Ready: {readyCount}</span>
              <span>Posted: {postedCount}</span>
            </div>
          </div>
        </SettingsCard>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Content Preferences */}
        <SettingsCard title="Content Preferences">
          <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: 'var(--text-faint)' }}>These settings will influence future content generation.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <PreferenceField label="Primary Platform">
              <select className="input" style={{ fontSize: '12px' }} defaultValue={interviewData?.platform_focus as string || ''}>
                <option value="">Auto (from strategy)</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="YouTube Shorts">YouTube Shorts</option>
              </select>
            </PreferenceField>
            <PreferenceField label="Posting Frequency">
              <select className="input" style={{ fontSize: '12px' }} defaultValue="">
                <option value="">Auto</option>
                <option value="3 posts/week">3 posts/week</option>
                <option value="5 posts/week">5 posts/week</option>
                <option value="Daily">Daily</option>
              </select>
            </PreferenceField>
            <PreferenceField label="Content Style Bias">
              <select className="input" style={{ fontSize: '12px' }} defaultValue="">
                <option value="">Balanced</option>
                <option value="lyrics">More Lyrics Clips</option>
                <option value="story">More Story Clips</option>
                <option value="visual">More Visual Clips</option>
              </select>
            </PreferenceField>
          </div>
        </SettingsCard>

        {/* Strategy Info */}
        <SettingsCard title="Strategy Info">
          {interviewCompleted && interviewData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {strategyApproved && <StatusBadge label="Approved" color="green" />}
                {strategyGenerated && !strategyApproved && <StatusBadge label="Audited" color="blue" />}
                {!strategyGenerated && <StatusBadge label="Pending Audit" color="default" />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                <InfoField label="Goal" value={interviewData.goal as string} />
                <InfoField label="Audience" value={interviewData.audience as string} />
                <InfoField label="Tone" value={interviewData.tone as string} />
                <InfoField label="Style" value={interviewData.content_style as string} />
                <InfoField label="Platform" value={interviewData.platform_focus as string} />
                <InfoField label="CTA" value={interviewData.cta as string} />
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-faint)' }}>No strategy interview completed yet.</p>
          )}
        </SettingsCard>
      </div>

      {/* Modals */}
      {modal === 'reset-strategy' && (
        <ConfirmModal title="Reset Strategy?" body="This will clear your strategy status, AI insights, and require re-audit." confirmLabel="Reset Strategy" onConfirm={handleResetStrategy} onCancel={() => setModal(null)} acting={acting} danger />
      )}
      {modal === 'reset-plan' && (
        <ConfirmModal title="Reset Content Plan?" body="This will remove all planned and generated content. This cannot be undone." confirmLabel="Reset Plan" onConfirm={handleResetContentPlan} onCancel={() => setModal(null)} acting={acting} danger />
      )}
      {modal === 'duplicate' && (
        <ConfirmModal title="Duplicate Project?" body={`This will create a copy of "${project.name}" with song details.`} confirmLabel="Duplicate" onConfirm={handleDuplicate} onCancel={() => setModal(null)} acting={acting} />
      )}
      {modal === 'archive' && (
        <ConfirmModal title="Archive Project?" body="This will hide the project from your main list." confirmLabel="Archive" onConfirm={handleArchive} onCancel={() => setModal(null)} acting={acting} />
      )}
      {modal === 'delete' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setModal(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '24px', width: '420px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Delete Project?</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-tertiary)' }}>This will permanently delete this project and all its data.</p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type project name to confirm</label>
              <input className="input" value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} placeholder={project.name} style={{ fontSize: '13px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="vp-btn" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={() => { setModal(null); setDeleteConfirmName('') }}>Cancel</button>
              <button className="btn-primary" style={{ fontSize: '12px', height: '28px', padding: '0 12px', background: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)', opacity: deleteConfirmName === project.name ? 1 : 0.4 }} onClick={handleDelete} disabled={deleteConfirmName !== project.name || acting}>
                {acting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
      <button className="vp-btn" style={{ fontSize: '10px', height: '24px', padding: '0 10px', flexShrink: 0 }} onClick={onClick} disabled={disabled}>{label.split(' ')[0]}</button>
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

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <p style={{ margin: '1px 0 0 0', fontSize: '12px', color: value ? 'var(--text-secondary)' : 'var(--text-faint)' }}>{value || 'Not set'}</p>
    </div>
  )
}

function StatusBadge({ label, color }: { label: string; color: 'green' | 'blue' | 'default' }) {
  const bg = color === 'green' ? 'rgba(74,222,128,0.1)' : color === 'blue' ? 'rgba(90,154,245,0.1)' : 'rgba(255,255,255,0.04)'
  const fg = color === 'green' ? '#4ade80' : color === 'blue' ? '#5a9af5' : 'var(--text-faint)'
  return <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: bg, color: fg, fontWeight: 600 }}>{label}</span>
}

function Divider() {
  return <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
}

function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel, acting, danger }: { title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; acting: boolean; danger?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '24px', width: '400px', maxWidth: '90vw' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-tertiary)' }}>{body}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="vp-btn" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={onCancel}>Cancel</button>
          <button className="btn-primary" style={{ fontSize: '12px', height: '28px', padding: '0 12px', ...(danger ? { background: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)' } : {}) }} onClick={onConfirm} disabled={acting}>
            {acting ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
