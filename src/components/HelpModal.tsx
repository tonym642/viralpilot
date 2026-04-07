'use client'

import { useState, useEffect } from 'react'

export type HelpContent = {
  title: string
  whatThisIs: string
  whatToDo: string[]
  important?: string[]
  whatHappensNext?: string
}

function HelpModalDialog({
  content,
  onClose,
}: {
  content: HelpContent
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0c1320',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '24px',
          width: '460px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>
          {content.title}
        </h2>

        {/* What this is */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(90,154,245,0.6)' }}>
            What this is
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#c8d1de', lineHeight: '1.6' }}>
            {content.whatThisIs}
          </p>
        </div>

        {/* What to do */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(90,154,245,0.6)' }}>
            What to do here
          </h4>
          <ul style={{ margin: 0, paddingLeft: '16px', listStyle: 'none' }}>
            {content.whatToDo.map((item, i) => (
              <li key={i} style={{ fontSize: '13px', color: '#c8d1de', lineHeight: '1.7', position: 'relative', paddingLeft: '2px' }}>
                <span style={{ position: 'absolute', left: '-14px', color: 'rgba(90,154,245,0.4)' }}>-</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Important */}
        {content.important && content.important.length > 0 && (
          <div style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(251,191,36,0.6)' }}>
              Important
            </h4>
            <ul style={{ margin: 0, paddingLeft: '16px', listStyle: 'none' }}>
              {content.important.map((item, i) => (
                <li key={i} style={{ fontSize: '12px', color: 'rgba(251,191,36,0.7)', lineHeight: '1.6', position: 'relative', paddingLeft: '2px' }}>
                  <span style={{ position: 'absolute', left: '-14px', color: 'rgba(251,191,36,0.35)' }}>!</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What happens next */}
        {content.whatHappensNext && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(74,222,128,0.5)' }}>
              What happens next
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.6' }}>
              {content.whatHappensNext}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn-primary"
            style={{ fontSize: '12px', height: '30px', padding: '0 16px' }}
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HelpButton({ pageKey, content }: { pageKey: string; content: HelpContent }) {
  const [open, setOpen] = useState(false)

  // Auto-open on first visit
  useEffect(() => {
    const key = `vp-help-seen-${pageKey}`
    if (!localStorage.getItem(key)) {
      setOpen(true)
      localStorage.setItem(key, '1')
    }
  }, [pageKey])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="How this works"
        style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.35)',
          fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s', flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(90,154,245,0.3)'; e.currentTarget.style.color = '#5a9af5' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
      >
        ?
      </button>
      {open && <HelpModalDialog content={content} onClose={() => setOpen(false)} />}
    </>
  )
}
