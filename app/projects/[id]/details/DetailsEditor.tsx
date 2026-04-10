'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { ProjectDetails } from '@/src/lib/detailsHelpers'

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const TABS = ['Info', 'Lyrics'] as const
type Tab = (typeof TABS)[number]

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

const LANGUAGE_OPTIONS = ['English', 'Spanish', 'Vietnamese', 'Portuguese', 'French', 'Instrumental', 'Other']
const DISTRIBUTION_OPTIONS = ['Spotify', 'Apple Music', 'YouTube', 'TikTok', 'SoundCloud', 'Amazon Music', 'Deezer', 'Tidal', 'Other']
const GOAL_OPTIONS = ['Grow streams', 'Grow followers', 'Build brand', 'Promote release', 'Drive engagement', 'Go viral', 'Attract fans', 'Support live shows', 'Get industry attention', 'Other']
const AUDIENCE_OPTIONS = ['Teens', 'Young adults', 'Adults', 'Men', 'Women', 'Latin audience', 'Bilingual audience', 'Party crowd', 'Club audience', 'Romantic audience', 'Urban music fans', 'Christian audience', 'Fitness audience', 'Other']
const TONE_OPTIONS = ['Funny', 'Emotional', 'Bold', 'Romantic', 'Hype', 'Cinematic', 'Inspirational', 'Raw', 'Luxury', 'Mysterious', 'Street', 'Playful', 'Other']
const PLATFORM_FOCUS_OPTIONS = ['TikTok', 'Instagram', 'YouTube Shorts', 'Facebook', 'X / Twitter', 'Threads', 'Snapchat', 'Other']
const CTA_OPTIONS = ['Stream now', 'Watch now', 'Follow for more', 'Share this', 'Comment below', 'Pre-save now', 'Save this post', 'Tag a friend', 'Visit profile', 'Other']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DetailsEditor({
  projectId,
  initialDetails,
}: {
  projectId: string
  initialDetails: Record<string, unknown>
}) {
  const [active, setActive] = useState<Tab>('Info')
  const [details, setDetails] = useState<ProjectDetails>(initialDetails as ProjectDetails ?? {})
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // -- Auto-save with debounce --
  const save = useCallback(async (data: ProjectDetails) => {
    setSaveState('saving')
    try {
      const res = await fetch('/api/save-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, details: data }),
      })
      const json = await res.json()
      setSaveState(json.success ? 'saved' : 'idle')
      if (json.success) setTimeout(() => setSaveState('idle'), 1500)
    } catch {
      setSaveState('idle')
    }
  }, [projectId])

  const scheduleSave = useCallback((data: ProjectDetails) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(data), 800)
  }, [save])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  // -- Generic updaters --
  const updateInfo = (key: string, value: unknown) => {
    const next = { ...details, info: { ...details.info, [key]: value } }
    setDetails(next)
    scheduleSave(next)
  }

  const updateQuestions = (key: string, value: unknown) => {
    const next = { ...details, questions: { ...details.questions, [key]: value } }
    setDetails(next)
    scheduleSave(next)
  }

  const updateLyrics = (key: string, value: string) => {
    const next = { ...details, lyrics: { ...details.lyrics, [key]: value } }
    setDetails(next)
    scheduleSave(next)
  }

  const info = details.info ?? {}
  const questions = details.questions ?? {}
  const lyrics = details.lyrics ?? {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Tab bar + save state */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginBottom: '12px', flexShrink: 0 }}>
        {saveState !== 'idle' && (
          <span style={{ fontSize: '11px', color: saveState === 'saving' ? 'var(--text-muted)' : '#4ade80', marginRight: '8px' }}>
            {saveState === 'saving' ? 'Saving...' : 'Saved'}
          </span>
        )}
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            style={{
              padding: '8px 16px', fontSize: '13px', fontWeight: active === tab ? 600 : 400,
              color: active === tab ? '#eef1f6' : 'rgba(255,255,255,0.55)',
              background: 'transparent', border: 'none',
              borderBottom: active === tab ? '2px solid #5a9af5' : '2px solid transparent',
              cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s', fontFamily: 'inherit', marginBottom: '-1px',
            }}
          >{tab}</button>
        ))}
      </div>

      {/* ── Info tab ── */}
      {active === 'Info' && (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }} className="vp-details-split">
          {/* Left: Song info + release (40%) */}
          <div style={{ width: '40%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SectionCard title="Song Information">
              <Field label="Song Title" value={info.songTitle} onChange={(v) => updateInfo('songTitle', v)} />
              <Field label="Artist / Project Name" value={info.artistName} onChange={(v) => updateInfo('artistName', v)} />
              <Field label="Author" value={info.author} onChange={(v) => updateInfo('author', v)} />
              <Field label="Genre" value={info.genre} onChange={(v) => updateInfo('genre', v)} />

              <PillSelectRow
                label="Language"
                options={LANGUAGE_OPTIONS}
                value={info.language}
                onChange={(v) => updateInfo('language', v)}
                otherValue={info.languageOther}
                onOtherChange={(v) => updateInfo('languageOther', v)}
              />

              <Field label="Description" value={info.description} onChange={(v) => updateInfo('description', v)} tall />
            </SectionCard>

            <SectionCard title="Release Details" style={{ flex: 1 }}>
              <DateField label="Release Date" value={info.releaseDate} onChange={(v) => updateInfo('releaseDate', v)} />

              <PillMultiRow
                label="Distribution"
                options={DISTRIBUTION_OPTIONS}
                value={info.distributionPlatforms}
                onChange={(v) => updateInfo('distributionPlatforms', v)}
                otherValue={info.distributionOther}
                onOtherChange={(v) => updateInfo('distributionOther', v)}
              />
            </SectionCard>
          </div>

          {/* Right: Questionnaire */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <SectionCard title="Project Questionnaire" subtitle="Select the options that best describe your content strategy and marketing direction." style={{ flex: 1 }}>

              <PillSelectRow
                label="Primary goal"
                importance="primary"
                options={GOAL_OPTIONS}
                value={questions.primaryGoal}
                onChange={(v) => updateQuestions('primaryGoal', v)}
                otherValue={questions.primaryGoalOther}
                onOtherChange={(v) => updateQuestions('primaryGoalOther', v)}
              />
              <Divider />

              <PillMultiRow
                label="Platform focus"
                importance="primary"
                options={PLATFORM_FOCUS_OPTIONS}
                value={questions.platformFocus}
                onChange={(v) => updateQuestions('platformFocus', v)}
                otherValue={questions.platformFocusOther}
                onOtherChange={(v) => updateQuestions('platformFocusOther', v)}
              />
              <Divider />

              <PillSelectRow
                label="Content tone"
                options={TONE_OPTIONS}
                value={questions.contentTone}
                onChange={(v) => updateQuestions('contentTone', v)}
                otherValue={questions.contentToneOther}
                onOtherChange={(v) => updateQuestions('contentToneOther', v)}
              />
              <Divider />

              <PillMultiRow
                label="Target audience"
                options={AUDIENCE_OPTIONS}
                value={questions.targetAudience}
                onChange={(v) => updateQuestions('targetAudience', v)}
                otherValue={questions.targetAudienceOther}
                onOtherChange={(v) => updateQuestions('targetAudienceOther', v)}
              />
              <Divider />

              <PillSelectRow
                label="Call to action"
                importance="tertiary"
                options={CTA_OPTIONS}
                value={questions.callToAction}
                onChange={(v) => updateQuestions('callToAction', v)}
                otherValue={questions.callToActionOther}
                onOtherChange={(v) => updateQuestions('callToActionOther', v)}
              />
              <Divider />

              <Field label="What makes it unique" value={questions.uniqueAngle} onChange={(v) => updateQuestions('uniqueAngle', v as string)} tall />
            </SectionCard>
          </div>
        </div>
      )}

      {/* ── Lyrics tab ── */}
      {active === 'Lyrics' && (
        <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }} className="vp-details-split">
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <SectionCard title="Song Lyrics" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
                Paste or edit your song lyrics. These are used to generate content ideas and hooks.
              </p>
              <textarea
                value={lyrics.lyricsText ?? ''}
                onChange={(e) => updateLyrics('lyricsText', e.target.value)}
                placeholder="Paste lyrics here..."
                style={{
                  flex: 1, minHeight: '200px', background: 'var(--surface-3)',
                  border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px',
                  fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.8',
                  fontFamily: 'inherit', resize: 'none', outline: 'none',
                }}
              />
            </SectionCard>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <SectionCard title="Song Style" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
                Describe the genre, vibe, and musical style of your song.
              </p>
              <textarea
                value={lyrics.styleNotes ?? ''}
                onChange={(e) => updateLyrics('styleNotes', e.target.value)}
                placeholder="Describe the style..."
                style={{
                  flex: 1, minHeight: '100px', background: 'var(--surface-3)',
                  border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px',
                  fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.8',
                  fontFamily: 'inherit', resize: 'none', outline: 'none',
                }}
              />
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Sub-components
// ===========================================================================

type Importance = 'primary' | 'secondary' | 'tertiary'

function SectionCard({ title, subtitle, children, style }: { title: string; subtitle?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '20px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 0 16px 0', flexShrink: 0, gap: '12px' }}>
        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
        {subtitle && <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>{subtitle}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>{children}</div>
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
}

function DateField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <label style={{ width: '200px', flexShrink: 0, fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, height: '38px', background: 'var(--surface-3)',
          border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px 12px',
          fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'inherit',
          outline: 'none', transition: 'border-color 0.15s',
          colorScheme: 'dark',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(90,154,245,0.4)' }}
        onBlur={(e) => { e.target.style.borderColor = '' }}
      />
    </div>
  )
}

function Field({ label, value, onChange, tall }: { label: string; value?: string; onChange: (v: string) => void; tall?: boolean }) {
  const Tag = tall ? 'textarea' : 'input'
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: tall ? 'flex-start' : 'center' }}>
      <label style={{ width: '200px', flexShrink: 0, fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', paddingTop: tall ? '8px' : 0 }}>
        {label}
      </label>
      <Tag
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        style={{
          flex: 1, minHeight: tall ? '80px' : '38px', background: 'var(--surface-3)',
          border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px 12px',
          fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'inherit',
          resize: tall ? 'vertical' : 'none', outline: 'none', lineHeight: tall ? '1.6' : 'normal',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'rgba(90,154,245,0.4)' }}
        onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '' }}
      />
    </div>
  )
}

