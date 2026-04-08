'use client'

import { useState, useEffect } from 'react'
import type { ContentPlanItem, AthleteContentPlanObject } from '@/src/lib/athleteContentPlan'

type NavKey = 'overview' | 'profile' | 'brand' | 'pillars' | 'strategy' | 'content-plan' | 'library'

const statusTabs = ['draft', 'ready', 'posted'] as const

export default function AthleteLibrary({
  projectId,
  contentPlan,
  onNavigate,
  onPlanChange,
}: {
  projectId: string
  contentPlan: AthleteContentPlanObject | null
  onNavigate: (key: NavKey) => void
  onPlanChange: (plan: AthleteContentPlanObject) => void
}) {
  // Only show items that have generated content
  const allGenerated = (contentPlan?.items || []).filter((i) => !!i.generatedContent)

  const [activeStatus, setActiveStatus] = useState<string>(() => {
    if (allGenerated.filter((i) => i.status === 'draft').length > 0) return 'draft'
    if (allGenerated.filter((i) => i.status === 'ready').length > 0) return 'ready'
    return 'posted'
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const filtered = allGenerated.filter((i) => i.status === activeStatus)

  // Auto-select first item in current tab
  useEffect(() => {
    if (filtered.length > 0 && (!selectedId || !filtered.find((i) => i.id === selectedId))) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  const selected = selectedId ? allGenerated.find((i) => i.id === selectedId) || null : null

  const handleStatusChange = async (itemId: string, status: 'draft' | 'ready' | 'posted') => {
    if (!contentPlan) return
    const updated = {
      ...contentPlan,
      items: contentPlan.items.map((i) => i.id === itemId ? { ...i, status } : i),
    }
    onPlanChange(updated)
    await fetch('/api/save-athlete-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, section: 'contentPlan', data: updated }),
    })
  }

  const handleDelete = async () => {
    if (!contentPlan || !selected) return
    setShowDeleteConfirm(false)
    const updated = {
      ...contentPlan,
      items: contentPlan.items.map((i) =>
        i.id === selected.id ? { ...i, generatedContent: undefined, status: 'draft' as const } : i
      ),
    }
    setSelectedId(null)
    onPlanChange(updated)
    await fetch('/api/save-athlete-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, section: 'contentPlan', data: updated }),
    })
  }

  const handleCopy = (label: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  // Full empty state
  if (allGenerated.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Library</h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>All generated content lives here.</p>
        </div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '40px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No Generated Content Yet</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>Generate content from the Content Plan page and it will appear here.</p>
          <button className="btn-primary" onClick={() => onNavigate('content-plan')}>Go to Content Plan</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: '14px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Library</h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>All generated content lives here.</p>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '14px', flexShrink: 0 }}>
        {statusTabs.map((tab) => {
          const count = allGenerated.filter((i) => i.status === tab).length
          return (
            <button
              key={tab}
              onClick={() => setActiveStatus(tab)}
              style={{
                padding: '8px 14px', fontSize: '13px',
                fontWeight: activeStatus === tab ? 600 : 400,
                color: activeStatus === tab ? '#f0f4fa' : 'rgba(255,255,255,0.35)',
                background: 'transparent', border: 'none',
                borderBottom: activeStatus === tab ? '2px solid #5a9af5' : '2px solid transparent',
                cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap', marginBottom: '-1px', fontFamily: 'inherit', textTransform: 'capitalize',
              }}
            >
              {tab} ({count})
            </button>
          )
        })}
      </div>

      {/* Split view */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Left: list */}
        <div style={{ width: '40%', flexShrink: 0, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: '13px' }}>No {activeStatus} items.</p>
          ) : (
            <div>
              {filtered.map((item) => {
                const isSelected = selectedId === item.id
                const isPosted = item.status === 'posted'
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '7px 8px', marginBottom: '1px', borderRadius: '6px',
                      fontSize: '13px', cursor: 'pointer', transition: 'background 0.1s',
                      background: isSelected ? 'rgba(90,154,245,0.12)' : 'transparent',
                      borderLeft: isSelected ? '2px solid #5a9af5' : isPosted ? '2px solid rgba(80,200,120,0.2)' : '2px solid transparent',
                    }}
                  >
                    <span style={{ color: isPosted ? 'rgba(255,255,255,0.32)' : '#8b7cf5', fontWeight: 600, fontSize: '11px', minWidth: '36px', flexShrink: 0 }}>
                      Day {item.day}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected && !isPosted ? '#f0f4fa' : isPosted ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.6)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '1px' }}>
                        {item.contentType} · {item.goal}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                      background: isPosted ? 'rgba(255,255,255,0.04)' : 'rgba(139,124,245,0.08)',
                      color: isPosted ? 'rgba(255,255,255,0.32)' : '#b0a4f5', fontWeight: 500, flexShrink: 0,
                    }}>
                      {item.platform}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: detail */}
        <div style={{
          flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border-default)',
          borderRadius: '10px', padding: '14px 16px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {selected && selected.generatedContent ? (
            <>
              {/* Header */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: '#8b7cf5', fontWeight: 700, fontSize: '11px' }}>Day {selected.day}</span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>{selected.platform}</span>
                  <StatusBadge status={selected.status} />
                  <span style={{ flex: 1 }} />
                  <button className="vp-btn-ghost" style={{ fontSize: '10px', color: 'var(--text-faint)' }} onClick={() => setShowDeleteConfirm(true)}>
                    Remove
                  </button>
                </div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#edf0f5' }}>{selected.title}</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <Badge label={selected.contentType} />
                  <Badge label={selected.goal} />
                  <Badge label={selected.pillar} />
                  {selected.generatedContent.updatedAt && (
                    <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                      Updated {new Date(selected.generatedContent.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', marginBottom: '14px' }} />

              {/* Content sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ContentSection label="Hook" text={selected.hook} onCopy={handleCopy} copiedKey={copiedKey} highlight />
                <ContentSection label="Script" text={selected.generatedContent.script} onCopy={handleCopy} copiedKey={copiedKey} pre />
                <ContentSection label="Caption" text={selected.generatedContent.caption} onCopy={handleCopy} copiedKey={copiedKey} />
                <ContentSection label="Hashtags" text={selected.generatedContent.hashtags.join('  ')} onCopy={handleCopy} copiedKey={copiedKey} muted />
                <ContentSection label="Visual Direction" text={selected.generatedContent.visualDirection} onCopy={handleCopy} copiedKey={copiedKey} muted />

                {selected.generatedContent.shotIdeas.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <SectionLabel>Shot Ideas</SectionLabel>
                      <CopyButton label="Shot Ideas" text={selected.generatedContent.shotIdeas.join('\n')} onCopy={handleCopy} copiedKey={copiedKey} />
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '14px', listStyle: 'none' }}>
                      {selected.generatedContent.shotIdeas.map((s, i) => (
                        <li key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', position: 'relative', paddingLeft: '2px' }}>
                          <span style={{ position: 'absolute', left: '-12px', color: 'rgba(90,154,245,0.4)' }}>-</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Status actions */}
              <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '6px' }}>
                <span style={{ flex: 1 }} />
                {selected.status === 'draft' && (
                  <button className="btn-primary" style={{ fontSize: '10px', height: '26px', padding: '0 10px' }} onClick={() => handleStatusChange(selected.id, 'ready')}>
                    Mark Ready
                  </button>
                )}
                {selected.status === 'ready' && (
                  <>
                    <button className="vp-btn" style={{ fontSize: '10px', height: '26px', padding: '0 10px' }} onClick={() => handleStatusChange(selected.id, 'draft')}>
                      Move to Draft
                    </button>
                    <button className="btn-primary" style={{ fontSize: '10px', height: '26px', padding: '0 10px', background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)' }} onClick={() => handleStatusChange(selected.id, 'posted')}>
                      Mark Posted
                    </button>
                  </>
                )}
                {selected.status === 'posted' && (
                  <>
                    <button className="vp-btn" style={{ fontSize: '10px', height: '26px', padding: '0 10px' }} onClick={() => handleStatusChange(selected.id, 'draft')}>
                      Move to Draft
                    </button>
                    <button className="vp-btn" style={{ fontSize: '10px', height: '26px', padding: '0 10px' }} onClick={() => handleStatusChange(selected.id, 'ready')}>
                      Move to Ready
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>No item selected</p>
              <p className="muted" style={{ margin: 0, fontSize: '12px' }}>Select an item from the list to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowDeleteConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '24px', width: '400px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Delete Generated Content?</h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-tertiary)' }}>
              This will remove the generated content from the library for this item, but keep the content plan entry.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="vp-btn" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ fontSize: '12px', height: '28px', padding: '0 12px', background: 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)' }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    draft: { bg: 'rgba(255,255,255,0.05)', fg: 'var(--text-faint)' },
    ready: { bg: 'rgba(90,154,245,0.1)', fg: '#7db4ff' },
    posted: { bg: 'rgba(74,222,128,0.1)', fg: '#4ade80' },
  }
  const s = map[status] || map.draft
  return <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '3px', fontWeight: 600, textTransform: 'capitalize', background: s.bg, color: s.fg }}>{status}</span>
}

