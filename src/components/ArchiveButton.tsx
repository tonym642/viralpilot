'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ArchiveButton({
  projectId,
  archived = false,
}: {
  projectId: string
  archived?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)

    try {
      const res = await fetch('/api/archive-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, archived: !archived }),
      })
      const data = await res.json()
      if (data.success) {
        router.refresh()
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={archived ? 'Restore project' : 'Archive project'}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: loading ? 'wait' : 'pointer',
        padding: '2px 4px',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.2)',
        transition: 'color 0.12s',
        flexShrink: 0,
        lineHeight: 1,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = archived ? '#4ade80' : 'rgba(255,255,255,0.5)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
    >
      {archived ? '↩' : '⌫'}
    </button>
  )
}
