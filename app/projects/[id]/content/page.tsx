import { createSupabaseServer } from '@/src/lib/supabase-server'
import ContentEditor from './ContentEditor'

type PageProps = { params: Promise<{ id: string }> }

export default async function ContentPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  // Load existing content items from DB
  const { data: dbItems } = await supabase
    .from('content_items')
    .select('*')
    .eq('project_id', id)
    .order('day', { ascending: true })

  return <ContentEditor projectId={id} dbItems={dbItems || []} />
}