// -- Pill --
function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = '' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = '' }}
      style={{
        padding: '6px 14px',
        fontSize: '11px',
        fontWeight: selected ? 600 : 500,
        fontFamily: 'inherit',
        borderRadius: '16px',
        border: '1.5px solid',
        borderColor: selected ? 'rgba(90,154,245,0.6)' : 'rgba(255,255,255,0.08)',
        background: selected ? 'rgba(90,154,245,0.12)' : 'transparent',
        color: selected ? '#93bbff' : 'rgba(255,255,255,0.45)',
        cursor: 'pointer',
        transition: 'all 0.18s ease-out',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}
    >
      {label}
    </button>
  )
}

// -- Other input --
function OtherInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <div style={{ width: '100%', marginTop: '4px', paddingLeft: '0px', transition: 'all 0.18s ease-out' }}>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Please specify..."
        autoFocus
        style={{
          width: '220px',
          height: '32px',
          background: 'var(--surface-3)',
          border: '1px solid rgba(90,154,245,0.3)',
          borderRadius: '6px',
          padding: '4px 12px',
          fontSize: '12px',
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(90,154,245,0.5)' }}
        onBlur={(e) => { e.target.style.borderColor = 'rgba(90,154,245,0.3)' }}
      />
    </div>
  )
}

