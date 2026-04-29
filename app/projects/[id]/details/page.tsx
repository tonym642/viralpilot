import { createSupabaseServer } from '@/src/lib/supabase-server'
import DetailsEditor from './DetailsEditor'

type DetailsPageProps = { params: Promise<{ id: string }> }

export default async function DetailsPage({ params }: DetailsPageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data: interviewRows } = await supabase
    .from('project_interviews')
    .select('structured_strategy')
    .eq('project_id', id)
    .limit(1)

  const structured = interviewRows?.[0]?.structured_strategy as Record<string, unknown> | null
  const savedDetails = (structured?.project_details as Record<string, unknown>) ?? {}

  return (
    <DetailsEditor
      projectId={id}
      initialDetails={savedDetails}
    />
  )
}
