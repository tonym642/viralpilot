'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GeneratePlanButton({
  projectId,
  projectName,
  projectType,
  description,
  hasExistingPlan = false,
}: {
  projectId: string
  projectName: string
  projectType: string
  description: string
  hasExistingPlan?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    setShowConfirm(false)
    setLoading(true)

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectName,
          projectType,
          description,
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.refresh()
      } else {
        console.error('Generate plan error:', data.error)
        alert('Failed to generate plan. Try again.')
      }
    } catch (err) {
      console.error('Generate plan error:', err)
      alert('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (hasExistingPlan) {
      setShowConfirm(true)
    } else {
      handleGenerate()
    }
  }

  return (
    <>
      <button
        className="btn-primary"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Plan'}
      </button>

      {showConfirm && (
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
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f1724',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '20px',
              width: '360px',
              maxWidth: '90vw',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>
              Generate a new plan?
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.45)' }}>
              This will replace your current 30-day content plan. Saved content in your Library will not be deleted.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="vp-btn"
                style={{ fontSize: '12px', height: '32px', padding: '0 12px' }}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: '12px', height: '32px', padding: '0 12px' }}
                onClick={handleGenerate}
              >
                Generate New Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
