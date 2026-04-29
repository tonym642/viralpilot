import { NextResponse } from 'next/server'
import { withAuth } from '@/src/lib/api-auth'

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json(
      { success: false, error: 'id and status are required' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('content_items')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update status' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
