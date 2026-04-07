import { supabase } from '@/src/lib/supabaseClient'
import Link from 'next/link'
import ContentLibrary from '@/src/components/ContentLibrary'

type LibraryPageProps = {
  params: Promise<{ id: string }>
}

export default async function LibraryPage({ params }: LibraryPageProps) {
  const { id } = await params

  const [{ data: project, error }, { data: items }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase
      .from('content_items')
      .select('*')
      .eq('project_id', id)
      .order('day', { ascending: true }),
  ])

  if (error || !project) {
    return (
      <main className="page-shell">
        <h1 style={{ fontSize: '18px' }}>Project not found</h1>
        <Link href="/projects" className="vp-btn-primary" style={{ marginTop: '12px' }}>Back to Projects</Link>
      </main>
    )
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', overflow: 'hidden', padding: '16px 32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px', flexShrink: 0 }}>
        <Link
          href={`/projects/${id}`}
          className="vp-btn"
          style={{ height: '28px', padding: '0 10px', fontSize: '12px' }}
        >
          ← Back
        </Link>
        <h1 className="page-title" style={{ margin: 0 }}>{project.name}</h1>
        <span className="muted" style={{ fontSize: '13px' }}>Content Library</span>
      </div>

      <ContentLibrary initialItems={items || []} />
    </main>
  )
}
