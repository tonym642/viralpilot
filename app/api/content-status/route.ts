import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export async function POST(request: Request) {
  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json(
      { success: false, error: 'id and status are required' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
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
