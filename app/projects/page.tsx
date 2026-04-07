import Link from 'next/link'
import { supabase } from '@/src/lib/supabaseClient'
import ProjectAvatar from '@/src/components/ProjectAvatar'
import EqualizerIndicator from '@/src/components/EqualizerIndicator'

export default async function ProjectsPage() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch content counts per project
  const contentCounts: Record<string, number> = {}
  if (projects && projects.length > 0) {
    const { data: counts } = await supabase
      .from('content_items')
      .select('project_id')
    if (counts) {
      for (const row of counts) {
        contentCounts[row.project_id] = (contentCounts[row.project_id] || 0) + 1
      }
    }
  }

  const active = projects?.[0] ?? null

  return (
    <main className="vp-content">
      <h1 className="vp-greeting">Welcome back</h1>
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
                    <p className="vp-project-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {active.name}
                      {active.mode === 'Music' && contentCounts[active.id] > 0 && <EqualizerIndicator size={12} />}
                    </p>
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
      {projects && projects.length > 0 && (
        <div className="vp-card" style={{ marginBottom: '18px' }}>
          <div className="vp-card-header">
            <h3>All Projects</h3>
          </div>
          <div className="vp-card-body" style={{ padding: 0 }}>
            {/* Table header */}
            <div className="vp-table-header">
              <span className="vp-table-col vp-col-name">Name</span>
              <span className="vp-table-col vp-col-desc">Description</span>
              <span className="vp-table-col vp-col-items">Content</span>
              <span className="vp-table-col vp-col-date">Created</span>
              <span className="vp-table-col vp-col-type">Mode</span>
              <span className="vp-table-col vp-col-status">Status</span>
            </div>
            {/* Rows */}
            {projects.map((project) => {
              const count = contentCounts[project.id] ?? 0
              const created = new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="vp-table-row"
                >
                  <span className="vp-table-col vp-col-name">
                    <ProjectAvatar name={project.name} mode={project.mode} size={28} />
                    <span className="vp-table-name-text">{project.name}</span>
                    {project.mode === 'Music' && count > 0 && <EqualizerIndicator size={12} />}
                  </span>
                  <span className="vp-table-col vp-col-desc vp-table-desc-text">
                    {project.description || '—'}
                  </span>
                  <span className="vp-table-col vp-col-items">
                    <span className="vp-count-badge">{count}</span>
                  </span>
                  <span className="vp-table-col vp-col-date">{created}</span>
                  <span className="vp-table-col vp-col-type">
                    <span className="vp-plan-platform">{project.mode || project.type || 'N/A'}</span>
                  </span>
                  <span className="vp-table-col vp-col-status">
                    <span className={`vp-status-dot ${count > 0 ? 'active' : 'draft'}`} />
                    {count > 0 ? 'Active' : 'Draft'}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="vp-footer-actions">
        <Link href="/projects/new" className="vp-btn-primary">
          + New Project
        </Link>
        {active && (
          <Link href={`/projects/${active.id}`} className="vp-btn">
            Open Chat
          </Link>
        )}
      </div>
    </main>
  )
}
