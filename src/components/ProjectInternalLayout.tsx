'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import WorkflowProgressBar from './WorkflowProgress'
import type { WorkflowCompletion } from '@/src/lib/workflowConfig'

type Project = {
  id: string
  name: string
  mode: string | null
  type: string | null
}

const WORKFLOW_NAV = [
  { label: 'Details',    href: 'details',    description: 'Song information, questionnaire, and lyrics' },
  { label: 'Track Analysis', href: 'transcript', description: 'Upload your song and generate an analysis' },
  { label: 'Strategy',   href: 'strategy',   description: 'Build and refine your content strategy with AI' },
  { label: 'Content',    href: 'content',    description: 'Plan and generate content for your campaign' },
  { label: 'Scheduler',  href: 'scheduler',  description: 'Schedule and publish your content' },
  { label: 'Library',    href: 'library',    description: 'All your generated content in one place' },
]

export default function ProjectInternalLayout({
  project,
  genre,
  language,
  completion,
  children,
}: {
  project: Project
  genre?: string
  language?: string
  completion?: WorkflowCompletion
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const basePath = `/projects/${project.id}`

  // Hide main app sidebar/topbar while inside a project
  useEffect(() => {
    document.body.classList.add('vp-in-project')
    return () => { document.body.classList.remove('vp-in-project') }
  }, [])

  // Determine active secondary nav item
  const activeNav = WORKFLOW_NAV.find(
    (item) => pathname === `${basePath}/${item.href}`,
  ) ?? null
  const activeHref = activeNav?.href ?? null

  const isMusicMode = project.mode === 'Music'
  const isDashboard = pathname === basePath
  const navDescription = activeNav?.description ?? (isDashboard ? 'Your Content Workflow' : null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--surface-0)' }}>
      {/* ── Top bar ── */}
      <div
        className="vp-project-topbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 24px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
          aria-label="Open sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Project name + meta */}
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
          {project.name}
        </h1>
        {genre && (
          <>
            <span className="vp-project-meta-divider" style={{ color: 'var(--border-default)', fontSize: '16px', fontWeight: 300 }}>|</span>
            <span className="vp-project-meta-text" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)', flexShrink: 0 }}>{genre}</span>
          </>
        )}
        {language && (
          <>
            <span className="vp-project-meta-divider" style={{ color: 'var(--border-default)', fontSize: '16px', fontWeight: 300 }}>|</span>
            <span className="vp-project-meta-text" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-tertiary)', flexShrink: 0 }}>{language}</span>
          </>
        )}
        <span
          style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: project.mode === 'Music' ? 'rgba(139,92,246,0.12)' : project.mode === 'Athlete' ? 'rgba(245,158,11,0.12)' : 'rgba(139,124,245,0.1)',
            color: project.mode === 'Music' ? '#a78bfa' : project.mode === 'Athlete' ? '#fbbf24' : '#b0a4f5',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {project.mode || project.type || 'No mode'}
        </span>

        <span style={{ flex: 1 }} />

        {/* Exit */}
        <Link
          href="/projects"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            padding: '4px 8px',
            borderRadius: '4px',
            textDecoration: 'none',
            transition: 'color 0.15s',
            flexShrink: 0,
          }}
        >
          Exit
        </Link>
      </div>

      {/* ── Secondary workflow nav (Music mode only, hidden on dashboard) ── */}
      {isMusicMode && !isDashboard && (
        <div
          className="vp-tab-bar vp-project-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 24px 0',
            flexShrink: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {/* Dashboard link */}
          <Link
            href={basePath}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: isDashboard ? 600 : 400,
              color: isDashboard ? '#eef1f6' : 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              borderBottom: isDashboard ? '2px solid #5a9af5' : '2px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
              marginBottom: '-1px',
            }}
          >
            Dashboard
          </Link>
          {WORKFLOW_NAV.map((item) => {
            const isActive = item.href === activeHref
            return (
              <Link
                key={item.href}
                href={`${basePath}/${item.href}`}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#eef1f6' : 'rgba(255,255,255,0.55)',
                  textDecoration: 'none',
                  borderBottom: isActive ? '2px solid #5a9af5' : '2px solid transparent',
                  transition: 'color 0.15s, border-color 0.15s',
                  whiteSpace: 'nowrap',
                  marginBottom: '-1px',
                }}
              >
                {item.label}
              </Link>
            )
          })}

          {/* Progress stepper */}
          <span style={{ flex: 1 }} />
          <div className="vp-workflow-progress">{completion && <WorkflowProgressBar completion={completion} />}</div>
        </div>
      )}

      {/* ── Page content ── */}
      <div className="vp-project-content" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '32px 24px 24px' }}>
        {children}
      </div>

      {/* ── Sidebar overlay ── */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar drawer ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '200px',
          background: 'var(--surface-1)',
          borderRight: '1px solid var(--border-subtle)',
          zIndex: 201,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        }}
      >
        <Link href="/projects" onClick={() => setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '16px 18px 12px', textDecoration: 'none' }}>
          <img src="/logo-light.png" alt="ViralPilot" style={{ height: '44px', width: 'auto' }} />
        </Link>
        <ul className="vp-sidebar-nav">
          <li>
            <Link href="/projects" onClick={() => setSidebarOpen(false)}>
              <span className="vp-sidebar-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </span>
              All
            </Link>
          </li>
          <li>
            <Link href="/projects?mode=Music" onClick={() => setSidebarOpen(false)}>
              <span className="vp-sidebar-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
              </span>
              Music
            </Link>
          </li>
          <li>
            <Link href="/projects?mode=Athlete" onClick={() => setSidebarOpen(false)}>
              <span className="vp-sidebar-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3" /><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.23A2 2 0 0 0 4 21h16a2 2 0 0 0 1.9-2.77l-2.49-8.77A2 2 0 0 0 17.5 8z" /><path d="m12 10 0 4" /><path d="m9 21 3-7 3 7" /></svg>
              </span>
              Athletes
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

