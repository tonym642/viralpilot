'use client'

import { useState, useEffect, useCallback } from 'react'

export default function MusicAssetsPanel({
  projectId,
  projectName,
  initialLyrics,
  initialSongStyle,
  highlightMissing = false,
}: {
  projectId: string
  projectName: string
  initialLyrics: string | null
  initialSongStyle: string | null
  highlightMissing?: boolean
}) {
  const [lyrics, setLyrics] = useState(initialLyrics || '')
  const [savedLyrics, setSavedLyrics] = useState(initialLyrics || '')
  const [songStyle, setSongStyle] = useState(initialSongStyle || '')
  const [savedSongStyle, setSavedSongStyle] = useState(initialSongStyle || '')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  const isDirty = lyrics !== savedLyrics || songStyle !== savedSongStyle

  const handleSave = useCallback(async () => {
    if (!isDirty || saving) return
    setSaving(true)
    setSaveStatus('idle')

    try {
      const res = await fetch('/api/update-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId,
          name: projectName,
          lyrics_text: lyrics || null,
          song_style: songStyle || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSavedLyrics(lyrics)
        setSavedSongStyle(songStyle)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }, [projectId, projectName, lyrics, songStyle, isDirty, saving])

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  const v2Cards = [
    {
      title: 'Song File',
      desc: 'Upload your song for AI audio analysis — mood, tempo, energy mapping.',
      icon: '♫',
    },
    {
      title: 'Music Video',
      desc: 'Upload a music video for AI visual analysis — scene detection, pacing, style.',
      icon: '▶',
    },
    {
      title: 'Reference Video',
      desc: 'Upload a reference video to guide content style and visual direction.',
      icon: '◎',
    },
  ]

  return (
    <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
      {/* Left column: Lyrics (65%) */}
      <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700 }}>Lyrics</h3>
            <p className="muted" style={{ margin: 0, fontSize: '11px' }}>
              Paste your song lyrics. They&apos;ll be used to generate smarter strategy and content.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {saveStatus === 'saved' && (
              <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 500 }}>Saved</span>
            )}
            {saveStatus === 'error' && (
              <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 500 }}>Error</span>
            )}
            <button
              className="btn-primary"
              style={{ fontSize: '11px', height: '30px', padding: '0 14px', opacity: isDirty ? 1 : 0.4 }}
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{
          position: 'relative',
          borderRadius: '8px',
          border: `1px solid ${isDirty ? 'rgba(90,154,245,0.3)' : savedLyrics ? 'rgba(74,222,128,0.15)' : highlightMissing && !lyrics ? 'rgba(251,191,36,0.3)' : 'var(--border-default)'}`,
          background: 'var(--surface-2)',
          transition: 'border-color 0.2s',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Paste your song lyrics here..."
            style={{
              width: '100%',
              flex: 1,
              padding: '14px 16px',
              fontSize: '13px',
              lineHeight: '1.75',
              color: '#c8d1de',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
            }}
          />
          {savedLyrics && !isDirty && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '12px',
              fontSize: '9px',
              fontWeight: 600,
              color: '#4ade80',
              background: 'rgba(74,222,128,0.08)',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Saved
            </div>
          )}
        </div>
        {lyrics && (
          <p className="muted" style={{ margin: '6px 0 0 0', fontSize: '10px', flexShrink: 0 }}>
            {lyrics.split('\n').filter(l => l.trim()).length} lines &middot; Ctrl+S to save
          </p>
        )}
      </div>

      {/* Right column: Song Style + Media Uploads (35%) */}
      <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0, overflowY: 'auto' }}>
        {/* Song Style */}
        <div>
          <h3 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700 }}>Song Style</h3>
          <p className="muted" style={{ margin: '0 0 8px 0', fontSize: '11px' }}>
            Describe the genre, mood, and energy of the track.
          </p>
          <textarea
            value={songStyle}
            onChange={(e) => setSongStyle(e.target.value)}
            placeholder="Dembow, melodic reggaeton, high-energy party track..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '10px 12px',
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#c8d1de',
              background: 'var(--surface-2)',
              border: `1px solid ${songStyle !== savedSongStyle ? 'rgba(90,154,245,0.3)' : savedSongStyle ? 'rgba(74,222,128,0.15)' : highlightMissing && !songStyle ? 'rgba(251,191,36,0.3)' : 'var(--border-default)'}`,
              borderRadius: '8px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* Media Uploads */}
        <div>
          <h3 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700 }}>Media Uploads</h3>
          <p className="muted" style={{ margin: '0 0 12px 0', fontSize: '11px' }}>
            Song files, videos, and references for AI analysis.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {v2Cards.map((card) => (
              <div
                key={card.title}
                style={{
                  border: '1px dashed rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '14px 14px',
                  background: 'rgba(255,255,255,0.015)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: '20px', opacity: 0.3, flexShrink: 0, marginTop: '1px' }}>{card.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>
                      {card.title}
                    </h4>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      color: 'rgba(139,124,245,0.6)',
                      background: 'rgba(139,124,245,0.08)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      V2
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '10px', lineHeight: '1.5', color: 'rgba(255,255,255,0.42)' }}>
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
