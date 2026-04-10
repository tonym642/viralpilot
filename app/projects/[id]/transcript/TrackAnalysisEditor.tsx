'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectAsset } from '@/src/lib/assetTypes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AudioFeatures = {
  tempoBpm?: number | null
  energyProfile?: string
  vocalIntensity?: string
  likelyPerformerCount?: string
  vocalStructureSignals?: string[]
  pitchRangeEstimate?: string
  likelyPrimaryRangeCategory?: string
  likelySecondaryRangeCategory?: string
  dynamicMoments?: string[]
  likelyHookMoments?: string[]
  durationSeconds?: number | null
  notes?: string
}

type VocalAnalysis = {
  performerCount?: string
  vocalStructure?: string
  detectedVoices?: string
  primaryRangeCategory?: string
  secondaryRangeCategory?: string
  detectedRange?: string
  energyLevel?: string
  deliveryStyle?: string
  notes?: string
}

type StyleMatch = {
  bestContentStyleMatches?: string[]
  bestVisualDirectionMatches?: string[]
  duetContentOpportunities?: string[]
  reasoning?: string
}

type AnalysisResult = {
  summary?: string
  themes?: string[]
  mood?: string
  audienceFit?: string
  contentAngles?: string[]
  hookIdeas?: string[]
  keywords?: string[]
  standoutLyrics?: string[]
  recommendedShortClipMoments?: string[]
  brandSafetyNotes?: string
  overallNotes?: string
  vocalAnalysis?: VocalAnalysis
  styleMatch?: StyleMatch
}

type ProcessingStage = 'idle' | 'uploading' | 'analyzing' | 'building' | 'done' | 'error'

