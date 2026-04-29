import { NextResponse } from 'next/server'
import { withAuth, requireProjectOwnership } from '@/src/lib/api-auth'
import { uploadProjectAsset } from '@/src/lib/assetHelpers'
import type { AssetType, AssetCategory, SourceStep } from '@/src/lib/assetTypes'

const ALLOWED_MIME: Record<string, AssetType> = {
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/ogg': 'audio',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/webp': 'image',
  'application/pdf': 'document',
}

export async function POST(request: Request) {
  try {
    const auth = await withAuth()
    if ('error' in auth) return auth.error
    const { user, supabase } = auth

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null
    const assetCategory = (formData.get('assetCategory') as AssetCategory) || 'other'
    const sourceStep = (formData.get('sourceStep') as SourceStep) || 'library'
    const assetName = (formData.get('assetName') as string) || file?.name || 'Untitled'

    if (!file || !projectId) {
      return NextResponse.json({ success: false, error: 'file and projectId are required' }, { status: 400 })
    }

    const ownershipError = await requireProjectOwnership(projectId, supabase)
    if (ownershipError) return ownershipError

    const mimeType = file.type
    const assetType = ALLOWED_MIME[mimeType]
    if (!assetType) {
      return NextResponse.json({ success: false, error: `Unsupported file type: ${mimeType}` }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const asset = await uploadProjectAsset({
      projectId,
      userId: user.id,
      file: buffer,
      assetName,
      originalFileName: file.name,
      mimeType,
      assetType,
      assetCategory,
      sourceStep,
    })

    return NextResponse.json({ success: true, asset })
  } catch (err) {
    console.error('Asset upload error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
