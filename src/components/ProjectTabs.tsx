'use client'

import { useState } from 'react'
import ProjectChat from './ProjectChat'
import GeneratePlanButton from './GeneratePlanButton'
import ContentLibrary from './ContentLibrary'

type Plan = {
  id: string
  day: number
  title: string
  description: string
  platform: string
}

type Message = {
  id: string
  role: string
  content: string
  created_at: string
}

type Project = {
  id: string
  name: string
  type: string | null
  description: string | null
}

const tabs = [
  { key: 'plan', label: 'Content Plan' },
  { key: 'library', label: 'Library' },
  { key: 'assets', label: 'Assets' },
  { key: 'chat', label: 'AI Chat' },
] as const

type TabKey = (typeof tabs)[number]['key']

const platformFilters = ['All', 'TikTok', 'Instagram', 'YouTube Shorts', 'Facebook', 'Twitter'] as const

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

export default function ProjectTabs({
  project,
  plans,
  messages,
  contentItems,
}: {
  project: Project
  plans: Plan[]
  messages: Message[]
  contentItems: ContentItem[]
}) {
  const [active, setActive] = useState<TabKey>('plan')
  const [platformFilter, setPlatformFilter] = useState<string>('All')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    plans.length > 0 ? plans[0].id : null
  )
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [dayStatuses, setDayStatuses] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    // Build from contentItems, latest created_at wins per day
    const sorted = [...contentItems].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    for (const ci of sorted) {
      if (!(ci.day in map)) {
        map[ci.day] = ci.status
      }
    }
    return map
  })

  const handleCopy = (label: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const filteredPlans = platformFilter === 'All'
    ? plans
    : plans.filter((p) => p.platform.toLowerCase() === platformFilter.toLowerCase())

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || null
  const currentContent = selectedPlanId ? generatedContent[selectedPlanId] : null
  const selectedDayStatus = selectedPlan ? dayStatuses[selectedPlan.day] : undefined
  const hasSavedContent = !!selectedDayStatus

  const handleGenerateContent = async (regenerate = false) => {
    if (!selectedPlan || generating) return
    if (!regenerate && currentContent) return

    setGenerating(true)
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          projectName: project.name,
          projectType: project.type || '',
          description: project.description || '',
          day: selectedPlan.day,
          title: selectedPlan.title,
          platform: selectedPlan.platform,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedContent((prev) => ({ ...prev, [selectedPlan.id]: data.content }))

        // Save to content_items
        const parsed = parseContent(data.content)
        const field = (label: string) => parsed.find((s) => s.label === label)?.value || ''
        try {
          const saveRes = await fetch('/api/content-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: project.id,
              day: selectedPlan.day,
              title: selectedPlan.title,
              platform: selectedPlan.platform,
              hook: field('Hook'),
              script: field('Script'),
              caption: field('Caption'),
              hashtags: field('Hashtags'),
              visualDirection: field('Visual Direction'),
              status: 'draft',
            }),
          })
          const saveData = await saveRes.json()
          if (saveData.error) {
            console.error('Content save error:', saveData.error)
          } else {
            setDayStatuses((prev) => ({ ...prev, [selectedPlan.day]: 'draft' }))
          }
        } catch (saveErr) {
          console.error('Content save error:', saveErr)
        }
      } else {
        console.error('Generate content error:', data.error)
      }
    } catch (err) {
      console.error('Generate content error:', err)
    } finally {
      setGenerating(false)
    }
  }

  const parseContent = (raw: string) => {
    const sections: { label: string; key: string }[] = [
      { label: 'Hook', key: 'HOOK' },
      { label: 'Script', key: 'SCRIPT' },
      { label: 'Caption', key: 'CAPTION' },
      { label: 'Hashtags', key: 'HASHTAGS' },
      { label: 'Visual Direction', key: 'VISUAL_DIRECTION' },
    ]
    const result: { label: string; value: string }[] = []
    for (let i = 0; i < sections.length; i++) {
      const start = raw.indexOf(sections[i].key + ':')
      if (start === -1) continue
      const after = start + sections[i].key.length + 1
      const nextStart = i < sections.length - 1
        ? raw.indexOf(sections[i + 1].key + ':')
        : -1
      const value = (nextStart === -1 ? raw.slice(after) : raw.slice(after, nextStart)).trim()
      result.push({ label: sections[i].label, value })
    }
    return result
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '14px',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: active === tab.key ? 600 : 400,
              color: active === tab.key ? '#f0f4fa' : 'rgba(255,255,255,0.35)',
              background: 'transparent',
              border: 'none',
              borderBottom: active === tab.key
                ? '2px solid #5a9af5'
                : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
              marginBottom: '-1px',
              fontFamily: 'inherit',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {active === 'library' && (
          <ContentLibrary initialItems={contentItems} />
        )}

        {active === 'assets' && (
          <div style={{ overflowY: 'auto', scrollbarWidth: 'none' }}>
            <p className="muted" style={{ marginTop: 0, marginBottom: '12px', fontSize: '13px' }}>
              Uploaded files, song files, images, and creative materials will appear here.
            </p>
            <button className="btn-primary">Upload Asset</button>
          </div>
        )}

        {active === 'plan' && (
          <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
            {/* Left: plan list */}
            <div style={{ width: '40%', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
                <span className="muted" style={{ fontSize: '12px' }}>
                  {plans.length > 0 ? `${filteredPlans.length} of ${plans.length} days` : ''}
                </span>
                <GeneratePlanButton
                  projectId={project.id}
                  projectName={project.name}
                  projectType={project.type || ''}
                  description={project.description || ''}
                  hasExistingPlan={plans.length > 0}
                />
              </div>

              {plans.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px', flexShrink: 0 }}>
                  {platformFilters.map((pf) => (
                    <button
                      key={pf}
                      onClick={() => setPlatformFilter(pf)}
                      style={{
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 500,
                        fontFamily: 'inherit',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: platformFilter === pf
                          ? 'rgba(90,154,245,0.4)'
                          : 'rgba(255,255,255,0.08)',
                        background: platformFilter === pf
                          ? 'rgba(90,154,245,0.15)'
                          : 'transparent',
                        color: platformFilter === pf
                          ? '#7db4ff'
                          : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pf}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
                {plans.length === 0 ? (
                  <p className="muted" style={{ margin: 0, fontSize: '13px' }}>No plan yet.</p>
                ) : filteredPlans.length === 0 ? (
                  <p className="muted" style={{ margin: 0, fontSize: '13px' }}>No items for this platform.</p>
                ) : (
                  <div>
                    {filteredPlans.map((item) => {
                      const isSelected = selectedPlanId === item.id
                      const dayStatus = dayStatuses[item.day]
                      const isPosted = dayStatus === 'posted'
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedPlanId(item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '10px',
                            padding: '7px 8px',
                            marginBottom: '1px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'background 0.1s',
                            background: isSelected
                              ? 'rgba(90,154,245,0.12)'
                              : isPosted
                                ? 'rgba(255,255,255,0.015)'
                                : 'transparent',
                            borderLeft: isSelected
                              ? '2px solid #5a9af5'
                              : isPosted
                                ? '2px solid rgba(80,200,120,0.2)'
                                : '2px solid transparent',
                          }}
                        >
                          <span style={{ color: isPosted ? 'rgba(255,255,255,0.25)' : '#8b7cf5', fontWeight: 600, fontSize: '11px', minWidth: '36px', flexShrink: 0 }}>
                            Day {item.day}
                          </span>
                          <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected && !isPosted ? '#f0f4fa' : isPosted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                            {item.title}
                          </span>
                          <span style={{ flex: 1 }} />
                          {dayStatus && (
                            <span style={{
                              fontSize: '9px',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              flexShrink: 0,
                              background: dayStatus === 'posted'
                                ? 'rgba(255,255,255,0.04)'
                                : dayStatus === 'ready'
                                  ? 'rgba(90,154,245,0.1)'
                                  : 'rgba(255,255,255,0.05)',
                              color: dayStatus === 'posted'
                                ? 'rgba(255,255,255,0.25)'
                                : dayStatus === 'ready'
                                  ? '#7db4ff'
                                  : 'rgba(255,255,255,0.3)',
                            }}>
                              {dayStatus}
                            </span>
                          )}
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: isPosted ? 'rgba(255,255,255,0.04)' : 'rgba(139,124,245,0.08)', color: isPosted ? 'rgba(255,255,255,0.25)' : '#b0a4f5', fontWeight: 500, flexShrink: 0 }}>
                            {item.platform}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: detail panel */}
            <div
              style={{
                flex: 1,
                background: 'rgba(13,19,30,0.9)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '18px 20px',
                overflowY: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {selectedPlan ? (
                <>
                  {/* Header: meta + title + description */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ color: '#8b7cf5', fontWeight: 700, fontSize: '11px' }}>
                        Day {selectedPlan.day}
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>
                        {selectedPlan.platform}
                      </span>
                      <span style={{ flex: 1 }} />
                      <button
                        className="vp-btn"
                        style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
                        onClick={() => handleGenerateContent(hasSavedContent || !!currentContent)}
                        disabled={generating}
                      >
                        {generating ? 'Generating...' : (hasSavedContent || currentContent) ? 'Regenerate' : 'Generate Content'}
                      </button>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#f0f4fa' }}>
                      {selectedPlan.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'rgba(255,255,255,0.35)' }}>
                      {selectedPlan.description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }} />

                  {/* Generated content */}
                  {generating && !currentContent && (
                    <p style={{ fontSize: '12px', margin: 0, color: 'rgba(90,154,245,0.5)' }}>Generating content...</p>
                  )}

                  {!currentContent && !generating && !hasSavedContent && (
                    <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                      Click Generate Content to create hook, script, caption, and more.
                    </p>
                  )}

                  {!currentContent && !generating && hasSavedContent && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          background: selectedDayStatus === 'posted'
                            ? 'rgba(80,200,120,0.1)'
                            : selectedDayStatus === 'ready'
                              ? 'rgba(90,154,245,0.1)'
                              : 'rgba(255,255,255,0.05)',
                          color: selectedDayStatus === 'posted'
                            ? '#50c878'
                            : selectedDayStatus === 'ready'
                              ? '#7db4ff'
                              : 'rgba(255,255,255,0.35)',
                        }}>
                          {selectedDayStatus}
                        </span>
                        <span className="muted" style={{ fontSize: '12px' }}>
                          Content already generated for this day
                        </span>
                      </div>
                      <button
                        onClick={() => setActive('library')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'inherit',
                          fontWeight: 500,
                          color: '#5a9af5',
                          padding: 0,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        View in Library →
                      </button>
                    </div>
                  )}

                  {currentContent && (
                    <div>
                      {parseContent(currentContent).map((section, i) => {
                        const isHook = section.label === 'Hook'
                        const isCaption = section.label === 'Caption'
                        const isHashtags = section.label === 'Hashtags'
                        const isVisual = section.label === 'Visual Direction'
                        const isCopied = copiedKey === section.label

                        return (
                          <div key={section.label} style={{ marginBottom: '18px' }}>
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
                                onClick={() => handleCopy(section.label, section.value)}
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
                                : isCaption
                                  ? 'rgba(255,255,255,0.65)'
                                  : isHashtags || isVisual
                                    ? 'rgba(255,255,255,0.4)'
                                    : 'rgba(255,255,255,0.7)',
                              whiteSpace: 'pre-wrap',
                              ...(isHook ? { borderLeft: '2px solid rgba(90,154,245,0.3)', paddingLeft: '10px' } : {}),
                            }}>
                              {section.value}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                    No plan selected
                  </p>
                  <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                    Generate a plan or select an item to view details.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {active === 'chat' && (
          <div className="chat-panel" style={{ flex: 1, minHeight: 0 }}>
            <div className="chat-panel-header">
              <h2 style={{ marginTop: 0, fontSize: '14px', marginBottom: '1px' }}>AI Chat</h2>
              <p className="muted" style={{ margin: 0, fontSize: '11px' }}>
                Ask ViralPilot about content, promotion, or clips.
              </p>
            </div>
            <ProjectChat projectId={project.id} initialMessages={messages} />
          </div>
        )}
      </div>
    </div>
  )
}
