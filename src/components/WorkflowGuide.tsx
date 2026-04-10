'use client'

import { useRouter } from 'next/navigation'

export type WorkflowGuideProps = {
  projectId: string
  completedTitle: string
  completedSummary: string
  nextLabel: string
  ctaText: string
  nextHref: string
}

export default function WorkflowGuide({
  projectId,
  completedTitle,
  completedSummary,
  nextLabel,
  ctaText,
  nextHref,
}: WorkflowGuideProps) {
  const router = useRouter()

  return (
    <div style={{
      marginTop: '20px',
      padding: '16px 18px',
      borderRadius: '10px',
      background: 'rgba(74,222,128,0.03)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(74,222,128,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: '#4ade80' }}>
          {completedTitle}
        </h4>
        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
          {completedSummary}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        {nextLabel && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{nextLabel}</span>
        )}
        <button
          className="btn-primary"
          style={{ fontSize: '12px', height: '32px', padding: '0 18px', whiteSpace: 'nowrap' }}
          onClick={() => router.push(`/projects/${projectId}/${nextHref}`)}
        >
          {ctaText}
        </button>
      </div>
    </div>
  )
}
