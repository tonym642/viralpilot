'use client'

import { useState } from 'react'

const DEFAULT_PILLARS = [
  'Highlights',
  'Training',
  'Game Day',
  'Lifestyle',
  'Motivation',
  'Education',
  'Story',
]

export default function AthletePillars({
  projectId,
  initialPillars,
  onSave,
}: {
  projectId: string
  initialPillars: string[] | null
  onSave?: (data: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>(initialPillars || [])
  const [customPillar, setCustomPillar] = useState('')
  const [customPillars, setCustomPillars] = useState<string[]>(() => {
    if (!initialPillars) return []
    return initialPillars.filter((p) => !DEFAULT_PILLARS.includes(p))
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const allPillars = [...DEFAULT_PILLARS, ...customPillars]

  const toggle = (pillar: string) => {
    setSaved(false)
    setSelected((prev) =>
      prev.includes(pillar) ? prev.filter((p) => p !== pillar) : [...prev, pillar]
    )
  }

  const addCustom = () => {
    const trimmed = customPillar.trim()
    if (!trimmed || allPillars.includes(trimmed)) return
    setCustomPillars((prev) => [...prev, trimmed])
    setSelected((prev) => [...prev, trimmed])
    setCustomPillar('')
    setSaved(false)
  }

  const startEdit = (index: number, value: string) => {
    setEditingIndex(index)
    setEditValue(value)
  }

  const saveEdit = (oldValue: string) => {
    const trimmed = editValue.trim()
    if (!trimmed || (trimmed !== oldValue && allPillars.includes(trimmed))) {
      setEditingIndex(null)
      return
    }
    setCustomPillars((prev) => prev.map((p) => (p === oldValue ? trimmed : p)))
    setSelected((prev) => prev.map((p) => (p === oldValue ? trimmed : p)))
    setEditingIndex(null)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/save-athlete-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, section: 'pillars', data: selected }),
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        onSave?.(selected)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch { /* */ }
    finally { setSaving(false) }
  }

  const PillarButton = ({ pillar }: { pillar: string }) => {
    const isSelected = selected.includes(pillar)
    return (
      <button
        onClick={() => toggle(pillar)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '8px',
          border: isSelected ? '1px solid rgba(90,154,245,0.4)' : '1px solid var(--border-default)',
          background: isSelected ? 'rgba(90,154,245,0.1)' : 'rgba(255,255,255,0.02)',
          color: isSelected ? '#f0f4fa' : 'var(--text-tertiary)',
          fontSize: '13px',
          fontFamily: 'inherit',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.12s',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span style={{
          width: '18px', height: '18px', borderRadius: '4px',
          border: isSelected ? '1px solid #5a9af5' : '1px solid rgba(255,255,255,0.15)',
          background: isSelected ? '#5a9af5' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', color: '#fff', flexShrink: 0,
        }}>
          {isSelected ? '✓' : ''}
        </span>
        {pillar}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Content Pillars
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Choose the types of content you will consistently create.
            <span style={{ marginLeft: '8px', color: selected.length >= 3 ? '#4ade80' : 'rgba(251,191,36,0.7)', fontWeight: 500 }}>
              {selected.length} selected {selected.length < 3 && '(minimum 3)'}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saved && <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 500 }}>Saved</span>}
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: '12px', height: '30px', padding: '0 14px' }}>
            {saving ? 'Saving...' : 'Save Pillars'}
          </button>
        </div>
      </div>

      <div style={{ padding: '8px 12px', marginBottom: '14px', borderRadius: '6px', background: 'rgba(90,154,245,0.04)', border: '1px solid rgba(90,154,245,0.1)', fontSize: '12px', color: 'rgba(90,154,245,0.7)', flexShrink: 0 }}>
        Stick to a few pillars so your content feels focused and recognizable.
      </div>

      {/* Two-column split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Left column — Default pillars */}
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minHeight: 0,
        }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            Default Pillars
          </h3>
          {DEFAULT_PILLARS.map((pillar) => (
            <PillarButton key={pillar} pillar={pillar} />
          ))}
        </div>

        {/* Right column — Custom pillars + Add */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
          {/* Custom pillars card */}
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
            minHeight: 0,
          }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Custom Pillars
            </h3>

            {customPillars.length === 0 && (
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-faint)', lineHeight: '1.5' }}>
                Add your own pillars below to customize your content strategy.
              </p>
            )}

            {customPillars.map((pillar, idx) => {
              const isEditing = editingIndex === idx
              return (
                <div key={pillar} style={{ display: 'flex', gap: '4px' }}>
                  {isEditing ? (
                    <input
                      className="input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(pillar)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(pillar) }}
                      autoFocus
                      style={{ fontSize: '13px', flex: 1 }}
                    />
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <PillarButton pillar={pillar} />
                      </div>
                      <button
                        onClick={() => startEdit(idx, pillar)}
                        className="vp-btn-ghost"
                        style={{ fontSize: '10px', padding: '0 6px', alignSelf: 'center' }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              )
            })}

            {/* Add custom input */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="input"
                  value={customPillar}
                  onChange={(e) => setCustomPillar(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustom() }}
                  placeholder="Add a custom pillar..."
                  style={{ fontSize: '13px', flex: 1 }}
                />
                <button className="vp-btn" onClick={addCustom} style={{ fontSize: '12px', height: '34px', padding: '0 12px' }}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
