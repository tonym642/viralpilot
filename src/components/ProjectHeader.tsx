'use client'

import { useState } from 'react'
import Link from 'next/link'

type Project = {
  id: string
  name: string
  mode: string | null
  type: string | null
  description: string | null
}

export default function ProjectHeader({
  project,
  onNavigate,
}: {
  project: Project
  onNavigate?: (tab: string) => void
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {/* Header row */}
      <div
        className="vp-project-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          flexShrink: 0,
        }}
      >
        {/* Hamburger — opens main sidebar */}
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

        {/* Project name + mode pill */}
        <h1 className="page-title" style={{ margin: 0 }}>{project.name}</h1>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '4px',
            background:
              project.mode === 'Music'
                ? 'rgba(139,92,246,0.12)'
                : project.mode === 'Athlete'
                  ? 'rgba(245,158,11,0.12)'
                  : 'rgba(139,124,245,0.1)',
            color:
              project.mode === 'Music'
                ? '#a78bfa'
                : project.mode === 'Athlete'
                  ? '#fbbf24'
                  : '#b0a4f5',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {project.mode || project.type || 'No mode'}
        </span>

        <span style={{ flex: 1 }} />

        {/* Dashboard | Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={() => onNavigate?.('overview')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'inherit',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            Dashboard
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>|</span>
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
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            Exit
          </Link>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main sidebar drawer */}
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
        {/* Brand */}
        <Link
          href="/projects"
          onClick={() => setSidebarOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '16px 18px 12px', textDecoration: 'none' }}
        >
          <img src="/logo-light.png" alt="ViralPilot" style={{ height: '44px', width: 'auto' }} />
        </Link>

        {/* Nav */}
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
    </>
  )
}
