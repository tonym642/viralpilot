import { createSupabaseServer } from '@/src/lib/supabase-server'
import TrackAnalysisEditor from './TrackAnalysisEditor'
import type { ProjectAsset } from '@/src/lib/assetTypes'

type PageProps = { params: Promise<{ id: string }> }

export default async function TrackAnalysisPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data: interviewRows } = await supabase
    .from('project_interviews')
    .select('structured_strategy')
    .eq('project_id', id)
    .limit(1)

  const structured = interviewRows?.[0]?.structured_strategy as Record<string, unknown> | null
  const allAssets = ((structured?.project_assets ?? []) as ProjectAsset[])

  // Details lyrics
  const details = (structured?.project_details as Record<string, Record<string, string>> | null) ?? {}
  const hasLyrics = !!(details.lyrics?.lyricsText?.trim())

  // Existing assets
  const sourceAudio = allAssets.find(
    (a) => a.asset_category === 'source-audio' && a.source_step === 'track-analysis',
  ) ?? null

  const audioAnalysis = allAssets.find(
    (a) => a.asset_category === 'audio-analysis' && a.source_step === 'track-analysis',
  ) ?? null

  const analysis = allAssets.find(
    (a) => a.asset_category === 'analysis' && a.source_step === 'track-analysis',
  ) ?? null

  return (
    <TrackAnalysisEditor
      projectId={id}
      hasLyrics={hasLyrics}
      existingSource={sourceAudio}
      existingAudioAnalysis={audioAnalysis}
      existingAnalysis={analysis}
    />
  )
}
