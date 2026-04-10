import Link from 'next/link'
import { supabase } from '@/src/lib/supabaseClient'
import ProjectAvatar from '@/src/components/ProjectAvatar'
import EqualizerIndicator from '@/src/components/EqualizerIndicator'
import ArchiveButton from '@/src/components/ArchiveButton'
import HelpButton from '@/src/components/HelpModal'
import { helpContent } from '@/src/lib/helpContent'

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; mode?: string }>
}) {
  const params = await searchParams
  const showArchived = params.show === 'archived'
  const filterMode = params.mode || null

  const { data: allProjects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  // Split active and archived, then filter by mode
  const activeProjects = allProjects?.filter((p) => !p.archived) || []
  const archivedProjects = allProjects?.filter((p) => p.archived) || []
  const modeFiltered = filterMode
    ? (showArchived ? archivedProjects : activeProjects).filter((p) => p.mode === filterMode)
    : (showArchived ? archivedProjects : activeProjects)
  const projects = modeFiltered

  // Fetch content counts per project
  const contentCounts: Record<string, number> = {}
  // Fetch details (genre, language) per project from project_interviews
  const projectDetails: Record<string, { genre?: string; language?: string }> = {}
  if (allProjects && allProjects.length > 0) {
    const [{ data: counts }, { data: interviews }] = await Promise.all([
      supabase.from('content_items').select('project_id'),
      supabase.from('project_interviews').select('project_id, structured_strategy'),
    ])
    if (counts) {
      for (const row of counts) {
        contentCounts[row.project_id] = (contentCounts[row.project_id] || 0) + 1
      }
    }
    if (interviews) {
      for (const row of interviews) {
        const ss = row.structured_strategy as Record<string, unknown> | null
        const info = (ss?.project_details as Record<string, Record<string, string>> | null)?.info
        if (info) {
          projectDetails[row.project_id] = { genre: info.genre, language: info.language }
        }
      }
    }
  }

  const active = activeProjects[0] ?? null

  return (
    <main className="vp-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <h1 className="vp-greeting">{filterMode ? `${filterMode} Projects` : 'Welcome back'}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/projects/new" className="btn-primary" style={{ fontSize: '12px', height: '30px', padding: '0 14px' }}>
            + New Project
          </Link>
          <HelpButton pageKey="dashboard" content={helpContent.dashboard} />
        </div>
      </div>
      <p className="vp-subtext">Here&apos;s what&apos;s happening with your content strategy.</p>

      {error && <p style={{ color: '#ff6b6b', marginBottom: '12px', fontSize: '13px' }}>Error loading projects.</p>}

      <div className="vp-dashboard-grid">
        {/* ── Active Project ── */}
        <div className="vp-card">
          <div className="vp-card-header">
            <h3>Active Project</h3>
          </div>
          <div className="vp-card-body">
            {active ? (
              <>
                <div className="vp-project-row">
                  <ProjectAvatar name={active.name} mode={active.mode} size={32} />
                  <div className="vp-project-info">
                    <div className="vp-project-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {active.name}
                      {active.mode === 'Music' && contentCounts[active.id] > 0 && <EqualizerIndicator size={12} />}
                    </div>
                    <p className="vp-project-sub">{active.mode || active.type || 'No mode'}</p>
                  </div>
                </div>
                <div style={{ marginTop: '14px' }}>
                  <Link href={`/projects/${active.id}`} className="vp-btn-primary">
                    Continue ▶
                  </Link>
                </div>
              </>
            ) : (
              <p className="muted" style={{ fontSize: '13px' }}>No projects yet.</p>
            )}
          </div>
        </div>

        {/* ── Today's Tasks ── */}
        <div className="vp-card">
          <div className="vp-card-header">
            <h3>Today&apos;s Tasks</h3>
          </div>
          <div className="vp-card-body">
            <ul className="vp-task-list">
              <li className="vp-task-item">
                <div className="vp-task-check" />
                <span className="vp-task-label">Generate content</span>
                <span className="vp-task-badge">Day 4</span>
              </li>
              <li className="vp-task-item">
                <div className="vp-task-check" />
                <span className="vp-task-label">Post Reel</span>
                <span className="vp-task-badge">Day 3</span>
              </li>
              <li className="vp-task-item">
                <div className="vp-task-check" />
                <span className="vp-task-label">Review hooks</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Upcoming Plan ── */}
        <div className="vp-card">
          <div className="vp-card-header">
            <h3>Upcoming Plan</h3>
          </div>
          <div className="vp-card-body">
            <ul className="vp-plan-list">
              <li className="vp-plan-item">
                <span className="vp-plan-day">Day 5</span>
                <span className="vp-plan-desc">Emotional clip</span>
                <span className="vp-plan-platform">TikTok</span>
              </li>
              <li className="vp-plan-item">
                <span className="vp-plan-day">Day 6</span>
                <span className="vp-plan-desc">Storytelling</span>
                <span className="vp-plan-platform">IG Reel</span>
              </li>
              <li className="vp-plan-item">
                <span className="vp-plan-day">Day 7</span>
                <span className="vp-plan-desc">Hook test</span>
                <span className="vp-plan-platform">Shorts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── All Projects ── */}
      {projects.length > 0 && (
        <div className="vp-card" style={{ marginBottom: '18px' }}>
          <div className="vp-card-header">
            <h3>{showArchived ? 'Archived Projects' : filterMode ? `${filterMode} Projects` : 'All Projects'}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {showArchived ? (
                <Link href="/projects" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none' }}>
                  ← Back to Active
                </Link>
              ) : archivedProjects.length > 0 ? (
                <Link href="/projects?show=archived" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.42)', textDecoration: 'none' }}>
                  Archived ({archivedProjects.length})
                </Link>
              ) : null}
            </div>
          </div>
          <div className="vp-card-body" style={{ padding: 0 }}>
            {/* Table header */}
            <div className="vp-table-header">
              <span className="vp-table-col vp-col-name">Name</span>
              <span className="vp-table-col vp-col-genre">Genre</span>
              <span className="vp-table-col vp-col-lang">Language</span>
              <span className="vp-table-col vp-col-items">Content</span>
              <span className="vp-table-col vp-col-date">Created</span>
              <span className="vp-table-col vp-col-type">Mode</span>
              <span className="vp-table-col vp-col-status">Status</span>
              <span className="vp-table-col" style={{ flex: '0 0 32px' }}>{showArchived ? '' : 'Archive'}</span>
            </div>
            {/* Rows */}
            {projects.map((project) => {
              const count = contentCounts[project.id] ?? 0
              const details = projectDetails[project.id]
              const created = new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="vp-table-row"
                  style={showArchived ? { opacity: 0.6 } : undefined}
                >
                  <span className="vp-table-col vp-col-name">
                    <ProjectAvatar name={project.name} mode={project.mode} size={28} />
                    <span className="vp-table-name-text">{project.name}</span>
                    {project.mode === 'Music' && count > 0 && !showArchived && <EqualizerIndicator size={12} />}
                  </span>
                  <span className="vp-table-col vp-col-genre vp-table-desc-text">
                    {details?.genre || '—'}
                  </span>
                  <span className="vp-table-col vp-col-lang vp-table-desc-text">
                    {details?.language || '—'}
                  </span>
                  <span className="vp-table-col vp-col-items">
                    <span className="vp-count-badge">{count}</span>
                  </span>
                  <span className="vp-table-col vp-col-date">{created}</span>
                  <span className="vp-table-col vp-col-type">
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      background: project.mode === 'Music' ? 'rgba(139,92,246,0.12)' : project.mode === 'Athlete' ? 'rgba(245,158,11,0.12)' : 'rgba(139,124,245,0.08)',
                      color: project.mode === 'Music' ? '#a78bfa' : project.mode === 'Athlete' ? '#fbbf24' : '#a99cf0',
                    }}>{project.mode || project.type || 'N/A'}</span>
                  </span>
                  <span className="vp-table-col vp-col-status">
                    <span className={`vp-status-dot ${count > 0 ? 'active' : 'draft'}`} />
                    {count > 0 ? 'Active' : 'Draft'}
                  </span>
                  <span className="vp-table-col" style={{ flex: '0 0 32px', justifyContent: 'center' }}>
                    <ArchiveButton projectId={project.id} archived={!!project.archived} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Show empty archived state */}
      {showArchived && projects.length === 0 && (
        <div className="vp-card" style={{ marginBottom: '18px' }}>
          <div className="vp-card-body" style={{ textAlign: 'center', padding: '30px' }}>
            <p className="muted" style={{ margin: '0 0 8px 0', fontSize: '13px' }}>No archived projects</p>
            <Link href="/projects" style={{ fontSize: '12px' }}>← Back to Active</Link>
          </div>
        </div>
      )}
    </main>
  )
}
