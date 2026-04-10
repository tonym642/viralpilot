import { supabase } from '@/src/lib/supabaseClient'

export default async function TestPage() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')

  return (
    <div style={{ padding: 20 }}>
      <h1>Projects</h1>
      <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
    </div>
  )
}