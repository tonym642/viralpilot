'use client'

import { useState } from 'react'

const PLACEHOLDER_ITEMS = [
  { day: 1, label: 'Hook clip', platform: 'TikTok', status: 'ready' },
  { day: 1, label: 'Story post', platform: 'Instagram', status: 'draft' },
  { day: 2, label: 'Reel', platform: 'Instagram', status: 'draft' },
  { day: 3, label: 'Behind the scenes', platform: 'TikTok', status: 'ready' },
  { day: 4, label: 'Lyric teaser', platform: 'TikTok', status: 'draft' },
  { day: 5, label: 'Short clip', platform: 'YouTube Shorts', status: 'draft' },
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function SchedulerPage() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* Split layout */}
      <div
        className="vp-split-layout"
        style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}
      >
        {/* Left: content items */}
        <div
          className="vp-split-left"
          style={{
            width: '35%',
            flexShrink: 0,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Content to Schedule</h2>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
            {PLACEHOLDER_ITEMS.map((item, i) => {
              const isSelected = i === selectedIndex
              return (
                <div
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(90,154,245,0.1)' : 'transparent',
                    borderLeft: isSelected ? '2px solid #5a9af5' : '2px solid transparent',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ color: '#8b7cf5', fontWeight: 600, fontSize: '11px', minWidth: '36px' }}>Day {item.day}</span>
                  <span style={{ flex: 1, fontSize: '12px', color: isSelected ? '#edf0f5' : 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                  <span style={{
                    fontSize: '9px', padding: '1px 5px', borderRadius: '3px', fontWeight: 600, textTransform: 'capitalize',
                    background: item.status === 'ready' ? 'rgba(90,154,245,0.1)' : 'rgba(255,255,255,0.05)',
                    color: item.status === 'ready' ? '#7db4ff' : 'rgba(255,255,255,0.3)',
                  }}>
                    {item.status}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0, textAlign: 'center', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Drag items onto the calendar to schedule
            </span>
          </div>
        </div>

        {/* Right: calendar */}
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
          {/* Calendar header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Calendar</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="vp-btn" style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}>
                &larr;
              </button>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', padding: '4px 8px' }}>
                April 2026
              </span>
              <button className="vp-btn" style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}>
                &rarr;
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
            {WEEKDAYS.map((d) => (
              <span key={d} style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', textTransform: 'uppercase' }}>
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ flex: 1, padding: '8px 12px', overflowY: 'auto', scrollbarWidth: 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {/* Empty cells for month offset */}
              {[0, 1, 2].map((i) => (
                <div key={`empty-${i}`} style={{ minHeight: '80px' }} />
              ))}
              {/* Day cells */}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  style={{
                    minHeight: '80px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '6px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    transition: 'background 0.1s',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '11px' }}>{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '50px', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Metricool integration coming soon
            </span>
            <button className="btn-primary" style={{ fontSize: '11px', height: '30px', padding: '0 14px' }} disabled>
              Connect Metricool
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
