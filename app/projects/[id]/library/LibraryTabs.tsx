'use client'

import { useState } from 'react'
import ContentLibrary from '@/src/components/ContentLibrary'
import type { ProjectAsset } from '@/src/lib/assetTypes'

type ContentItem = {
  id: string
  project_id: string
  day: number
  title: string
  platform: string
  hook: string | null
  script: string | null
  caption: string | null
  hashtags: string | null
  visual_direction: string | null
  status: string
  created_at: string
}

const TABS = ['Content', 'Assets'] as const
type Tab = (typeof TABS)[number]

const ASSET_TYPE_FILTERS = ['All', 'audio', 'video', 'image', 'document', 'text'] as const

export default function LibraryTabs({
  initialItems,
  initialAssets,
}: {
  initialItems: ContentItem[]
  initialAssets: ProjectAsset[]
}) {
  const [active, setActive] = useState<Tab>('Content')
  const [assetFilter, setAssetFilter] = useState('All')
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(initialAssets[0]?.id ?? null)

  const filteredAssets = assetFilter === 'All'
    ? initialAssets
    : initialAssets.filter((a) => a.asset_type === assetFilter)

  const selectedAsset = initialAssets.find((a) => a.id === selectedAssetId) ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Top tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginBottom: '16px', flexShrink: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: active === tab ? 600 : 400,
              color: active === tab ? '#eef1f6' : 'rgba(255,255,255,0.55)',
              background: 'transparent',
              border: 'none',
              borderBottom: active === tab ? '2px solid #5a9af5' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              fontFamily: 'inherit',
              marginBottom: '-1px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content tab */}
      {active === 'Content' && (
        <ContentLibrary initialItems={initialItems} />
      )}

      {/* Assets tab */}
      {active === 'Assets' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Asset type filters */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexShrink: 0, flexWrap: 'wrap' }}>
            {ASSET_TYPE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setAssetFilter(f)}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: assetFilter === f ? 'rgba(90,154,245,0.4)' : 'rgba(255,255,255,0.08)',
                  background: assetFilter === f ? 'rgba(90,154,245,0.15)' : 'transparent',
                  color: assetFilter === f ? '#7db4ff' : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  textTransform: 'capitalize',
                }}
              >
                {f}
              </button>
            ))}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '4px' }}>
              {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Split: list + detail */}
          <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
            {/* Left: asset list */}
            <div
              style={{
                width: '40%',
                flexShrink: 0,
                overflowY: 'auto',
                scrollbarWidth: 'none',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
              }}
            >
              {filteredAssets.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No assets</p>
                </div>
              ) : (
                filteredAssets.map((asset) => {
                  const isSelected = selectedAssetId === asset.id
                  const created = new Date(asset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        background: isSelected ? 'rgba(90,154,245,0.1)' : 'transparent',
                        borderLeft: isSelected ? '2px solid #5a9af5' : '2px solid transparent',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span style={{ fontSize: '13px', opacity: 0.5, flexShrink: 0 }}>
                        {asset.asset_type === 'audio' ? '\u266B' : asset.asset_type === 'video' ? '\u25B6' : asset.asset_type === 'image' ? '\uD83D\uDCF7' : '\uD83D\uDCC4'}
                      </span>
                      <span style={{ flex: 1, fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#f0f4fa' : 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {asset.asset_name}
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500, flexShrink: 0 }}>
                        {asset.asset_category}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{created}</span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Right: detail */}
            <div
              style={{
                flex: 1,
                background: 'var(--surface-2)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {selectedAsset ? (
                <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: 'rgba(139,124,245,0.08)', color: '#b0a4f5', fontWeight: 500 }}>
                      {selectedAsset.asset_type}
                    </span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {selectedAsset.asset_category}
                    </span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: statusBg(selectedAsset.status), color: statusFg(selectedAsset.status), fontWeight: 600, textTransform: 'capitalize' }}>
                      {selectedAsset.status}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#f0f4fa' }}>{selectedAsset.asset_name}</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                    <DetailRow label="Source" value={selectedAsset.source_step} />
                    {selectedAsset.original_file_name && <DetailRow label="File" value={selectedAsset.original_file_name} />}
                    {selectedAsset.mime_type && <DetailRow label="Type" value={selectedAsset.mime_type} />}
                    {selectedAsset.file_size && <DetailRow label="Size" value={`${(selectedAsset.file_size / 1024 / 1024).toFixed(1)} MB`} />}
                    <DetailRow label="Created" value={new Date(selectedAsset.created_at).toLocaleString()} />
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>No asset selected</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Select an asset to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <span style={{ width: '80px', flexShrink: 0, fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  )
}

function statusBg(s: string) {
  if (s === 'ready') return 'rgba(74,222,128,0.1)'
  if (s === 'processing') return 'rgba(251,191,36,0.1)'
  if (s === 'failed') return 'rgba(239,68,68,0.1)'
  return 'rgba(90,154,245,0.1)'
}

function statusFg(s: string) {
  if (s === 'ready') return '#4ade80'
  if (s === 'processing') return '#fbbf24'
  if (s === 'failed') return '#ef4444'
  return '#7db4ff'
}
