import { supabase } from '@/src/lib/supabaseClient'
import LibraryTabs from './LibraryTabs'
import type { ProjectAsset } from '@/src/lib/assetTypes'

type LibraryPageProps = { params: Promise<{ id: string }> }

export default async function LibraryPage({ params }: LibraryPageProps) {
  const { id } = await params

  const [{ data: items }, { data: interviewRows }] = await Promise.all([
    supabase.from('content_items').select('*').eq('project_id', id).order('day', { ascending: true }),
    supabase.from('project_interviews').select('structured_strategy').eq('project_id', id).limit(1),
  ])

  const structured = interviewRows?.[0]?.structured_strategy as Record<string, unknown> | null
  const assets = ((structured?.project_assets ?? []) as ProjectAsset[])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return <LibraryTabs initialItems={items || []} initialAssets={assets} />
}
