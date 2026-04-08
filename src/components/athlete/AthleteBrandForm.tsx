'use client'

import { useState } from 'react'

const PERSONALITY_TYPES = [
  'Leader',
  'Technician',
  'Motivator',
  'Showman',
  'Grinder',
  'Funny',
  'Family',
  'Lifestyle',
]

export default function AthleteBrandForm({
  projectId,
  initialData,
  onSave,
}: {
  projectId: string
  initialData: Record<string, string> | null
  onSave?: (data: Record<string, string>) => void
}) {
  const [form, setForm] = useState({
    personality_type: initialData?.personality_type || '',
    brand_vibe: initialData?.brand_vibe || '',
    strengths_on_camera: initialData?.strengths_on_camera || '',
    weaknesses_on_camera: initialData?.weaknesses_on_camera || '',
    interests_outside_sport: initialData?.interests_outside_sport || '',
    story_background: initialData?.story_background || '',
    top_3_content_themes: initialData?.top_3_content_themes || '',
    brand_adjectives: initialData?.brand_adjectives || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/save-athlete-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, section: 'brand', data: form }),
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        onSave?.(form)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch { /* */ }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Brand Identity
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Define how the athlete shows up on social media.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saved && <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 500 }}>Saved</span>}
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: '12px', height: '30px', padding: '0 14px' }}>
            {saving ? 'Saving...' : 'Save Brand'}
          </button>
        </div>
      </div>

      <div style={{ padding: '8px 12px', marginBottom: '14px', borderRadius: '6px', background: 'rgba(90,154,245,0.04)', border: '1px solid rgba(90,154,245,0.1)', fontSize: '12px', color: 'rgba(90,154,245,0.7)', flexShrink: 0 }}>
        Your content should feel consistent. This defines your personality and style.
      </div>

      {/* Two-column split */}
      <div className="vp-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Left column */}
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          borderRadius: '10px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          minHeight: 0,
        }}>
          <SectionLabel>Personality &amp; Vibe</SectionLabel>
          <Row label="Personality Type" hint="How you naturally come across">
            <select className="input" value={form.personality_type} onChange={(e) => set('personality_type', e.target.value)} style={{ fontSize: '13px' }}>
              <option value="">Select type...</option>
              {PERSONALITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Row>
          <Row label="Brand Vibe">
            <input className="input" value={form.brand_vibe} onChange={(e) => set('brand_vibe', e.target.value)} placeholder="e.g. Bold & fearless, Chill & relatable" style={{ fontSize: '13px' }} />
          </Row>

          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

          <SectionLabel>On Camera</SectionLabel>
          <Row label="Strengths">
            <textarea className="input" value={form.strengths_on_camera} onChange={(e) => set('strengths_on_camera', e.target.value)} placeholder="What they do well on camera..." rows={2} style={{ fontSize: '13px', resize: 'vertical' }} />
          </Row>
          <Row label="Weaknesses">
            <textarea className="input" value={form.weaknesses_on_camera} onChange={(e) => set('weaknesses_on_camera', e.target.value)} placeholder="Areas to improve..." rows={2} style={{ fontSize: '13px', resize: 'vertical' }} />
          </Row>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
          {/* Background & Story card */}
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}>
            <SectionLabel>Background &amp; Story</SectionLabel>
            <Row label="Interests">
              <textarea className="input" value={form.interests_outside_sport} onChange={(e) => set('interests_outside_sport', e.target.value)} placeholder="Hobbies, passions, side projects..." rows={2} style={{ fontSize: '13px', resize: 'vertical' }} />
            </Row>
            <Row label="Story" hint="What makes your journey unique">
              <textarea className="input" value={form.story_background} onChange={(e) => set('story_background', e.target.value)} placeholder="Origin story, challenges overcome..." rows={3} style={{ fontSize: '13px', resize: 'vertical' }} />
            </Row>
          </div>

          {/* Brand Tags card */}
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            flex: 1,
            minHeight: 0,
          }}>
            <SectionLabel>Brand Tags</SectionLabel>
            <Row label="Content Themes">
              <div>
                <input className="input" value={form.top_3_content_themes} onChange={(e) => set('top_3_content_themes', e.target.value)} placeholder="e.g. Training, Lifestyle, Game Day" style={{ fontSize: '13px' }} />
                <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: 'var(--text-faint)' }}>Comma separated</p>
              </div>
            </Row>
            <Row label="Adjectives">
              <div>
                <input className="input" value={form.brand_adjectives} onChange={(e) => set('brand_adjectives', e.target.value)} placeholder="e.g. Relentless, Authentic, Inspiring" style={{ fontSize: '13px' }} />
                <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: 'var(--text-faint)' }}>Comma separated</p>
              </div>
            </Row>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ margin: 0, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
      {children}
    </h3>
  )
}

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '120px', flexShrink: 0 }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)' }}>{label}</label>
        {hint && <p style={{ margin: '1px 0 0 0', fontSize: '10px', color: 'var(--text-faint)', lineHeight: '1.3' }}>{hint}</p>}
      </div>
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}
