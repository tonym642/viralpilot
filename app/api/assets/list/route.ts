import { NextResponse } from 'next/server'
import { getProjectAssets } from '@/src/lib/assetHelpers'
import type { AssetCategory, AssetType, SourceStep } from '@/src/lib/assetTypes'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 })
  }

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
