import { NextResponse } from 'next/server'
import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'
import { getProjectAssets } from '@/src/lib/assetHelpers'
import type { AssetCategory, AssetType, SourceStep } from '@/src/lib/assetTypes'

export async function GET(request: Request) {
  const auth = await withAuth()
  if ('error' in auth) return auth.error
  const { supabase } = auth

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 })
  }

  const ownershipError = await requireProjectOwnership(projectId, supabase)
  if (ownershipError) return ownershipError

  const filters: { category?: AssetCategory; type?: AssetType; sourceStep?: SourceStep } = {}
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const sourceStep = searchParams.get('sourceStep')
  if (category) filters.category = category as AssetCategory
  if (type) filters.type = type as AssetType
  if (sourceStep) filters.sourceStep = sourceStep as SourceStep

  const assets = await getProjectAssets(projectId, Object.keys(filters).length > 0 ? filters : undefined)

  return NextResponse.json({ success: true, assets })
}
