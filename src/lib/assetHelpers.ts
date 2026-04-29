// ---------------------------------------------------------------------------
// Project Asset helpers — server-side (use supabaseAdmin)
// ---------------------------------------------------------------------------

import { supabaseAdmin } from './supabaseAdmin'
import type { ProjectAsset, AssetType, AssetCategory, SourceStep, AssetStatus } from './assetTypes'

const BUCKET = 'project-assets'

// ---------------------------------------------------------------------------
// Filename sanitization
// ---------------------------------------------------------------------------

function safeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/__+/g, '_')
    .toLowerCase()
}

function buildStoragePath(
  projectId: string,
  category: AssetCategory,
  fileName: string,
): string {
  const ts = Date.now()
  return `projects/${projectId}/${category}/${ts}-${safeFileName(fileName)}`
}

// ---------------------------------------------------------------------------
// Read/write asset records via project_interviews.structured_strategy
// ---------------------------------------------------------------------------

async function getInterviewRow(projectId: string) {
  const { data } = await supabaseAdmin
    .from('project_interviews')
    .select('id, structured_strategy')
    .eq('project_id', projectId)
    .limit(1)
  return data?.[0] ?? null
}

async function ensureInterviewRow(projectId: string, userId: string) {
  let row = await getInterviewRow(projectId)
  if (!row) {
    const { data } = await supabaseAdmin
      .from('project_interviews')
      .insert({ project_id: projectId, user_id: userId, structured_strategy: {} })
      .select('id, structured_strategy')
      .single()
    row = data
  }
  return row!
}

function readAssets(structured: Record<string, unknown>): ProjectAsset[] {
  return (structured?.project_assets as ProjectAsset[]) ?? []
}

async function writeAssets(rowId: string, structured: Record<string, unknown>, assets: ProjectAsset[]) {
  const merged = { ...structured, project_assets: assets }
  await supabaseAdmin
    .from('project_interviews')
    .update({ structured_strategy: merged })
    .eq('id', rowId)
}

// ---------------------------------------------------------------------------
// 1. Upload a file and create an asset record
// ---------------------------------------------------------------------------

export async function uploadProjectAsset({
  projectId,
  userId,
  file,
  assetName,
  originalFileName,
  mimeType,
  assetType,
  assetCategory,
  sourceStep,
  metadataJson,
}: {
  projectId: string
  userId: string
  file: Buffer | Uint8Array
  assetName: string
  originalFileName: string
  mimeType: string
  assetType: AssetType
  assetCategory: AssetCategory
  sourceStep: SourceStep
  metadataJson?: Record<string, unknown>
}): Promise<ProjectAsset> {

  const storagePath = buildStoragePath(projectId, assetCategory, originalFileName)

  // Upload to storage
  const { error: uploadErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: mimeType, upsert: false })

  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

  const asset: ProjectAsset = {
    id: crypto.randomUUID(),
    project_id: projectId,
    asset_name: assetName,
    original_file_name: originalFileName,
    asset_type: assetType,
    asset_category: assetCategory,
    mime_type: mimeType,
    storage_bucket: BUCKET,
    storage_path: storagePath,
    file_size: file.length,
    source_step: sourceStep,
    status: 'uploaded',
    metadata_json: metadataJson ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Save record
  const row = await ensureInterviewRow(projectId, userId)
  const existing = readAssets(row.structured_strategy as Record<string, unknown>)
  existing.push(asset)
  await writeAssets(row.id, row.structured_strategy as Record<string, unknown>, existing)

  return asset
}

// ---------------------------------------------------------------------------
// 2. Create a non-file asset record (text, analysis, transcript, etc.)
// ---------------------------------------------------------------------------

