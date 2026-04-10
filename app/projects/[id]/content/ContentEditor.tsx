'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentStatus = 'empty' | 'generated' | 'edited'

type ContentItem = {
  id: string
  day: number
  label: string
  platform: string
  status: ContentStatus
  hook: string
  script: string
  caption: string
  hashtags: string
  visualDirection: string
}

type DbContentItem = {
  id: string
  day: number
  title: string
  platform: string
  status: string
  hook: string | null
  script: string | null
  caption: string | null
  hashtags: string | null
  visual_direction: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTION_KEYS = ['hook', 'script', 'caption', 'hashtags', 'visualDirection'] as const
type SectionKey = (typeof SECTION_KEYS)[number]

const SECTION_LABELS: Record<SectionKey, string> = {
  hook: 'Hook', script: 'Script', caption: 'Caption',
  hashtags: 'Hashtags', visualDirection: 'Visual Direction',
}

const PLATFORM_FILTERS = ['All', 'TikTok', 'Instagram', 'YouTube Shorts', 'Facebook', 'Twitter'] as const
const DURATION_OPTIONS = ['7 days', '14 days', '30 days'] as const
const RIGHT_TABS = ['Details', 'Assets'] as const
type RightTab = (typeof RIGHT_TABS)[number]

// Default placeholder items (used when no DB items exist)
const DEFAULT_ITEMS: ContentItem[] = [
  { id: 'p1', day: 1, label: 'Hook clip', platform: 'TikTok', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
  { id: 'p2', day: 1, label: 'Story post', platform: 'Instagram', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
  { id: 'p3', day: 2, label: 'Reel', platform: 'Instagram', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
  { id: 'p4', day: 2, label: 'Short', platform: 'YouTube Shorts', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
  { id: 'p5', day: 3, label: 'Behind the scenes', platform: 'TikTok', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
  { id: 'p6', day: 3, label: 'Carousel post', platform: 'Instagram', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
  { id: 'p7', day: 4, label: 'Lyric teaser', platform: 'TikTok', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
  { id: 'p8', day: 5, label: 'Story poll', platform: 'Instagram', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
  { id: 'p9', day: 5, label: 'Short clip', platform: 'YouTube Shorts', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
  { id: 'p10', day: 6, label: 'Fan Q&A', platform: 'TikTok', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
  { id: 'p11', day: 7, label: 'Full reel', platform: 'Instagram', status: 'empty', hook: '', script: '', caption: '', hashtags: '', visualDirection: '' },
]

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = (pid: string) => `viralpilot:content:${pid}`

function loadItems(projectId: string, dbItems: DbContentItem[]): ContentItem[] {
  // Try localStorage first (has latest edits)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(projectId))
      if (raw) {
        const parsed = JSON.parse(raw) as ContentItem[]
        if (parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
  }

  // Convert DB items
  if (dbItems.length > 0) {
    return dbItems.map((d) => ({
      id: d.id,
      day: d.day,
      label: d.title,
      platform: d.platform,
      status: (d.hook || d.script || d.caption) ? 'generated' as ContentStatus : 'empty' as ContentStatus,
      hook: d.hook ?? '',
      script: d.script ?? '',
      caption: d.caption ?? '',
      hashtags: d.hashtags ?? '',
      visualDirection: d.visual_direction ?? '',
    }))
  }

  return DEFAULT_ITEMS
}

function persistItems(projectId: string, items: ContentItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify(items))
  } catch { /* quota exceeded etc */ }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContentEditor({
  projectId,
  dbItems,
}: {
  projectId: string
  dbItems: DbContentItem[]
}) {
  const [items, setItems] = useState<ContentItem[]>(() => loadItems(projectId, dbItems))
  const [duration, setDuration] = useState('30 days')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? '')
  const [rightTab, setRightTab] = useState<RightTab>('Details')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const itemsRef = useRef(items)

  // Persist on every change
  useEffect(() => {
    itemsRef.current = items
    persistItems(projectId, items)
  }, [items, projectId])

  const filtered = platformFilter === 'All' ? items : items.filter((i) => i.platform.toLowerCase() === platformFilter.toLowerCase())
  const selected = items.find((i) => i.id === selectedId) ?? null

  // Update a single field on the selected item
  const updateField = useCallback((field: SectionKey, value: string) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== selectedId) return item
      const newStatus: ContentStatus = item.status === 'empty' ? 'generated' : 'edited'
      return { ...item, [field]: value, status: newStatus }
    }))
  }, [selectedId])

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  // Mock generation
  const generateSection = async (sectionKey: SectionKey) => {
    setGenerating(sectionKey)
    await new Promise((r) => setTimeout(r, 600))
    const mock: Record<SectionKey, string> = {
      hook: '"Ready to feel something real? This one hits different."',
      script: 'Open on a close-up of the artist in a dimly lit studio. Cut to slow-motion street scenes. Build to the chorus with crowd energy.',
      caption: 'When the music speaks what your heart can\'t say... 🎶✨ New track out now.',
      hashtags: '#NewMusic #Reggaeton #ViralMusic #MusicLovers #TikTokMusic',
      visualDirection: 'Moody lighting, warm tones, intimate close-ups. Mix studio footage with cinematic street scenes.',
    }
    updateField(sectionKey, mock[sectionKey])
    setGenerating(null)
  }

  const generateAll = async () => {
    setGenerating('all')
    for (const key of SECTION_KEYS) {
      setGenerating(key)
      await new Promise((r) => setTimeout(r, 400))
      const mock: Record<SectionKey, string> = {
        hook: '"Ready to feel something real? This one hits different."',
        script: 'Open on a close-up of the artist in a dimly lit studio. Cut to slow-motion street scenes. Build to the chorus with crowd energy.',
        caption: 'When the music speaks what your heart can\'t say... 🎶✨ New track out now.',
        hashtags: '#NewMusic #Reggaeton #ViralMusic #MusicLovers #TikTokMusic',
        visualDirection: 'Moody lighting, warm tones, intimate close-ups. Mix studio footage with cinematic street scenes.',
      }
      updateField(key, mock[key])
    }
    setItems((prev) => prev.map((item) => item.id === selectedId ? { ...item, status: 'generated' } : item))
    setGenerating(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0, flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PLATFORM_FILTERS.map((pf) => <Pill key={pf} label={pf} active={platformFilter === pf} onClick={() => setPlatformFilter(pf)} />)}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {DURATION_OPTIONS.map((d) => <Pill key={d} label={d} active={duration === d} onClick={() => setDuration(d)} />)}
        </div>
      </div>

      {/* Split */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* LEFT: Content list (35%) */}
        <div style={{ width: '35%', flexShrink: 0, background: 'var(--surface-2)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', borderRadius: '10px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Content Plan</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{filtered.length} items</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
            {filtered.map((item) => {
              const isSelected = selectedId === item.id
              return (
                <div key={item.id} onClick={() => { setSelectedId(item.id); setRightTab('Details') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                    cursor: 'pointer', transition: 'background 0.1s',
                    background: isSelected ? 'rgba(90,154,245,0.1)' : 'transparent',
                    borderLeft: isSelected ? '2px solid #5a9af5' : '2px solid transparent',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ color: '#8b7cf5', fontWeight: 600, fontSize: '11px', minWidth: '36px', flexShrink: 0 }}>Day {item.day}</span>
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#edf0f5' : 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                  <span style={{ width: '65px', flexShrink: 0, textAlign: 'right' }}>
                    {item.status !== 'empty' && (
                      <span style={{
                        fontSize: '9px', fontWeight: 600, padding: '2px 6px', borderRadius: '3px', textTransform: 'capitalize',
                        background: item.status === 'edited' ? 'rgba(251,191,36,0.1)' : 'rgba(74,222,128,0.08)',
                        color: item.status === 'edited' ? '#fbbf24' : '#4ade80',
                      }}>{item.status}</span>
                    )}
                  </span>
                  <span style={{ width: '100px', flexShrink: 0, textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>
                      {item.platform}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT: Builder (65%) */}
        <div style={{ flex: 1, background: 'var(--surface-2)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', borderRadius: '10px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Header + tabs */}
          <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#8b7cf5', fontWeight: 700, fontSize: '11px' }}>Day {selected?.day}</span>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>{selected?.platform}</span>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#edf0f5' }}>{selected?.label}</h3>
              </div>
              <button className="vp-btn" style={{ fontSize: '10px', height: '26px', padding: '0 10px' }} onClick={generateAll} disabled={generating !== null}>
                {generating ? '...' : selected?.status === 'empty' ? 'Generate All' : 'Regenerate'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
              {RIGHT_TABS.map((tab) => (
                <button key={tab} onClick={() => setRightTab(tab)} style={{
                  padding: '7px 14px', fontSize: '12px', fontWeight: rightTab === tab ? 600 : 400,
                  color: rightTab === tab ? '#eef1f6' : 'rgba(255,255,255,0.5)',
                  background: 'transparent', border: 'none',
                  borderBottom: rightTab === tab ? '2px solid #5a9af5' : '2px solid transparent',
                  cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px', transition: 'color 0.15s',
                }}>{tab}</button>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '16px 20px' }}>
            {/* Details tab */}
            {rightTab === 'Details' && selected && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {SECTION_KEYS.map((key, i) => {
                  const value = selected[key]
                  const isCopied = copiedKey === key
                  const isGen = generating === key

                  return (
                    <div key={key}>
                      {i > 0 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '12px 0' }} />}
                      <div>
                        {/* Label row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {SECTION_LABELS[key]}
                          </span>
                          <MiniBtn label={isGen ? '...' : 'Regen'} onClick={() => generateSection(key)} disabled={generating !== null} accent />
                          {value && <MiniBtn label={isCopied ? 'Copied' : 'Copy'} onClick={() => handleCopy(key, value)} active={isCopied} />}
                        </div>
                        {/* Content */}
                        <textarea
                          value={value}
                          onChange={(e) => updateField(key, e.target.value)}
                          placeholder={`${SECTION_LABELS[key]} will appear here...`}
                          style={{
                            width: '100%', minHeight: key === 'script' || key === 'visualDirection' ? '80px' : '44px',
                            background: 'transparent', border: 'none', padding: '4px 0',
                            fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'inherit',
                            resize: 'none', outline: 'none', lineHeight: '1.7',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Assets tab */}
            {rightTab === 'Assets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <AssetRow icon="&#9654;" title="Video" description="Video assets will appear here. Generate or upload promotional clips." />
                <AssetRow icon="&#128247;" title="Thumbnail" description="Thumbnail assets will appear here. Create cover images for your content." />
                <AssetRow icon="&#128196;" title="Files" description="Supporting files will appear here. Scripts, notes, and exports." />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', fontSize: '11px', fontWeight: 500, fontFamily: 'inherit',
      borderRadius: '12px', borderWidth: '1px', borderStyle: 'solid',
      borderColor: active ? 'rgba(90,154,245,0.4)' : 'rgba(255,255,255,0.08)',
      background: active ? 'rgba(90,154,245,0.15)' : 'transparent',
      color: active ? '#7db4ff' : 'rgba(255,255,255,0.45)',
      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}>{label}</button>
  )
}

function MiniBtn({ label, onClick, disabled, accent, active }: { label: string; onClick: () => void; disabled?: boolean; accent?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '2px 8px', fontSize: '9px', fontWeight: 600, fontFamily: 'inherit',
      borderRadius: '4px', border: 'none', cursor: disabled ? 'default' : 'pointer',
      background: active ? 'rgba(90,154,245,0.12)' : accent ? 'rgba(90,154,245,0.08)' : 'rgba(255,255,255,0.04)',
      color: active ? '#5a9af5' : accent ? '#7db4ff' : 'rgba(255,255,255,0.35)',
      transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.03em',
      opacity: disabled ? 0.5 : 1,
    }}>{label}</button>
  )
}

function AssetRow({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '16px', opacity: 0.3, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: icon }} />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>{title}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</span>
    </div>
  )
}
