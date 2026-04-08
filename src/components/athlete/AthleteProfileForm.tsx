'use client'

import { useState } from 'react'

const PRIMARY_GOALS = [
  'Recruiting Exposure',
  'NIL / Sponsorships',
  'Personal Brand Growth',
  'Fan Engagement',
  'Highlight Visibility',
]

export default function AthleteProfileForm({
  projectId,
  initialData,
  onSave,
}: {
  projectId: string
  initialData: Record<string, string> | null
  onSave?: (data: Record<string, string>) => void
}) {
  const [form, setForm] = useState({
    athlete_name: initialData?.athlete_name || '',
    sport: initialData?.sport || '',
    position: initialData?.position || '',
    school_team: initialData?.school_team || '',
    graduation_year: initialData?.graduation_year || '',
    location: initialData?.location || '',
    instagram_handle: initialData?.instagram_handle || '',
    tiktok_handle: initialData?.tiktok_handle || '',
    youtube_channel: initialData?.youtube_channel || '',
    primary_goal: initialData?.primary_goal || '',
    secondary_goal: initialData?.secondary_goal || '',
    target_audience: initialData?.target_audience || '',
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
        body: JSON.stringify({ projectId, section: 'profile', data: form }),
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
            Athlete Profile
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Basic information about the athlete.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saved && <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 500 }}>Saved</span>}
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: '12px', height: '30px', padding: '0 14px' }}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Two-column split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
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
          <SectionLabel>Personal Info</SectionLabel>
          <Row label="Athlete Name">
            <input className="input" value={form.athlete_name} onChange={(e) => set('athlete_name', e.target.value)} placeholder="Full name" style={{ fontSize: '13px' }} />
          </Row>
          <Row label="Sport">
            <input className="input" value={form.sport} onChange={(e) => set('sport', e.target.value)} placeholder="e.g. Basketball, Soccer" style={{ fontSize: '13px' }} />
          </Row>
          <Row label="Position">
            <input className="input" value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="e.g. Point Guard, Striker" style={{ fontSize: '13px' }} />
          </Row>
          <Row label="School / Team">
            <input className="input" value={form.school_team} onChange={(e) => set('school_team', e.target.value)} placeholder="e.g. Duke University" style={{ fontSize: '13px' }} />
          </Row>
          <Row label="Graduation Year">
            <input className="input" value={form.graduation_year} onChange={(e) => set('graduation_year', e.target.value)} placeholder="e.g. 2026" style={{ fontSize: '13px' }} />
          </Row>
          <Row label="Location">
            <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Miami, FL" style={{ fontSize: '13px' }} />
          </Row>
        </div>

        {/* Right column */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {/* Social Media card */}
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}>
            <SectionLabel>Social Media</SectionLabel>
            <Row label="Instagram">
              <input className="input" value={form.instagram_handle} onChange={(e) => set('instagram_handle', e.target.value)} placeholder="@handle" style={{ fontSize: '13px' }} />
            </Row>
            <Row label="TikTok">
              <input className="input" value={form.tiktok_handle} onChange={(e) => set('tiktok_handle', e.target.value)} placeholder="@handle" style={{ fontSize: '13px' }} />
            </Row>
            <Row label="YouTube">
              <input className="input" value={form.youtube_channel} onChange={(e) => set('youtube_channel', e.target.value)} placeholder="Channel name" style={{ fontSize: '13px' }} />
            </Row>
          </div>

          {/* Goals card */}
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
            <SectionLabel>Goals</SectionLabel>
            <Row label="Primary Goal">
              <select className="input" value={form.primary_goal} onChange={(e) => set('primary_goal', e.target.value)} style={{ fontSize: '13px' }}>
                <option value="">Select a goal...</option>
                {PRIMARY_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Row>
            <Row label="Secondary Goal">
              <select className="input" value={form.secondary_goal} onChange={(e) => set('secondary_goal', e.target.value)} style={{ fontSize: '13px' }}>
                <option value="">Select a goal...</option>
                {PRIMARY_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Row>
            <Row label="Target Audience">
              <input className="input" value={form.target_audience} onChange={(e) => set('target_audience', e.target.value)} placeholder="e.g. College recruiters, local fans" style={{ fontSize: '13px' }} />
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <label style={{
        width: '120px',
        flexShrink: 0,
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--text-tertiary)',
      }}>
        {label}
      </label>
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}