export async function createProjectAssetRecord({
  projectId,
  userId,
  assetName,
  assetType,
  assetCategory,
  sourceStep,
  status = 'ready',
  metadataJson,
}: {
  projectId: string
  userId: string
  assetName: string
  assetType: AssetType
  assetCategory: AssetCategory
  sourceStep: SourceStep
  status?: AssetStatus
  metadataJson?: Record<string, unknown>
}): Promise<ProjectAsset> {
  const asset: ProjectAsset = {
    id: crypto.randomUUID(),
    project_id: projectId,
    asset_name: assetName,
    original_file_name: '',
    asset_type: assetType,
    asset_category: assetCategory,
    mime_type: '',
    storage_bucket: null,
    storage_path: null,
    file_size: null,
    source_step: sourceStep,
    status,
    metadata_json: metadataJson ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const row = await ensureInterviewRow(projectId, userId)
  const existing = readAssets(row.structured_strategy as Record<string, unknown>)
  existing.push(asset)
  await writeAssets(row.id, row.structured_strategy as Record<string, unknown>, existing)

  return asset
}

// ---------------------------------------------------------------------------
// 3. Get project assets (with optional filters)
// ---------------------------------------------------------------------------

export async function getProjectAssets(
  projectId: string,
  filters?: { category?: AssetCategory; type?: AssetType; sourceStep?: SourceStep },
): Promise<ProjectAsset[]> {
  const row = await getInterviewRow(projectId)
  if (!row) return []

  let assets = readAssets(row.structured_strategy as Record<string, unknown>)

  if (filters?.category) assets = assets.filter((a) => a.asset_category === filters.category)
  if (filters?.type) assets = assets.filter((a) => a.asset_type === filters.type)
  if (filters?.sourceStep) assets = assets.filter((a) => a.source_step === filters.sourceStep)

  return assets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// ---------------------------------------------------------------------------
// 4. Get single asset by ID
// ---------------------------------------------------------------------------

export async function getProjectAssetById(
  projectId: string,
  assetId: string,
): Promise<ProjectAsset | null> {
  const assets = await getProjectAssets(projectId)
  return assets.find((a) => a.id === assetId) ?? null
}

// ---------------------------------------------------------------------------
// 5. Update asset status or metadata
// ---------------------------------------------------------------------------

export async function updateProjectAsset(
  projectId: string,
  assetId: string,
  updates: Partial<Pick<ProjectAsset, 'status' | 'metadata_json' | 'asset_name'>>,
): Promise<ProjectAsset | null> {
  const row = await getInterviewRow(projectId)
  if (!row) return null

  const assets = readAssets(row.structured_strategy as Record<string, unknown>)
  const idx = assets.findIndex((a) => a.id === assetId)
  if (idx === -1) return null

  const updated = {
    ...assets[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  assets[idx] = updated
  await writeAssets(row.id, row.structured_strategy as Record<string, unknown>, assets)

  return updated
}

// ---------------------------------------------------------------------------
// 6. Delete asset (removes from storage + record)
// ---------------------------------------------------------------------------

export async function deleteProjectAsset(
  projectId: string,
  assetId: string,
): Promise<boolean> {
  const row = await getInterviewRow(projectId)
  if (!row) return false

  const assets = readAssets(row.structured_strategy as Record<string, unknown>)
  const asset = assets.find((a) => a.id === assetId)
  if (!asset) return false

  // Remove from storage if it's a file-based asset
  if (asset.storage_bucket && asset.storage_path) {
    await supabaseAdmin.storage.from(asset.storage_bucket).remove([asset.storage_path])
  }

  const filtered = assets.filter((a) => a.id !== assetId)
  await writeAssets(row.id, row.structured_strategy as Record<string, unknown>, filtered)

  return true
}

// ---------------------------------------------------------------------------
// 7. Generate signed URL for a file asset
// ---------------------------------------------------------------------------

export async function getAssetSignedUrl(
  asset: ProjectAsset,
  expiresInSeconds = 3600,
): Promise<string | null> {
  if (!asset.storage_bucket || !asset.storage_path) return null

  const { data, error } = await supabaseAdmin.storage
    .from(asset.storage_bucket)
    .createSignedUrl(asset.storage_path, expiresInSeconds)

  if (error) return null
  return data.signedUrl
}