const ACCEPT = '.mp3,.mp4,.wav,audio/mpeg,audio/mp4,audio/wav,audio/x-wav,video/mp4'
const MAX_SIZE = 50 * 1024 * 1024

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrackAnalysisEditor({
  projectId,
  hasLyrics,
  existingSource,
  existingAudioAnalysis,
  existingAnalysis,
}: {
  projectId: string
  hasLyrics: boolean
  existingSource: ProjectAsset | null
  existingAudioAnalysis: ProjectAsset | null
  existingAnalysis: ProjectAsset | null
}) {
  const router = useRouter()

  const existingAudioFeatures = (existingAudioAnalysis?.metadata_json as AudioFeatures) ?? null
  const existingAnalysisData = (existingAnalysis?.metadata_json as AnalysisResult) ?? null

  const [stage, setStage] = useState<ProcessingStage>(existingAnalysisData ? 'done' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<ProjectAsset | null>(existingSource)
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(existingAudioFeatures)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(existingAnalysisData)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_SIZE) { setError('File too large. Maximum 50MB.'); return }
    if (!file.type.match(/^(audio|video)\//)) { setError('Unsupported file type. Use MP3, MP4, or WAV.'); return }

    setError(null)
    setStage('uploading')
    setAnalysis(null)
    setAudioFeatures(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      setStage('analyzing')
      const res = await fetch('/api/track-analysis', { method: 'POST', body: formData })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Analysis failed')
        setStage('error')
        return
      }

      setSourceFile(data.sourceAsset)
      setAudioFeatures(data.audioFeatures)
      setAnalysis(data.analysis)
      setStage('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStage('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }

  const isProcessing = stage === 'uploading' || stage === 'analyzing' || stage === 'building'

  return (
    <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
      {/* ── Left panel: Upload (25%) ── */}
      <div style={{ width: '25%', flexShrink: 0, background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Upload</h2>
        </div>

        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', textAlign: 'center' }}>

          {/* Lyrics required gate */}
          {!hasLyrics && !isProcessing && (
            <div style={{ width: '100%' }}>
              <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 500, color: '#fbbf24' }}>Lyrics Required</p>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Add lyrics in the Details page before running Track Analysis.
                </p>
                <button
                  className="btn-primary"
                  style={{ fontSize: '12px', height: '32px', padding: '0 16px' }}
                  onClick={() => router.push(`/projects/${projectId}/details`)}
                >
                  Go to Details
                </button>
              </div>
            </div>
          )}

          {/* Current file info */}
          {sourceFile && !isProcessing && hasLyrics && (
            <div style={{ marginBottom: '16px', width: '100%' }}>
              <div style={{ background: 'rgba(90,154,245,0.06)', border: '1px solid rgba(90,154,245,0.15)', borderRadius: '8px', padding: '12px', fontSize: '12px', textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sourceFile.original_file_name}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  {sourceFile.file_size ? `${(sourceFile.file_size / 1024 / 1024).toFixed(1)} MB` : ''} &middot; {sourceFile.mime_type}
                </div>
                <div style={{ marginTop: '4px', fontSize: '10px', color: '#4ade80', fontWeight: 500 }}>Uploaded</div>
              </div>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-default)', borderTopColor: '#5a9af5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--accent-blue)' }}>
                {stage === 'uploading' && 'Uploading file...'}
                {stage === 'analyzing' && 'Analyzing audio & building report...'}
                {stage === 'building' && 'Building final analysis...'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>This may take a minute</p>
            </div>
          )}

          {/* Upload area */}
          {!isProcessing && hasLyrics && (
            <>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>&#9835;</div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {sourceFile ? 'Replace File' : 'Audio or Video'}
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
                Drag and drop or click to browse
              </p>
              <button className="btn-primary" style={{ fontSize: '12px', height: '34px', padding: '0 20px' }} onClick={() => fileRef.current?.click()}>
                Choose File
              </button>
              <input ref={fileRef} type="file" accept={ACCEPT} onChange={handleInputChange} style={{ display: 'none' }} />
              <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>MP3, MP4, WAV &middot; Max 50MB</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '10px', color: 'var(--text-muted)', opacity: 0.7 }}>Lyrics are pulled from your Details page</p>
            </>
          )}

          {error && (
            <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', fontSize: '12px', color: '#ef4444', textAlign: 'left', width: '100%' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: Results (75%) ── */}
      <div style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border-default)', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Analysis Results</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {/* Empty */}
          {stage === 'idle' && !analysis && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: '300px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 500, fontSize: '14px', color: 'var(--text-secondary)' }}>No track analysis yet</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Upload a file to generate audio analysis</p>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', minHeight: '300px' }}>
              <p style={{ margin: '0 0 4px 0', fontWeight: 500, fontSize: '14px', color: 'var(--accent-blue)' }}>Analyzing your track...</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Audio analysis and content report are being generated</p>
            </div>
          )}

          {/* Error */}
          {stage === 'error' && !analysis && (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 500, color: '#ef4444' }}>Analysis failed</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{error || 'Try uploading again.'}</p>
            </div>
          )}

          {/* Results */}
          {(stage === 'done' || analysis) && (
            <div style={{ padding: '20px' }}>
              {/* Audio overview from features */}
              {audioFeatures && audioFeatures.tempoBpm !== undefined && (
                <>
                  {audioFeatures.tempoBpm && (
                    <Row label="Tempo"><span style={{ fontSize: '14px', fontWeight: 700, color: '#7db4ff' }}>{audioFeatures.tempoBpm} BPM</span></Row>
                  )}
                  {audioFeatures.durationSeconds && (
                    <Row label="Duration"><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{Math.floor(audioFeatures.durationSeconds / 60)}:{String(Math.floor(audioFeatures.durationSeconds % 60)).padStart(2, '0')}</span></Row>
                  )}
                </>
              )}

              {analysis && (
                <>
                  {analysis.summary && <Row label="Summary"><p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7' }}>{analysis.summary}</p></Row>}
                  {analysis.mood && <Row label="Mood"><Tag text={analysis.mood} /></Row>}
                  {analysis.audienceFit && <Row label="Audience Fit"><p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>{analysis.audienceFit}</p></Row>}

                  {/* Vocal analysis */}
                  {analysis.vocalAnalysis?.performerCount && <Row label="Performers"><Tag text={analysis.vocalAnalysis.performerCount} /></Row>}
                  {analysis.vocalAnalysis?.vocalStructure && <Row label="Vocal Structure"><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{analysis.vocalAnalysis.vocalStructure}</span></Row>}
                  {analysis.vocalAnalysis?.detectedVoices && <Row label="Detected Voices"><span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{analysis.vocalAnalysis.detectedVoices}</span></Row>}
                  {analysis.vocalAnalysis?.primaryRangeCategory && (
                    <Row label="Primary Range">
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#7db4ff' }}>{analysis.vocalAnalysis.primaryRangeCategory}</span>
                      {analysis.vocalAnalysis.detectedRange && analysis.vocalAnalysis.detectedRange !== 'Unknown' && (
                        <span style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>{analysis.vocalAnalysis.detectedRange}</span>
                      )}
                    </Row>
                  )}
                  {analysis.vocalAnalysis?.secondaryRangeCategory && analysis.vocalAnalysis.secondaryRangeCategory !== 'None' && analysis.vocalAnalysis.secondaryRangeCategory !== 'Unknown' && (
                    <Row label="Secondary Range"><span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{analysis.vocalAnalysis.secondaryRangeCategory}</span></Row>
                  )}
                  {analysis.vocalAnalysis?.energyLevel && <Row label="Energy"><Tag text={analysis.vocalAnalysis.energyLevel} /></Row>}
                  {analysis.vocalAnalysis?.deliveryStyle && <Row label="Delivery"><Tag text={analysis.vocalAnalysis.deliveryStyle} /></Row>}
                  {analysis.vocalAnalysis?.notes && <Row label="Vocal Notes"><p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>{analysis.vocalAnalysis.notes}</p></Row>}

                  {/* Style match */}
                  {analysis.styleMatch?.bestContentStyleMatches && analysis.styleMatch.bestContentStyleMatches.length > 0 && (
                    <Row label="Content Styles"><TagList items={analysis.styleMatch.bestContentStyleMatches} accent /></Row>
                  )}
                  {analysis.styleMatch?.bestVisualDirectionMatches && analysis.styleMatch.bestVisualDirectionMatches.length > 0 && (
                    <Row label="Visual Direction"><TagList items={analysis.styleMatch.bestVisualDirectionMatches} /></Row>
                  )}
                  {analysis.styleMatch?.duetContentOpportunities && analysis.styleMatch.duetContentOpportunities.length > 0 && (
                    <Row label="Duet Opportunities"><TagList items={analysis.styleMatch.duetContentOpportunities} /></Row>
                  )}
                  {analysis.styleMatch?.reasoning && <Row label="Style Reasoning"><p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>{analysis.styleMatch.reasoning}</p></Row>}

                  {/* Content details */}
                  {analysis.themes && analysis.themes.length > 0 && <Row label="Themes"><TagList items={analysis.themes} /></Row>}
                  {analysis.contentAngles && analysis.contentAngles.length > 0 && <Row label="Content Angles"><TagList items={analysis.contentAngles} /></Row>}
                  {analysis.hookIdeas && analysis.hookIdeas.length > 0 && <Row label="Hook Ideas"><TagList items={analysis.hookIdeas} accent /></Row>}
                  {analysis.keywords && analysis.keywords.length > 0 && <Row label="Keywords"><TagList items={analysis.keywords} /></Row>}

                  {analysis.standoutLyrics && analysis.standoutLyrics.length > 0 && (
                    <Row label="Standout Lyrics">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {analysis.standoutLyrics.map((l, i) => (
                          <p key={i} style={{ margin: 0, fontSize: '13px', color: '#f0f4fa', fontStyle: 'italic', borderLeft: '2px solid rgba(90,154,245,0.3)', paddingLeft: '10px', lineHeight: '1.5' }}>
                            &ldquo;{l}&rdquo;
                          </p>
                        ))}
                      </div>
                    </Row>
                  )}

                  {analysis.recommendedShortClipMoments && analysis.recommendedShortClipMoments.length > 0 && (
                    <Row label="Clip Moments"><TagList items={analysis.recommendedShortClipMoments} /></Row>
                  )}
                  {analysis.brandSafetyNotes && <Row label="Brand Safety"><p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>{analysis.brandSafetyNotes}</p></Row>}
                  {analysis.overallNotes && <Row label="Notes"><p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>{analysis.overallNotes}</p></Row>}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ width: '150px', flexShrink: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: '2px' }}>
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

function Tag({ text }: { text: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500, background: 'rgba(139,124,245,0.08)', color: '#b0a4f5' }}>
      {text}
    </span>
  )
}

function TagList({ items, accent }: { items: string[]; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.map((item, i) => (
        <span key={i} style={{
          padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500,
          background: accent ? 'rgba(90,154,245,0.1)' : 'rgba(255,255,255,0.04)',
          color: accent ? '#7db4ff' : 'rgba(255,255,255,0.6)',
          border: `1px solid ${accent ? 'rgba(90,154,245,0.2)' : 'rgba(255,255,255,0.06)'}`,
        }}>
          {item}
        </span>
      ))}
    </div>
  )
}
