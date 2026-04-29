import { createSupabaseServer } from '@/src/lib/supabase-server'
import MusicOverview from '@/src/components/MusicOverview'
import AthleteLayout from '@/src/components/athlete/AthleteLayout'

type ProjectPageProps = {
  params: Promise<{ id: string }>
}

export default async function ProjectDashboardPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const [{ data: project, error }, { data: plans }, { data: contentItems }, { data: interviewRows }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('content_plans').select('*').eq('project_id', id).order('day', { ascending: true }),
    supabase.from('content_items').select('*').eq('project_id', id).order('day', { ascending: true }),
    supabase.from('project_interviews').select('*').eq('project_id', id).limit(1),
  ])

  if (error || !project) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>Project not found</h1>
      </div>
    )
  }

  const interview = interviewRows?.[0] ?? null

  // Athlete mode
  if (project.mode === 'Athlete') {
    const athleteData = interview?.structured_strategy as Record<string, unknown> | null
    return <AthleteLayout project={project} athleteData={athleteData as Record<string, unknown> | null} />
  }

  // Music mode — dashboard
  return (
    <MusicOverview
      project={project}
      interviewCompleted={!!interview?.interview_completed}
      strategyStatus={interview?.strategy_status || null}
      plans={plans || []}
      contentItems={contentItems || []}
    />
  )
}
