import { supabase } from '@/lib/supabaseClient'

export default async function TestPage() {
  const { data, error } = await supabase
    .from('test')
    .select('*')

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase Test</h1>
      <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
    </div>
  )
}