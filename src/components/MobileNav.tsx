'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar */}
      <div className="vp-mobile-topbar">
        <button className="vp-hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link href="/projects">
          <img src="/logo-light.png" alt="ViralPilot" style={{ height: '28px', width: 'auto' }} />
        </Link>
        <div style={{ width: '20px' }} />
      </div>

      {/* Overlay */}
      {open && (
        <div className="vp-mobile-nav-overlay open" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <div className={`vp-mobile-nav-drawer ${open ? 'open' : ''}`}>
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
          <Link href="/projects" onClick={() => setOpen(false)}>
            <img src="/logo-light.png" alt="ViralPilot" style={{ height: '32px', width: 'auto' }} />
          </Link>
        </div>
        <ul className="vp-sidebar-nav">
          <li>
            <Link href="/projects" onClick={() => setOpen(false)}>
              <span className="vp-sidebar-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              </span>
              All
            </Link>
          </li>
          <li>
            <Link href="/projects?mode=Music" onClick={() => setOpen(false)}>
              <span className="vp-sidebar-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
              </span>
              Music
            </Link>
          </li>
          <li>
            <Link href="/projects?mode=Athlete" onClick={() => setOpen(false)}>
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
