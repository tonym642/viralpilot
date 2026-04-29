import { createSupabaseServer } from '@/src/lib/supabase-server'
import ProjectInternalLayout from '@/src/components/ProjectInternalLayout'
import type { WorkflowCompletion } from '@/src/lib/workflowConfig'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const [{ data: project }, { data: interviewRows }, { data: contentItems }] = await Promise.all([
    supabase.from('projects').select('id, name, mode, type').eq('id', id).single(),
    supabase.from('project_interviews').select('structured_strategy').eq('project_id', id).limit(1),
    supabase.from('content_items').select('id').eq('project_id', id).limit(1),
  ])

  if (!project) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>Project not found</h1>
      </div>
    )
  }

  const structured = interviewRows?.[0]?.structured_strategy as Record<string, unknown> | null
  const details = (structured?.project_details as Record<string, Record<string, string>> | null) ?? {}
  const assets = ((structured?.project_assets ?? []) as Record<string, unknown>[])

  // Compute workflow completion
  const hasDetails = !!(details.info?.songTitle?.trim() && details.info?.genre?.trim())
  const hasTrackAnalysis = assets.some((a) => a.asset_category === 'analysis' && a.source_step === 'track-analysis')
  const hasStrategy = !!(structured?.project_strategy)
  const hasContent = (contentItems?.length ?? 0) > 0
  const hasScheduler = false // TODO: wire when scheduler data exists

  const completion: WorkflowCompletion = {
    details: hasDetails,
    trackAnalysis: hasTrackAnalysis,
    strategy: hasStrategy,
    content: hasContent,
    scheduler: hasScheduler,
  }

  return (
    <ProjectInternalLayout
      project={project}
      genre={details.info?.genre}
      language={details.info?.language}
      completion={completion}
    >
      {children}
    </ProjectInternalLayout>
  )
}
