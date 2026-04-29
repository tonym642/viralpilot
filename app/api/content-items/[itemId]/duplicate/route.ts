import { NextResponse } from 'next/server'
import { withAuth } from '@/src/lib/api-auth'

type RouteParams = {
  params: Promise<{ itemId: string }>
}

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const { itemId } = await params

  const { data: original, error: fetchError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (fetchError || !original) {
    console.error('Duplicate fetch error:', fetchError)
    return NextResponse.json(
      { success: false, error: 'Item not found' },
      { status: 404 }
    )
  }

  const { data: newItem, error: insertError } = await supabase
    .from('content_items')
    .insert({
      project_id: original.project_id,
      day: original.day,
      title: original.title,
      platform: original.platform,
      hook: original.hook,
      script: original.script,
      caption: original.caption,
      hashtags: original.hashtags,
      visual_direction: original.visual_direction,
      status: 'draft',
    })
    .select()
    .single()

  if (insertError) {
    console.error('Duplicate insert error:', insertError)
    return NextResponse.json(
      { success: false, error: insertError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, item: newItem })
}
