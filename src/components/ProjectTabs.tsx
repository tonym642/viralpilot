'use client'

import { useState } from 'react'
import ProjectChat from './ProjectChat'
import GeneratePlanButton from './GeneratePlanButton'
import ContentLibrary from './ContentLibrary'
import MusicInterview from './MusicInterview'
import MusicOverview from './MusicOverview'
import MusicSettings from './MusicSettings'
import StrategyPanel from './StrategyPanel'
import MusicAssetsPanel from './MusicAssetsPanel'
import HelpButton from './HelpModal'
import { helpContent } from '@/src/lib/helpContent'

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
  mode: string | null
  type: string | null
  description: string | null
  lyrics_text?: string | null
  song_style?: string | null
}

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'plan', label: 'Content Plan' },
  { key: 'assets', label: 'Assets' },
  { key: 'chat', label: 'AI Chat' },
  { key: 'library', label: 'Library' },
  { key: 'settings', label: 'Settings' },
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
  interviewCompleted: initialInterviewCompleted = false,
  interviewData = null,
  strategyUpdatedAt = null,
  planGeneratedAt = null,
  strategyStatus: initialStrategyStatus = null,
}: {
  project: Project
  plans: Plan[]
  messages: Message[]
  contentItems: ContentItem[]
  interviewCompleted?: boolean
  interviewData?: Record<string, unknown> | null
  strategyUpdatedAt?: string | null
  planGeneratedAt?: string | null
  strategyStatus?: string | null
}) {
  const [interviewDone, setInterviewDone] = useState(initialInterviewCompleted)
  const [currentStrategyStatus, setCurrentStrategyStatus] = useState(initialStrategyStatus)
  const [active, setActive] = useState<TabKey>('overview')
  const [platformFilter, setPlatformFilter] = useState<string>('All')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    plans.length > 0 ? plans[0].id : null
  )
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [dayStatuses, setDayStatuses] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {}
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

  // Strategy-aware plan state
  const planIsOutdated = (() => {
    if (!strategyUpdatedAt || !planGeneratedAt) return false
    return new Date(strategyUpdatedAt).getTime() > new Date(planGeneratedAt).getTime()
  })()

  const hasStrategy = !!interviewData?.interview_completed
  const hasPlan = plans.length > 0
  const isMusicProject = project.mode === 'Music'
  const strategyApproved = currentStrategyStatus === 'approved'

  // Extract strategy summary fields for display
  const strategySummary = hasStrategy ? {
    audience: (interviewData?.audience as string) || null,
    tone: (interviewData?.tone as string) || null,
    platforms: (interviewData?.platform_focus as string) || null,
    pillars: (interviewData?.content_style as string) || null,
    goal: (interviewData?.goal as string) || null,
  } : null

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
          projectMode: project.mode || '',
          description: project.description || '',
          day: selectedPlan.day,
          title: selectedPlan.title,
          platform: selectedPlan.platform,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedContent((prev) => ({ ...prev, [selectedPlan.id]: data.content }))

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
        className="vp-tab-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          borderBottom: '1px solid var(--border-subtle)',
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
              color: active === tab.key ? '#eef1f6' : 'rgba(255,255,255,0.55)',
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
        <span style={{ flex: 1 }} />
        {helpContent[active] && (
          <HelpButton pageKey={active} content={helpContent[active]} />
        )}
      </div>

      {/* Tab content */}
      <div className="vp-content-area" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {active === 'overview' && (
          <MusicOverview
            project={project}
            interviewData={interviewData}
            interviewCompleted={interviewDone}
            strategyStatus={currentStrategyStatus}
            plans={plans}
            contentItems={contentItems}
            onNavigate={setActive}
          />
        )}

        {active === 'library' && (
          <ContentLibrary initialItems={contentItems} />
        )}

        {active === 'assets' && (
          isMusicProject ? (
            <MusicAssetsPanel
              projectId={project.id}
              projectName={project.name}
              initialLyrics={project.lyrics_text || null}
              initialSongStyle={project.song_style || null}
              highlightMissing={!project.lyrics_text || !project.song_style}
            />
          ) : (
            <div style={{ overflowY: 'auto', scrollbarWidth: 'none' }}>
              <p className="muted" style={{ marginTop: 0, marginBottom: '12px', fontSize: '13px' }}>
                Uploaded files, images, and creative materials will appear here.
              </p>
              <button className="btn-primary" disabled style={{ opacity: 0.4 }}>Upload Asset (Coming Soon)</button>
            </div>
          )
        )}

        {active === 'plan' && !strategyApproved && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '18px', color: 'rgba(255,255,255,0.25)' }}>
              🔒
            </div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700 }}>Content Plan Locked</h2>
            <p className="muted" style={{ margin: '0 0 16px 0', fontSize: '13px', maxWidth: '360px', lineHeight: '1.6' }}>
              Complete and approve your strategy before generating a content plan.
            </p>
            <button className="btn-primary" onClick={() => setActive('strategy')}>
              Go to Strategy
            </button>
          </div>
        )}

        {active === 'plan' && strategyApproved && !interviewDone && (
          <MusicInterview
            projectId={project.id}
            projectName={project.name}
            projectMode={project.mode || ''}
            projectDescription={project.description || ''}
            onComplete={() => setInterviewDone(true)}
          />
        )}

        {active === 'plan' && strategyApproved && interviewDone && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Strategy summary banner */}
            {hasStrategy && hasPlan && !planIsOutdated && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '6px 12px',
                marginBottom: '10px',
                borderRadius: '6px',
                background: 'rgba(74, 222, 128, 0.06)',
                border: '1px solid rgba(74, 222, 128, 0.12)',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                flexShrink: 0,
                flexWrap: 'wrap',
              }}>
                <span style={{ color: '#4ade80', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Generated from current strategy
                </span>
                {strategySummary?.audience && (
                  <span>Audience: <span style={{ color: '#c0cad8' }}>{strategySummary.audience}</span></span>
                )}
                {strategySummary?.tone && (
                  <span>Tone: <span style={{ color: '#c0cad8' }}>{strategySummary.tone}</span></span>
                )}
                {strategySummary?.platforms && (
                  <span>Platform: <span style={{ color: '#c0cad8' }}>{strategySummary.platforms}</span></span>
                )}
                {strategySummary?.pillars && (
                  <span>Style: <span style={{ color: '#c0cad8' }}>{strategySummary.pillars}</span></span>
                )}
              </div>
            )}

            {/* Outdated strategy warning */}
            {planIsOutdated && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                marginBottom: '10px',
                borderRadius: '6px',
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.15)',
                fontSize: '12px',
                flexShrink: 0,
              }}>
                <span style={{ color: '#fbbf24' }}>
                  This plan was generated from an older version of your strategy.
                </span>
                <GeneratePlanButton
                  projectId={project.id}
                  projectName={project.name}
                  projectMode={project.mode || ''}
                  description={project.description || ''}
                  hasExistingPlan
                  label="Regenerate Plan"
                />
              </div>
            )}

            <div className="vp-split-layout" style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
              {/* Left: plan list */}
              <div className="vp-split-left" style={{ width: '40%', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
                  <span className="muted" style={{ fontSize: '12px' }}>
                    {plans.length > 0 ? `${filteredPlans.length} of ${plans.length} days` : ''}
                  </span>
                  <GeneratePlanButton
                    projectId={project.id}
                    projectName={project.name}
                    projectMode={project.mode || ''}
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
                            : 'rgba(255,255,255,0.45)',
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '30px 20px' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: '#eef1f6' }}>
                        Ready to generate your content plan
                      </p>
                      <p className="muted" style={{ margin: '0 0 14px 0', fontSize: '12px', maxWidth: '280px', lineHeight: '1.5' }}>
                        Your approved strategy will guide every day of the plan.
                      </p>
                      <GeneratePlanButton
                        projectId={project.id}
                        projectName={project.name}
                        projectMode={project.mode || ''}
                        description={project.description || ''}
                      />
                    </div>
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
                            <span style={{ color: isPosted ? 'rgba(255,255,255,0.32)' : '#8b7cf5', fontWeight: 600, fontSize: '11px', minWidth: '36px', flexShrink: 0 }}>
                              Day {item.day}
                            </span>
                            <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected && !isPosted ? '#edf0f5' : isPosted ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
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
                                  ? 'rgba(255,255,255,0.32)'
                                  : dayStatus === 'ready'
                                    ? '#7db4ff'
                                    : 'rgba(255,255,255,0.3)',
                              }}>
                                {dayStatus}
                              </span>
                            )}
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: isPosted ? 'rgba(255,255,255,0.04)' : 'rgba(139,124,245,0.08)', color: isPosted ? 'rgba(255,255,255,0.32)' : '#b0a4f5', fontWeight: 500, flexShrink: 0 }}>
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
                className="vp-split-right"
                style={{
                  flex: 1,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '10px',
                  padding: '14px 16px',
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
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#edf0f5' }}>
                        {selectedPlan.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'rgba(255,255,255,0.45)' }}>
                        {selectedPlan.description}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', marginBottom: '16px' }} />

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
                                : 'rgba(255,255,255,0.45)',
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
                                <div style={{ borderTop: '1px solid var(--border-subtle)', marginBottom: '18px' }} />
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <h4 style={{
                                  margin: 0,
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                  color: 'rgba(255,255,255,0.32)',
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
                                  ? '#edf0f5'
                                  : isCaption
                                    ? '#c0cad8'
                                    : isHashtags || isVisual
                                      ? 'rgba(255,255,255,0.45)'
                                      : '#c0cad8',
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
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'rgba(255,255,255,0.45)' }}>
                      No plan selected
                    </p>
                    <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                      Generate a plan or select an item to view details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {active === 'strategy' && (
          <StrategyPanel
            project={project}
            interview={interviewData as Record<string, string | boolean | null> | null}
            onSwitchToPlan={() => setActive('plan')}
            onSwitchToAssets={() => setActive('assets')}
            onStrategyApproved={() => setCurrentStrategyStatus('approved')}
            messages={messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
          />
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

        {active === 'settings' && (
          <MusicSettings
            project={project}
            interviewData={interviewData}
            interviewCompleted={interviewDone}
            strategyStatus={currentStrategyStatus}
            plans={plans}
            contentItems={contentItems}
          />
        )}
      </div>
    </div>
  )
}
