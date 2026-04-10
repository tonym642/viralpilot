import { supabase } from '@/src/lib/supabaseClient'
import StrategyEditor from './StrategyEditor'

type PageProps = { params: Promise<{ id: string }> }

export default async function StrategyPage({ params }: PageProps) {
  const { id } = await params

  const { data: interviewRows } = await supabase
    .from('project_interviews')
    .select('structured_strategy')
    .eq('project_id', id)
    .limit(1)

  const ss = (interviewRows?.[0]?.structured_strategy as Record<string, unknown>) ?? {}
  const savedStrategy = (ss.project_strategy as Record<string, unknown>) ?? null

  // Check if details exist
  const details = (ss.project_details as Record<string, Record<string, string>>) ?? {}
  const hasDetails = !!(details.info?.songTitle?.trim())

  // Check if track analysis exists
  const assets = ((ss.project_assets ?? []) as Record<string, unknown>[])
  const hasTrackAnalysis = assets.some(
    (a) => a.asset_category === 'analysis' && a.source_step === 'track-analysis',
  )

  return (
    <StrategyEditor
      projectId={id}
      initialStrategy={savedStrategy}
      hasDetails={hasDetails}
      hasTrackAnalysis={hasTrackAnalysis}
    />
  )
}
