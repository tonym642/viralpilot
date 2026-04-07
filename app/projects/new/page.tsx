'use client'

import { useState } from 'react'
import { supabase } from '@/src/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name) return alert('Name is required')

    setLoading(true)

    const { error } = await supabase.from('projects').insert([
      {
        name,
        type,
        description,
      },
    ])

    setLoading(false)

    if (error) {
      alert('Error creating project')
      console.error(error)
      return
    }

    router.push('/projects')
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
