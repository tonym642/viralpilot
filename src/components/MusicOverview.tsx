'use client'

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

type TabKey = 'overview' | 'strategy' | 'plan' | 'assets' | 'chat' | 'library'

export default function MusicOverview({
  project,
  interviewData,
  interviewCompleted,
  strategyStatus,
  plans,
  contentItems,
  onNavigate,
}: {
  project: Project
  interviewData: Record<string, unknown> | null
  interviewCompleted: boolean
  strategyStatus: string | null
  plans: Plan[]
  contentItems: ContentItem[]
  onNavigate: (key: TabKey) => void
}) {
  const hasLyrics = !!(project.lyrics_text?.trim())
  const hasSongStyle = !!(project.song_style?.trim())
  const hasGoal = !!(interviewData?.goal)
  const hasAudience = !!(interviewData?.audience)
  const hasTone = !!(interviewData?.tone)
  const hasContentStyle = !!(interviewData?.content_style)
  const hasCta = !!(interviewData?.cta)

  const songDetailsComplete = hasLyrics && hasSongStyle
  const strategyFieldsComplete = hasGoal && hasAudience && hasTone && hasContentStyle && hasCta
  const strategyGenerated = strategyStatus === 'audited' || strategyStatus === 'approved'
  const strategyApproved = strategyStatus === 'approved'
  const hasPlan = plans.length > 0
  const hasContent = contentItems.length > 0

  const draftCount = contentItems.filter((i) => i.status === 'draft').length
  const readyCount = contentItems.filter((i) => i.status === 'ready').length
  const postedCount = contentItems.filter((i) => i.status === 'posted').length

  // Progress
  const progressParts = [
    songDetailsComplete ? 20 : 0,
    interviewCompleted ? 20 : 0,
    strategyGenerated ? 15 : 0,
    strategyApproved ? 15 : 0,
    hasPlan ? 15 : 0,
    hasContent ? 15 : 0,
  ]
  const progressPercent = progressParts.reduce((a, b) => a + b, 0)
  const setupDone = songDetailsComplete && interviewCompleted && strategyApproved && hasPlan && hasContent

  // Next step
  const nextStep = !interviewCompleted
    ? { title: 'Complete Strategy Interview', desc: 'Answer questions to build your content strategy.', nav: 'strategy' as TabKey, label: 'Go to Strategy' }
    : !songDetailsComplete
      ? { title: 'Add Song Details', desc: 'Add your lyrics and song style for better content.', nav: 'assets' as TabKey, label: 'Go to Assets' }
      : !strategyGenerated
        ? { title: 'Run Strategy Audit', desc: 'Generate AI insights from your strategy.', nav: 'strategy' as TabKey, label: 'Go to Strategy' }
        : !strategyApproved
          ? { title: 'Approve Strategy', desc: 'Review and approve your strategy to unlock content planning.', nav: 'strategy' as TabKey, label: 'Go to Strategy' }
          : !hasPlan
            ? { title: 'Generate Content Plan', desc: 'Create your 30-day content calendar.', nav: 'plan' as TabKey, label: 'Go to Content Plan' }
            : !hasContent
              ? { title: 'Generate Your First Content', desc: 'Select a plan item and generate content.', nav: 'plan' as TabKey, label: 'Go to Content Plan' }
              : { title: 'Keep Building Content', desc: `${contentItems.length} items generated. Keep going!`, nav: 'library' as TabKey, label: 'Go to Library' }

  // Recent content (last 3)
  const recentContent = [...contentItems]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{project.name}</h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>{project.description || 'Music project'}</p>
      </div>

      {/* Progress + Next Step */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', flexShrink: 0 }}>
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
            <MiniStatus label="Interview" done={interviewCompleted} />
            <MiniStatus label="Song Details" done={songDetailsComplete} />
            <MiniStatus label="Strategy" done={strategyApproved} partial={strategyGenerated} />
            <MiniStatus label="Plan" done={hasPlan} />
            <MiniStatus label="Content" done={hasContent} />
          </div>
          {setupDone && (
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--text-tertiary)' }}>
              Content in progress — {contentItems.length} generated, {readyCount} ready, {postedCount} posted
            </p>
          )}
        </Card>

        {/* Next Step */}
        <ClickableCard onClick={() => onNavigate(nextStep.nav)} accent>
          <CardLabel>Next Step</CardLabel>
          <h3 style={{ margin: '4px 0 6px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{nextStep.title}</h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>{nextStep.desc}</p>
          <span style={{
            display: 'inline-flex', fontSize: '11px', fontWeight: 600, color: '#fff',
            background: 'linear-gradient(180deg, #5a9af5 0%, #4a88e0 100%)',
            padding: '4px 12px', borderRadius: '5px',
          }}>
            {nextStep.label}
          </span>
        </ClickableCard>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', flexShrink: 0 }}>
        {/* Song Snapshot */}
        <ClickableCard onClick={() => onNavigate('assets')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <CardLabel>Song Snapshot</CardLabel>
            <span className="vp-btn-ghost" style={{ fontSize: '10px' }}>Edit</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <SnapshotField label="Song Title" value={project.name} />
            <SnapshotField label="Description" value={project.description} />
            <SnapshotField label="Song Style" value={project.song_style} />
            <SnapshotField label="Lyrics" value={hasLyrics ? 'Added' : null} />
            <SnapshotField label="Goal" value={interviewData?.goal as string} />
            <SnapshotField label="Platform" value={interviewData?.platform_focus as string} />
          </div>
        </ClickableCard>

        {/* Strategy Snapshot */}
        <ClickableCard onClick={() => onNavigate('strategy')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <CardLabel>Strategy</CardLabel>
            {strategyApproved && <StatusBadge label="Approved" color="green" />}
            {strategyGenerated && !strategyApproved && <StatusBadge label="Audited" color="blue" />}
          </div>
          {interviewCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SnapshotField label="Audience" value={interviewData?.audience as string} />
              <SnapshotField label="Tone" value={interviewData?.tone as string} />
              <SnapshotField label="Content Style" value={interviewData?.content_style as string} />
              <SnapshotField label="CTA" value={interviewData?.cta as string} />
              {(interviewData?.platform_focus as string) && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>{interviewData?.platform_focus as string}</span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-faint)' }}>Complete the strategy interview first.</p>
          )}
        </ClickableCard>

        {/* Content Plan Snapshot */}
        <ClickableCard onClick={() => onNavigate('plan')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <CardLabel>Content Plan</CardLabel>
            {hasPlan && <StatusBadge label="Generated" color="blue" />}
          </div>
          {hasPlan ? (
            <div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span>{plans.length}-day plan</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <CountBadge label="Total" count={plans.length} />
                <CountBadge label="Generated" count={contentItems.length} color="green" />
                <CountBadge label="Draft" count={draftCount} />
                <CountBadge label="Ready" count={readyCount} color="blue" />
                <CountBadge label="Posted" count={postedCount} color="green" />
              </div>
              <span style={{ fontSize: '11px', color: '#5a9af5', fontWeight: 500 }}>
                {hasContent ? 'Continue Plan →' : 'View Content Plan →'}
              </span>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-faint)' }}>No content plan generated yet.</p>
          )}
        </ClickableCard>

        {/* Quick Actions */}
        <Card>
          <CardLabel>Quick Actions</CardLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <QuickAction label="Content Plan" onClick={() => onNavigate('plan')} primary />
              <QuickAction label="Library" onClick={() => onNavigate('library')} primary />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <QuickAction label="Strategy" onClick={() => onNavigate('strategy')} />
              <QuickAction label="Assets" onClick={() => onNavigate('assets')} />
              <QuickAction label="AI Chat" onClick={() => onNavigate('chat')} />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Content */}
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
                  onClick={() => onNavigate('plan')}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.1s' }}
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
  return <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '16px' }}>{children}</div>
}

function ClickableCard({ children, onClick, accent }: { children: React.ReactNode; onClick: () => void; accent?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--surface-2)', border: `1px solid ${accent ? 'rgba(90,154,245,0.25)' : 'var(--border-default)'}`, borderRadius: '10px', padding: '16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(90,154,245,0.3)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = accent ? 'rgba(90,154,245,0.25)' : 'var(--border-default)' }}
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
    <button onClick={onClick} className={primary ? 'btn-primary' : 'vp-btn'} style={{ fontSize: '11px', height: '30px', padding: '0 10px', width: '100%', justifyContent: 'center' }}>
      {label}
    </button>
  )
}