function Badge({ label }: { label: string }) {
  return <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</span>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 style={{ margin: 0, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.32)' }}>{children}</h4>
}

function CopyButton({ label, text, onCopy, copiedKey }: { label: string; text: string; onCopy: (l: string, t: string) => void; copiedKey: string | null }) {
  const isCopied = copiedKey === label
  return (
    <button
      onClick={() => onCopy(label, text)}
      style={{
        background: isCopied ? 'rgba(90,154,245,0.1)' : 'transparent',
        border: 'none', cursor: 'pointer', fontSize: '10px', fontFamily: 'inherit', fontWeight: 500,
        color: isCopied ? '#5a9af5' : 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '4px',
        transition: 'all 0.15s',
      }}
    >
      {isCopied ? 'Copied' : 'Copy'}
    </button>
  )
}

function ContentSection({ label, text, onCopy, copiedKey, highlight, pre, muted }: {
  label: string; text: string; onCopy: (l: string, t: string) => void; copiedKey: string | null
  highlight?: boolean; pre?: boolean; muted?: boolean
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <SectionLabel>{label}</SectionLabel>
        <CopyButton label={label} text={text} onCopy={onCopy} copiedKey={copiedKey} />
      </div>
      <p style={{
        margin: 0,
        fontSize: highlight ? '15px' : muted ? '12px' : '13px',
        fontWeight: highlight ? 600 : 400,
        lineHeight: highlight ? '1.5' : '1.75',
        color: highlight ? '#edf0f5' : muted ? 'rgba(255,255,255,0.45)' : '#c0cad8',
        whiteSpace: pre ? 'pre-wrap' : 'normal',
        ...(highlight ? { borderLeft: '2px solid rgba(90,154,245,0.3)', paddingLeft: '10px' } : {}),
      }}>
        {text}
      </p>
    </div>
  )
}
