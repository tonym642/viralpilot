'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Project = {
  id: string
  name: string
  type: string | null
  description: string | null
}

export default function ProjectHeader({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const [type, setType] = useState(project.type || '')
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
          type: type.trim(),
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px', flexShrink: 0 }}>
        <Link
          href="/projects"
          className="vp-btn"
          style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
        >
          ← Back
        </Link>
        <h1 className="page-title" style={{ margin: 0 }}>{project.name}</h1>
        <span className="muted" style={{ fontSize: '13px' }}>{project.type || 'No type'}</span>
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
              <input
                className="input"
                placeholder="Type (music, business, etc)"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
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
