'use client'

import { useState } from 'react'
import { supabase } from '@/src/lib/supabaseClient'
import { useRouter } from 'next/navigation'

const MODES = ['Music', 'Athlete'] as const

export default function NewProjectPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [mode, setMode] = useState<string>('Music')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name) return alert('Name is required')

    setLoading(true)

    const { data, error } = await supabase.from('projects').insert([
      {
        name,
        mode,
        type: mode,
        description,
      },
    ]).select().single()

    setLoading(false)

    if (error || !data) {
      alert('Error creating project')
      console.error(error)
      return
    }

    router.push(`/projects/${data.id}`)
  }

  return (
    <main className="page-shell" style={{ maxWidth: '460px' }}>
      <h1 className="page-title" style={{ marginBottom: '18px' }}>
        Create Project
      </h1>

      <div className="card" style={{ display: 'grid', gap: '10px' }}>
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
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: mode === m
                    ? '1px solid rgba(90,154,245,0.4)'
                    : '1px solid rgba(255,255,255,0.06)',
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
          style={{ minHeight: '72px', resize: 'vertical' }}
        />

        <button
          className="btn-primary"
          onClick={handleCreate}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </main>
  )
}
