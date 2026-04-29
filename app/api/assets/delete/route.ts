import { NextResponse } from 'next/server'
import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'
import { deleteProjectAsset } from '@/src/lib/assetHelpers'

export async function POST(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const { projectId, assetId } = await request.json()

  if (!projectId || !assetId) {
    return NextResponse.json({ success: false, error: 'projectId and assetId are required' }, { status: 400 })
  }

  const ownershipError = await requireProjectOwnership(projectId, supabase)
  if (ownershipError) return ownershipError

  const deleted = await deleteProjectAsset(projectId, assetId)

  if (!deleted) {
    return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
