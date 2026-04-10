// ---------------------------------------------------------------------------
// Project Asset types
// ---------------------------------------------------------------------------

export type AssetType = 'audio' | 'video' | 'image' | 'document' | 'text' | 'json'

export type AssetCategory =
  | 'source-audio'
  | 'transcript'
  | 'audio-analysis'
  | 'analysis'
  | 'generated-image'
  | 'generated-video'
  | 'caption'
  | 'schedule-export'
  | 'other'

export type SourceStep =
  | 'details'
  | 'track-analysis'
  | 'strategy'
  | 'content'
  | 'scheduler'
  | 'library'
  | 'system'

export type AssetStatus = 'uploaded' | 'processing' | 'ready' | 'failed'

export type ProjectAsset = {
  id: string
  project_id: string
  asset_name: string
  original_file_name: string
  asset_type: AssetType
  asset_category: AssetCategory
  mime_type: string
  storage_bucket: string | null
  storage_path: string | null
  file_size: number | null
  source_step: SourceStep
  status: AssetStatus
  metadata_json: Record<string, unknown> | null
  created_at: string
  updated_at: string
}