// -- Label for pill rows --
function RowLabel({ text, importance }: { text: string; importance?: Importance }) {
  const fontSize = importance === 'primary' ? '14px' : importance === 'tertiary' ? '12px' : '13px'
  const fontWeight = importance === 'primary' ? 600 : 500
  const color = importance === 'primary' ? 'var(--text-primary)' : 'var(--text-secondary)'
  return (
    <label style={{ width: '200px', flexShrink: 0, fontSize, fontWeight, color, paddingTop: '7px' }}>
      {text}
    </label>
  )
}

// -- Single-select pill row --
function PillSelectRow({
  label, options, value, onChange, otherValue, onOtherChange, importance,
}: {
  label: string
  options: string[]
  value?: string
  onChange: (v: string) => void
  otherValue?: string
  onOtherChange?: (v: string) => void
  importance?: Importance
}) {
  const showOther = value === 'Other'
  const mt = importance === 'primary' ? '4px' : '0'
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: mt }}>
      <RowLabel text={label} importance={importance} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', alignItems: 'center' }}>
          {options.map((opt) => (
            <Pill key={opt} label={opt} selected={value === opt} onClick={() => onChange(value === opt ? '' : opt)} />
          ))}
        </div>
        {showOther && onOtherChange && <OtherInput value={otherValue} onChange={onOtherChange} />}
      </div>
    </div>
  )
}

// -- Multi-select pill row --
function PillMultiRow({
  label, options, value, onChange, otherValue, onOtherChange, importance,
}: {
  label: string
  options: string[]
  value?: string[]
  onChange: (v: string[]) => void
  otherValue?: string
  onOtherChange?: (v: string) => void
  importance?: Importance
}) {
  const arr = value ?? []
  const toggle = (opt: string) => {
    onChange(arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt])
  }
  const showOther = arr.includes('Other')
  const mt = importance === 'primary' ? '4px' : '0'
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: mt }}>
      <RowLabel text={label} importance={importance} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', alignItems: 'center' }}>
          {options.map((opt) => (
            <Pill key={opt} label={opt} selected={arr.includes(opt)} onClick={() => toggle(opt)} />
          ))}
        </div>
        {showOther && onOtherChange && <OtherInput value={otherValue} onChange={onOtherChange} />}
      </div>
    </div>
  )
}
