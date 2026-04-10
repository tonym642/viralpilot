import { supabase } from '@/src/lib/supabaseClient'
import ContentEditor from './ContentEditor'

type PageProps = { params: Promise<{ id: string }> }

export default async function ContentPage({ params }: PageProps) {
  const { id } = await params

  // Load existing content items from DB
  const { data: dbItems } = await supabase
    .from('content_items')
    .select('*')
    .eq('project_id', id)
    .order('day', { ascending: true })

  return <ContentEditor projectId={id} dbItems={dbItems || []} />
}
