import Link from 'next/link'
import { supabase } from '@/src/lib/supabaseClient'

export default async function ProjectsPage() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

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
                  <div className="vp-project-icon">
                    {active.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="vp-project-info">
                    <p className="vp-project-title">{active.name}</p>
                    <p className="vp-project-sub">{active.type || 'No type'}</p>
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
          <div className="vp-card-body" style={{ display: 'grid', gap: '6px' }}>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="vp-plan-item" style={{ cursor: 'pointer' }}>
                  <div className="vp-project-icon" style={{ width: '28px', height: '28px', borderRadius: '7px', fontSize: '12px' }}>
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="vp-plan-desc" style={{ fontWeight: 500, color: '#f0f4fa' }}>
                    {project.name}
                  </span>
                  <span className="vp-plan-platform">
                    {project.type || 'N/A'}
                  </span>
                </div>
              </Link>
            ))}
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
