import { supabase } from '@/src/lib/supabaseClient'
import Link from 'next/link'
import ProjectTabs from '@/src/components/ProjectTabs'
import ProjectHeader from '@/src/components/ProjectHeader'
import AthleteLayout from '@/src/components/athlete/AthleteLayout'

type ProjectPageProps = {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params

  const [{ data: project, error }, { data: messages }, { data: plans }, { data: contentItems }, { data: interviewRows }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase
      .from('project_messages')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('content_plans')
      .select('*')
      .eq('project_id', id)
      .order('day', { ascending: true }),
    supabase
      .from('content_items')
      .select('*')
      .eq('project_id', id)
      .order('day', { ascending: true }),
    supabase
      .from('project_interviews')
      .select('*')
      .eq('project_id', id)
      .limit(1),
  ])

  const interview = interviewRows?.[0] ?? null
  const planGeneratedAt = plans && plans.length > 0 ? plans[0].created_at : null

  if (error || !project) {
    return (
      <main className="page-shell">
        <h1 style={{ fontSize: '18px' }}>Project not found</h1>
        <Link href="/projects" className="vp-btn-primary" style={{ marginTop: '12px' }}>Back to Projects</Link>
      </main>
    )
  }

  // Athlete mode — dedicated layout
  if (project.mode === 'Athlete') {
    const athleteData = interview?.structured_strategy as Record<string, unknown> | null
    return (
      <main className="vp-project-detail" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', overflow: 'hidden', background: 'var(--surface-0)' }}>
        <div className="vp-project-detail-header" style={{ padding: '12px 24px 0', flexShrink: 0 }}>
          <ProjectHeader project={project} />
        </div>
        <AthleteLayout
          project={project}
          athleteData={athleteData as Record<string, unknown> | null}
        />
      </main>
    )
  }

  return (
    <main className="vp-project-detail" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', overflow: 'hidden', padding: '16px 32px 24px', background: 'var(--surface-0)' }}>
      <ProjectHeader project={project} />

      <ProjectTabs
        project={project}
        plans={plans || []}
        messages={messages || []}
        contentItems={contentItems || []}
        interviewCompleted={!!interview?.interview_completed}
        interviewData={interview}
        strategyUpdatedAt={interview?.updated_at || interview?.created_at || null}
        planGeneratedAt={planGeneratedAt}
        strategyStatus={interview?.strategy_status || null}
      />
    </main>
  )
}
