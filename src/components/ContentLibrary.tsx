'use client'

import { useState } from 'react'

type ContentItem = {
  id: string
  project_id: string
  day: number
  title: string
  platform: string
  hook: string | null
  script: string | null
  caption: string | null
  hashtags: string | null
  visual_direction: string | null
  status: string
  created_at: string
}

const detailSections: { label: string; key: keyof ContentItem }[] = [
  { label: 'Hook', key: 'hook' },
  { label: 'Script', key: 'script' },
  { label: 'Caption', key: 'caption' },
  { label: 'Hashtags', key: 'hashtags' },
  { label: 'Visual Direction', key: 'visual_direction' },
]

const PLATFORM_FILTERS = ['All', 'TikTok', 'Instagram', 'YouTube Shorts', 'Facebook'] as const

export default function ContentLibrary({
  initialItems,
}: {
  initialItems: ContentItem[]
}) {
  const [items, setItems] = useState<ContentItem[]>(initialItems)
  const [platformFilter, setPlatformFilter] = useState('All')
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = platformFilter === 'All'
    ? items
    : items.filter((i) => i.platform.toLowerCase() === platformFilter.toLowerCase())

  const selected = items.find((i) => i.id === selectedId) || null

  // -- Actions --

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/content-items/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setItems((prev) => prev.filter((item) => item.id !== id))
        if (selectedId === id) setSelectedId(null)
        setEditing(false)
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
      setConfirmDeleteId(null)
    }
  }

  const startEdit = () => {
    if (!selected) return
    setEditForm({
      title: selected.title || '',
      platform: selected.platform || '',
      hook: selected.hook || '',
      script: selected.script || '',
      caption: selected.caption || '',
      hashtags: selected.hashtags || '',
      visual_direction: selected.visual_direction || '',
    })
    setEditing(true)
  }

  const cancelEdit = () => { setEditing(false); setEditForm({}) }

  const saveEdit = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/content-items/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (data.success && data.item) {
        setItems((prev) => prev.map((item) => (item.id === selected.id ? data.item : item)))
        setEditing(false)
        setEditForm({})
      }
    } catch (err) {
      console.error('Save edit error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/content-items/${selected.id}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (data.success && data.item) {
        setItems((prev) => [...prev, data.item])
        setSelectedId(data.item.id)
      }
    } catch (err) {
      console.error('Duplicate error:', err)
    }
  }

  const handleCopy = (label: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Platform filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexShrink: 0, flexWrap: 'wrap' }}>
        {PLATFORM_FILTERS.map((pf) => (
          <button
            key={pf}
            onClick={() => setPlatformFilter(pf)}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: 'inherit',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: platformFilter === pf ? 'rgba(90,154,245,0.4)' : 'rgba(255,255,255,0.08)',
              background: platformFilter === pf ? 'rgba(90,154,245,0.15)' : 'transparent',
              color: platformFilter === pf ? '#7db4ff' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {pf}
          </button>
        ))}
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '4px' }}>
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Split view */}
      <div className="vp-split-layout" style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Left: list */}
        <div
          className="vp-split-left"
          style={{
            width: '40%',
            flexShrink: 0,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No content items</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedId === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => { setSelectedId(item.id); setEditing(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                    background: isSelected ? 'rgba(90,154,245,0.1)' : 'transparent',
                    borderLeft: isSelected ? '2px solid #5a9af5' : '2px solid transparent',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ color: '#8b7cf5', fontWeight: 600, fontSize: '11px', minWidth: '36px', flexShrink: 0 }}>
                    Day {item.day}
                  </span>
                  <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? '#f0f4fa' : 'rgba(255,255,255,0.6)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500, flexShrink: 0 }}>
                    {item.platform}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Right: detail */}
        <div
          className="vp-split-right"
          style={{
            flex: 1,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {selected ? (
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '18px 20px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ color: '#8b7cf5', fontWeight: 700, fontSize: '11px' }}>Day {selected.day}</span>
                {!editing && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>
                    {selected.platform}
                  </span>
                )}
                {!editing && (
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f0f4fa' }}>
                    {selected.title}
                  </h3>
                )}
                <span style={{ flex: 1 }} />
                {!editing && (
                  <>
                    <ActionBtn label="Edit" onClick={startEdit} />
                    <ActionBtn label="Duplicate" onClick={handleDuplicate} />
                    <ActionBtn label="Delete" onClick={() => setConfirmDeleteId(selected.id)} danger />
                  </>
                )}
                {editing && (
                  <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                    <input className="input" placeholder="Title" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} style={{ flex: 1 }} />
                    <input className="input" placeholder="Platform" value={editForm.platform} onChange={(e) => setEditForm((f) => ({ ...f, platform: e.target.value }))} style={{ width: '120px' }} />
                    <button className="vp-btn" style={{ fontSize: '11px', height: '34px', padding: '0 10px' }} onClick={cancelEdit}>Cancel</button>
                    <button className="btn-primary" style={{ fontSize: '11px', height: '34px', padding: '0 10px' }} onClick={saveEdit} disabled={saving}>
                      {saving ? '...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }} />

              {/* Content sections — label left, content right */}
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {detailSections.map((section) => {
                    const fieldKey = section.key as string
                    return (
                      <div key={fieldKey} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <label style={{ width: '130px', flexShrink: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: '8px' }}>
                          {section.label}
                        </label>
                        <textarea
                          className="input"
                          value={editForm[fieldKey] || ''}
                          onChange={(e) => setEditForm((f) => ({ ...f, [fieldKey]: e.target.value }))}
                          style={{ flex: 1, minHeight: '48px', resize: 'vertical' }}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {detailSections.map((section, i) => {
                    const value = selected[section.key] as string | null
                    if (!value) return null
                    const isCopied = copiedKey === section.label

                    return (
                      <div key={section.key}>
                        {i > 0 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '14px 0' }} />}
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          <div style={{ width: '130px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {section.label}
                            </span>
                            <button
                              onClick={() => handleCopy(section.label, value)}
                              style={{
                                background: isCopied ? 'rgba(90,154,245,0.1)' : 'transparent',
                                border: 'none', cursor: 'pointer', fontSize: '9px', fontFamily: 'inherit',
                                fontWeight: 500, color: isCopied ? '#5a9af5' : 'rgba(255,255,255,0.18)',
                                padding: '2px 5px', borderRadius: '3px', transition: 'all 0.15s',
                              }}
                            >
                              {isCopied ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p style={{
                            margin: 0, flex: 1, fontSize: '13px', lineHeight: '1.7',
                            color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap',
                          }}>
                            {value}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>No item selected</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Select an item to view its content</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#0f1724', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', width: '360px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>Delete this content?</h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.45)' }}>
              This will permanently remove this content from the Library.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="vp-btn" style={{ fontSize: '12px', height: '32px', padding: '0 12px' }} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="btn-primary" style={{ fontSize: '12px', height: '32px', padding: '0 12px', background: 'rgba(220,70,70,0.8)' }} disabled={deleting} onClick={() => handleDelete(confirmDeleteId)}>
                {deleting ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// -- Small action button --
function ActionBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: '11px', fontFamily: 'inherit', fontWeight: 500,
        color: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: '4px',
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = danger ? 'rgba(255,100,100,0.7)' : 'rgba(255,255,255,0.6)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
    >
      {label}
    </button>
  )
}
