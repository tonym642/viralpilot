'use client'

import { useState, useEffect } from 'react'

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

const statusTabs = ['draft', 'ready', 'posted'] as const

const detailSections: { label: string; key: keyof ContentItem }[] = [
  { label: 'Hook', key: 'hook' },
  { label: 'Script', key: 'script' },
  { label: 'Caption', key: 'caption' },
  { label: 'Hashtags', key: 'hashtags' },
  { label: 'Visual Direction', key: 'visual_direction' },
]

export default function ContentLibrary({
  initialItems,
}: {
  initialItems: ContentItem[]
}) {
  const [items, setItems] = useState<ContentItem[]>(initialItems)
  const [activeStatus, setActiveStatus] = useState<string>('draft')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [confirmPostId, setConfirmPostId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/content-items/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setItems((prev) => prev.filter((item) => item.id !== id))
        if (selectedId === id) setSelectedId(null)
        setEditing(false)
      } else {
        console.error('Delete error:', data.error)
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

  const cancelEdit = () => {
    setEditing(false)
    setEditForm({})
  }

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
        setItems((prev) =>
          prev.map((item) => (item.id === selected.id ? data.item : item))
        )
        setEditing(false)
        setEditForm({})
      } else {
        console.error('Save edit error:', data.error)
      }
    } catch (err) {
      console.error('Save edit error:', err)
    } finally {
      setSaving(false)
    }
  }

  const filtered = items.filter((i) => i.status === activeStatus)
  const selected = items.find((i) => i.id === selectedId) || null

  // Auto-select first item when tab changes
  useEffect(() => {
    const first = items.filter((i) => i.status === activeStatus)[0]
    setSelectedId(first?.id || null)
    setEditing(false)
  }, [activeStatus, items])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id)
    try {
      const res = await fetch('/api/content-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        )
      }
    } catch (err) {
      console.error('Status update error:', err)
    } finally {
      setUpdating(null)
    }
  }

  const handleCopy = (label: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Status tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '14px',
          flexShrink: 0,
        }}
      >
        {statusTabs.map((tab) => {
          const count = items.filter((i) => i.status === tab).length
          return (
            <button
              key={tab}
              onClick={() => setActiveStatus(tab)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: activeStatus === tab ? 600 : 400,
                color: activeStatus === tab ? '#f0f4fa' : 'rgba(255,255,255,0.35)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeStatus === tab
                  ? '2px solid #5a9af5'
                  : '2px solid transparent',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
                marginBottom: '-1px',
                fontFamily: 'inherit',
                textTransform: 'capitalize',
              }}
            >
              {tab} ({count})
            </button>
          )
        })}
      </div>

      {/* Split view */}
      <div className="vp-split-layout" style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Left: list */}
        <div className="vp-split-left" style={{ width: '40%', flexShrink: 0, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {filtered.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
              No {activeStatus} items.
            </p>
          ) : (
            <div>
              {filtered.map((item) => {
                const isSelected = selectedId === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => { setSelectedId(item.id); setEditing(false) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '7px 8px',
                      marginBottom: '1px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                      background: isSelected
                        ? 'rgba(90,154,245,0.12)'
                        : 'transparent',
                      borderLeft: isSelected
                        ? '2px solid #5a9af5'
                        : '2px solid transparent',
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
              })}
            </div>
          )}
        </div>

        {/* Right: detail */}
        <div
          className="vp-split-right"
          style={{
            flex: 1,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '18px 20px',
            overflowY: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {selected ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: '#8b7cf5', fontWeight: 700, fontSize: '11px' }}>
                    Day {selected.day}
                  </span>
                  {!editing && (
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>
                      {selected.platform}
                    </span>
                  )}
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: selected.status === 'posted'
                      ? 'rgba(80,200,120,0.1)'
                      : selected.status === 'ready'
                        ? 'rgba(90,154,245,0.1)'
                        : 'rgba(255,255,255,0.05)',
                    color: selected.status === 'posted'
                      ? '#50c878'
                      : selected.status === 'ready'
                        ? '#7db4ff'
                        : 'rgba(255,255,255,0.35)',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}>
                    {selected.status}
                  </span>
                  <span style={{ flex: 1 }} />
                  {!editing && (
                    <>
                      {selected.status !== 'posted' && <button
                        onClick={startEdit}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontFamily: 'inherit',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.25)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                      >
                        Edit
                      </button>}
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/content-items/${selected.id}/duplicate`, { method: 'POST' })
                            const data = await res.json()
                            if (data.success && data.item) {
                              setItems((prev) => [...prev, data.item])
                              setActiveStatus('draft')
                              setSelectedId(data.item.id)
                            } else {
                              console.error('Duplicate error:', data.error)
                            }
                          } catch (err) {
                            console.error('Duplicate error:', err)
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontFamily: 'inherit',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.25)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(selected.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontFamily: 'inherit',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.25)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,100,100,0.7)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                      >
                        Delete
                      </button>
                      {selected.status === 'draft' && (
                        <button
                          className="vp-btn"
                          style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                          onClick={() => updateStatus(selected.id, 'ready')}
                          disabled={updating === selected.id}
                        >
                          {updating === selected.id ? '...' : 'Mark Ready'}
                        </button>
                      )}
                      {selected.status === 'ready' && (
                        <>
                          <button
                            onClick={() => updateStatus(selected.id, 'draft')}
                            disabled={updating === selected.id}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontFamily: 'inherit',
                              fontWeight: 500,
                              color: 'rgba(255,255,255,0.25)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                          >
                            {updating === selected.id ? '...' : 'Move to Draft'}
                          </button>
                          <button
                            className="vp-btn"
                            style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                            onClick={() => setConfirmPostId(selected.id)}
                            disabled={updating === selected.id}
                          >
                            Post
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {editing && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="vp-btn"
                        style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-primary"
                        style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                        onClick={saveEdit}
                        disabled={saving}
                      >
                        {saving ? '...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                {!editing ? (
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#f0f4fa' }}>
                    {selected.title}
                  </h3>
                ) : (
                  <div style={{ display: 'grid', gap: '8px', marginTop: '4px' }}>
                    <input
                      className="input"
                      placeholder="Title"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    />
                    <input
                      className="input"
                      placeholder="Platform"
                      value={editForm.platform}
                      onChange={(e) => setEditForm((f) => ({ ...f, platform: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }} />

              {/* Content sections */}
              {editing ? (
                <div style={{ display: 'grid', gap: '14px' }}>
                  {detailSections.map((section) => {
                    const fieldKey = section.key as string
                    const isShort = fieldKey === 'hook' || fieldKey === 'hashtags'
                    return (
                      <div key={fieldKey}>
                        <h4 style={{
                          margin: '0 0 4px 0',
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'rgba(255,255,255,0.25)',
                        }}>
                          {section.label}
                        </h4>
                        {isShort ? (
                          <input
                            className="input"
                            value={editForm[fieldKey] || ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, [fieldKey]: e.target.value }))}
                          />
                        ) : (
                          <textarea
                            className="input"
                            value={editForm[fieldKey] || ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, [fieldKey]: e.target.value }))}
                            style={{ minHeight: '64px', resize: 'vertical' }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                detailSections.map((section, i) => {
                  const value = selected[section.key] as string | null
                  if (!value) return null
                  const isHook = section.key === 'hook'
                  const isHashtags = section.key === 'hashtags'
                  const isVisual = section.key === 'visual_direction'
                  const isCopied = copiedKey === section.label

                  return (
                    <div key={section.key} style={{ marginBottom: '18px' }}>
                      {i > 0 && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginBottom: '18px' }} />
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'rgba(255,255,255,0.25)',
                        }}>
                          {section.label}
                        </h4>
                        <button
                          onClick={() => handleCopy(section.label, value)}
                          style={{
                            background: isCopied ? 'rgba(90,154,245,0.1)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontFamily: 'inherit',
                            fontWeight: 500,
                            color: isCopied ? '#5a9af5' : 'rgba(255,255,255,0.2)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            transition: 'all 0.15s',
                          }}
                        >
                          {isCopied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: isHook ? '15px' : isHashtags ? '12px' : '13px',
                        fontWeight: isHook ? 600 : 400,
                        lineHeight: isHook ? '1.5' : '1.75',
                        color: isHook
                          ? '#f0f4fa'
                          : isHashtags || isVisual
                            ? 'rgba(255,255,255,0.4)'
                            : 'rgba(255,255,255,0.7)',
                        whiteSpace: 'pre-wrap',
                        ...(isHook ? { borderLeft: '2px solid rgba(90,154,245,0.3)', paddingLeft: '10px' } : {}),
                      }}>
                        {value}
                      </p>
                    </div>
                  )
                })
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                No item selected
              </p>
              <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                Select an item to view its content.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Post confirmation modal */}
      {confirmPostId && (
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
          onClick={() => setConfirmPostId(null)}
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
              Post this content?
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.45)' }}>
              This represents that the content has been published in real life. You won&apos;t be able to move it back after posting.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="vp-btn"
                style={{ fontSize: '12px', height: '32px', padding: '0 12px' }}
                onClick={() => setConfirmPostId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: '12px', height: '32px', padding: '0 12px' }}
                disabled={updating === confirmPostId}
                onClick={async () => {
                  await updateStatus(confirmPostId, 'posted')
                  setConfirmPostId(null)
                }}
              >
                {updating === confirmPostId ? '...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
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
          onClick={() => setConfirmDeleteId(null)}
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
              Delete this content item?
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.45)' }}>
              This will permanently remove this saved content from the Library.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="vp-btn"
                style={{ fontSize: '12px', height: '32px', padding: '0 12px' }}
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: '12px', height: '32px', padding: '0 12px', background: 'rgba(220,70,70,0.8)' }}
                disabled={deleting}
                onClick={() => handleDelete(confirmDeleteId)}
              >
                {deleting ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
