import { NextResponse } from 'next/server'
import { deleteProjectAsset } from '@/src/lib/assetHelpers'

export async function POST(request: Request) {
  const { projectId, assetId } = await request.json()

  if (!projectId || !assetId) {
    return NextResponse.json({ success: false, error: 'projectId and assetId are required' }, { status: 400 })
  }

  const deleted = await deleteProjectAsset(projectId, assetId)

  if (!deleted) {
    return NextResponse.json({ success: false, error: 'Asset not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
