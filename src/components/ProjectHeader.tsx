'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const MODES = ['Music', 'Athlete'] as const

type Project = {
  id: string
  name: string
  mode: string | null
  type: string | null
  description: string | null
}

export default function ProjectHeader({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const [mode, setMode] = useState(project.mode || 'Music')
  const [description, setDescription] = useState(project.description || '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/update-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.id,
          name: name.trim(),
          mode,
          type: mode,
          description: description.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setOpen(false)
        router.refresh()
      }
    } catch (err) {
      console.error('Update error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="vp-project-header" style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px', flexShrink: 0 }}>
        <Link
          href="/projects"
          className="vp-btn"
          style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
        >
          ← Back
        </Link>
        <h1 className="page-title" style={{ margin: 0 }}>{project.name}</h1>
        <span style={{
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '4px',
          background: project.mode === 'Music' ? 'rgba(139,92,246,0.12)' : project.mode === 'Athlete' ? 'rgba(245,158,11,0.12)' : 'rgba(139,124,245,0.1)',
          color: project.mode === 'Music' ? '#a78bfa' : project.mode === 'Athlete' ? '#fbbf24' : '#b0a4f5',
          fontWeight: 600,
        }}>
          {project.mode || project.type || 'No mode'}
        </span>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.25)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
        >
          Edit
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f1724',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '20px',
              width: '400px',
              maxWidth: '90vw',
            }}
          >
            <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 600 }}>Edit Project</h3>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
              <input
                className="input"
                placeholder="Project Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  Mode
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: mode === m
                          ? '1px solid rgba(90,154,245,0.4)'
                          : '1px solid var(--border-default)',
                        background: mode === m
                          ? 'rgba(90,154,245,0.1)'
                          : 'rgba(255,255,255,0.03)',
                        color: mode === m ? '#f0f4fa' : 'rgba(255,255,255,0.5)',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textAlign: 'center',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="input"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ minHeight: '64px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="vp-btn"
                style={{ fontSize: '12px', height: '32px', padding: '0 12px' }}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: '12px', height: '32px', padding: '0 12px' }}
                onClick={handleSave}
                disabled={saving || !name.trim()}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
