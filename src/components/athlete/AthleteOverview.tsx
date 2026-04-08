'use client'

import type { AthleteStrategyData } from '@/src/lib/athleteStrategy'
import type { AthleteContentPlanObject, ContentPlanItem } from '@/src/lib/athleteContentPlan'

type Project = {
  id: string
  name: string
  mode: string | null
  description: string | null
}

type NavKey = 'overview' | 'profile' | 'brand' | 'pillars' | 'strategy' | 'content-plan' | 'library' | 'settings'

// Navigation label map for the dynamic button text
const NAV_LABELS: Record<string, string> = {
  profile: 'Go to Profile',
  brand: 'Go to Brand',
  pillars: 'Go to Pillars',
  strategy: 'Go to Strategy',
  'content-plan': 'Go to Content Plan',
  library: 'Go to Library',
}

export default function AthleteOverview({
  project,
  profile,
  brand,
  pillars,
  profileComplete,
  brandComplete,
  pillarsComplete,
  strategyGenerated,
  strategyApproved,
  strategyData,
  planGenerated,
  contentPlan,
  onNavigate,
  onNavigateToItem,
}: {
  project: Project
  profile: Record<string, string> | null
  brand: Record<string, string> | null
  pillars: string[] | null
  profileComplete: boolean
  brandComplete: boolean
  pillarsComplete: boolean
  strategyGenerated: boolean
  strategyApproved: boolean
  strategyData?: AthleteStrategyData | null
  planGenerated?: boolean
  contentPlan?: AthleteContentPlanObject | null
  onNavigate: (key: NavKey) => void
  onNavigateToItem?: (itemId: string) => void
}) {
  const items = (contentPlan?.items || []) as ContentPlanItem[]
  const generatedItems = items.filter((i) => !!i.generatedContent)
  const draftCount = items.filter((i) => i.status === 'draft').length
  const readyCount = items.filter((i) => i.status === 'ready').length
  const postedCount = items.filter((i) => i.status === 'posted').length

  // Progress — cap at "Setup Complete" once all milestones done, then show content progress separately
  const setupDone = profileComplete && brandComplete && pillarsComplete && strategyApproved && planGenerated
  const progressParts = [
    profileComplete ? 20 : 0,
    brandComplete ? 20 : 0,
    pillarsComplete ? 15 : 0,
    strategyGenerated ? 15 : 0,
    strategyApproved ? 10 : 0,
    planGenerated ? 10 : 0,
    generatedItems.length > 0 ? 10 : 0,
  ]
  const progressPercent = progressParts.reduce((a, b) => a + b, 0)

  // Next step with dynamic button label
  const nextStep = !profileComplete
    ? { title: 'Complete Athlete Profile', desc: 'Add your athlete info, goals, and social handles.', nav: 'profile' as NavKey }
    : !brandComplete
      ? { title: 'Complete Brand Identity', desc: 'Define your personality, brand vibe, and story.', nav: 'brand' as NavKey }
      : !pillarsComplete
        ? { title: 'Choose Content Pillars', desc: 'Select at least 3 content pillars for your strategy.', nav: 'pillars' as NavKey }
        : !strategyGenerated
          ? { title: 'Generate Strategy', desc: 'Create your personalized content strategy.', nav: 'strategy' as NavKey }
          : !strategyApproved
            ? { title: 'Approve Strategy', desc: 'Review and approve your strategy to unlock content planning.', nav: 'strategy' as NavKey }
            : !planGenerated
              ? { title: 'Generate Content Plan', desc: 'Create a structured content calendar.', nav: 'content-plan' as NavKey }
              : generatedItems.length === 0
                ? { title: 'Generate Your First Content', desc: 'Select a plan item and generate content for it.', nav: 'content-plan' as NavKey }
                : { title: 'Keep Building Your Content', desc: `${generatedItems.length} items generated, ${readyCount} ready, ${postedCount} posted.`, nav: 'library' as NavKey }

  // Last worked-on item (most recent updatedAt)
  const lastItem = generatedItems.length > 0
    ? [...generatedItems].sort((a, b) => (b.generatedContent?.updatedAt || '').localeCompare(a.generatedContent?.updatedAt || ''))[0]
    : null

  // Recent content (last 3)
  const recentContent = generatedItems.length > 0
    ? [...generatedItems].sort((a, b) => (b.generatedContent?.updatedAt || '').localeCompare(a.generatedContent?.updatedAt || '')).slice(0, 3)
    : []

  const goToItem = (item: ContentPlanItem) => {
    if (onNavigateToItem) {
      onNavigateToItem(item.id)
    } else {
      onNavigate('content-plan')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{project.name}</h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>{project.description || 'Track progress, review your strategy, and continue building content.'}</p>
      </div>

      {/* Progress + Next Step */}
      <div className="vp-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', flexShrink: 0 }}>
        {/* Progress */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <CardLabel>{setupDone ? 'System Complete' : 'Progress'}</CardLabel>
            <span style={{ fontSize: '12px', fontWeight: 600, color: setupDone ? '#4ade80' : 'var(--text-secondary)' }}>
              {setupDone ? 'Active' : `${progressPercent}%`}
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', marginBottom: '10px' }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, background: setupDone ? '#4ade80' : '#5a9af5', borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <MiniStatus label="Profile" done={profileComplete} />
            <MiniStatus label="Brand" done={brandComplete} />
            <MiniStatus label="Pillars" done={pillarsComplete} />
            <MiniStatus label="Strategy" done={strategyApproved} partial={strategyGenerated} />
            <MiniStatus label="Plan" done={!!planGenerated} />
            <MiniStatus label="Content" done={generatedItems.length > 0} />
          </div>
          {setupDone && generatedItems.length > 0 && (
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Content in progress — {generatedItems.length} generated, {readyCount} ready, {postedCount} posted
            </p>
          )}
        </Card>

        {/* Next Step — primary CTA */}
        <div
          onClick={() => onNavigate(nextStep.nav)}
          style={{
            background: 'var(--surface-2)', border: '1px solid rgba(90,154,245,0.25)', borderRadius: '10px',
            padding: '16px', cursor: 'pointer', transition: 'border-color 0.15s',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(90,154,245,0.45)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(90,154,245,0.25)' }}
        >
          <CardLabel>Next Step</CardLabel>
          <h3 style={{ margin: '4px 0 6px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{nextStep.title}</h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>{nextStep.desc}</p>
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: 600,
              color: '#fff', background: 'linear-gradient(180deg, #5a9af5 0%, #4a88e0 100%)',
              padding: '4px 12px', borderRadius: '5px',
            }}>
              {NAV_LABELS[nextStep.nav] || 'Continue'}
            </span>
          </div>
        </div>
      </div>

      {/* Continue Last Item — only if there's a last worked item */}
      {lastItem && (
        <div
          onClick={() => goToItem(lastItem)}
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px',
            padding: '12px 16px', marginBottom: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(90,154,245,0.25)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
        >
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', flexShrink: 0 }}>Continue</span>
          <span style={{ color: '#8b7cf5', fontWeight: 600, fontSize: '11px', flexShrink: 0 }}>Day {lastItem.day}</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastItem.title}</span>
          <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>{lastItem.platform}</span>
          <ItemStatusBadge status={lastItem.status} />
          <span style={{ fontSize: '11px', color: '#5a9af5', fontWeight: 500, flexShrink: 0 }}>Continue Editing →</span>
        </div>
      )}

      {/* Main grid */}
      <div className="vp-overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', flexShrink: 0 }}>
        {/* Athlete Snapshot — clickable */}
        <ClickableCard onClick={() => onNavigate('profile')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <CardLabel>Athlete Snapshot</CardLabel>
            <span className="vp-btn-ghost" style={{ fontSize: '10px' }}>Edit</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <SnapshotField label="Name" value={profile?.athlete_name} />
            <SnapshotField label="Sport" value={profile?.sport} />
            <SnapshotField label="Position" value={profile?.position} />
            <SnapshotField label="Team" value={profile?.school_team} />
            <SnapshotField label="Grad Year" value={profile?.graduation_year} />
            <SnapshotField label="Goal" value={profile?.primary_goal} />
          </div>
        </ClickableCard>

        {/* Strategy Snapshot — clickable */}
        <ClickableCard onClick={() => onNavigate('strategy')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <CardLabel>Strategy</CardLabel>
            {strategyApproved && <StatusBadge label="Approved" color="green" />}
            {strategyGenerated && !strategyApproved && <StatusBadge label="Generated" color="blue" />}
          </div>
          {strategyData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SnapshotField label="Goal" value={strategyData.primaryGoal} />
              <SnapshotField label="Audience" value={strategyData.targetAudience} />
              <SnapshotField label="Brand Angle" value={strategyData.coreBrandAngle} />
              {strategyData.pillarFocus.length > 0 && (
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Content Focus</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                    {strategyData.pillarFocus.slice(0, 5).map((p) => (
                      <span key={p} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-tertiary)', fontWeight: 500 }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                {strategyData.recommendedPlatforms.map((p) => (
                  <span key={p} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>{p}</span>
                ))}
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-faint)', fontWeight: 500 }}>{strategyData.postingCadence}</span>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-faint)' }}>No strategy generated yet.</p>
          )}
        </ClickableCard>

        {/* Content Plan Snapshot — clickable */}
        <ClickableCard onClick={() => onNavigate('content-plan')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <CardLabel>Content Plan</CardLabel>
            {planGenerated && <StatusBadge label="Generated" color="blue" />}
          </div>
          {planGenerated && contentPlan ? (
            <div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span>{contentPlan.durationDays}-day plan</span>
                <span>v{contentPlan.version}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <CountBadge label="Total" count={items.length} />
                <CountBadge label="Generated" count={generatedItems.length} color="green" />
                <CountBadge label="Draft" count={draftCount} />
                <CountBadge label="Ready" count={readyCount} color="blue" />
                <CountBadge label="Posted" count={postedCount} color="green" />
              </div>
              <span style={{ fontSize: '11px', color: '#5a9af5', fontWeight: 500 }}>
                {generatedItems.length > 0 ? 'Continue Plan →' : 'View Content Plan →'}
              </span>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-faint)' }}>No content plan generated yet.</p>
          )}
        </ClickableCard>

        {/* Quick Actions — split primary/secondary */}
        <Card>
          <CardLabel>Quick Actions</CardLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <QuickAction label="Content Plan" onClick={() => onNavigate('content-plan')} primary />
              <QuickAction label="Library" onClick={() => onNavigate('library')} primary />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <QuickAction label="Profile" onClick={() => onNavigate('profile')} />
              <QuickAction label="Brand" onClick={() => onNavigate('brand')} />
              <QuickAction label="Strategy" onClick={() => onNavigate('strategy')} />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Content — clickable rows */}
      {recentContent.length > 0 && (
        <div style={{ flexShrink: 0, marginBottom: '16px' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <CardLabel>Recent Content</CardLabel>
              <button className="vp-btn-ghost" style={{ fontSize: '10px' }} onClick={() => onNavigate('library')}>View All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentContent.map((item) => (
                <div
                  key={item.id}
                  onClick={() => goToItem(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ color: '#8b7cf5', fontWeight: 600, fontSize: '11px', minWidth: '36px' }}>Day {item.day}</span>
                  <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                  <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>{item.platform}</span>
                  <ItemStatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// --- Sub-components ---

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '16px' }}>
      {children}
    </div>
  )
}

function ClickableCard({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(90,154,245,0.2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
    >
      {children}
    </div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return <h3 style={{ margin: 0, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{children}</h3>
}

function MiniStatus({ label, done, partial }: { label: string; done: boolean; partial?: boolean }) {
  const bg = done ? 'rgba(74,222,128,0.1)' : partial ? 'rgba(90,154,245,0.1)' : 'rgba(255,255,255,0.04)'
  const fg = done ? '#4ade80' : partial ? '#5a9af5' : 'var(--text-faint)'
  return <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: bg, color: fg, fontWeight: 500 }}>{label}</span>
}

function SnapshotField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span style={{ fontSize: '9px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <p style={{ margin: '1px 0 0 0', fontSize: '12px', color: value ? 'var(--text-secondary)' : 'var(--text-faint)' }}>{value || 'Not set'}</p>
    </div>
  )
}

function StatusBadge({ label, color }: { label: string; color: 'green' | 'blue' }) {
  const bg = color === 'green' ? 'rgba(74,222,128,0.1)' : 'rgba(90,154,245,0.1)'
  const fg = color === 'green' ? '#4ade80' : '#5a9af5'
  return <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: bg, color: fg, fontWeight: 600 }}>{label}</span>
}

function CountBadge({ label, count, color }: { label: string; count: number; color?: 'green' | 'blue' }) {
  const fg = color === 'green' ? '#4ade80' : color === 'blue' ? '#7db4ff' : 'var(--text-tertiary)'
  return <span style={{ fontSize: '11px', color: fg }}>{label}: <strong>{count}</strong></span>
}

function ItemStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    draft: { bg: 'rgba(255,255,255,0.05)', fg: 'var(--text-faint)' },
    ready: { bg: 'rgba(90,154,245,0.1)', fg: '#7db4ff' },
    posted: { bg: 'rgba(74,222,128,0.1)', fg: '#4ade80' },
  }
  const s = map[status] || map.draft
  return <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', fontWeight: 600, textTransform: 'capitalize', background: s.bg, color: s.fg }}>{status}</span>
}

function QuickAction({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={primary ? 'btn-primary' : 'vp-btn'}
      style={{ fontSize: '11px', height: '30px', padding: '0 10px', width: '100%', justifyContent: 'center' }}
    >
      {label}
    </button>
  )
}
