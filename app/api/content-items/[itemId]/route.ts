import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

type RouteParams = {
  params: Promise<{ itemId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { itemId } = await params
  const body = await request.json()

  const allowed = ['title', 'platform', 'hook', 'script', 'caption', 'hashtags', 'visual_direction']
  const updates: Record<string, string> = {}
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: 'No valid fields to update' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('content_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single()

  if (error) {
    console.error('Update content item error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, item: data })
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { itemId } = await params

  const { error } = await supabaseAdmin
    .from('content_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Delete content item error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
