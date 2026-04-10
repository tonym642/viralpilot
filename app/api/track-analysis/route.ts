import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { uploadProjectAsset, createProjectAssetRecord, updateProjectAsset } from '@/src/lib/assetHelpers'
import type { AssetType } from '@/src/lib/assetTypes'

const MAX_SIZE = 50 * 1024 * 1024

const MIME_TO_TYPE: Record<string, AssetType> = {
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'video/mp4': 'video',
}

// ---------------------------------------------------------------------------
// Audio feature extraction (scaffold — expand with real library later)
// ---------------------------------------------------------------------------

type AudioFeatures = {
  tempoBpm: number | null
  energyProfile: string
  vocalIntensity: string
  likelyPerformerCount: string
  vocalStructureSignals: string[]
  pitchRangeEstimate: string
  likelyPrimaryRangeCategory: string
  likelySecondaryRangeCategory: string
  dynamicMoments: string[]
  likelyHookMoments: string[]
  durationSeconds: number | null
  notes: string
}

function extractAudioFeatures(buffer: Buffer, mimeType: string, fileName: string): AudioFeatures {
  // Scaffold: real audio analysis (e.g. via ffprobe, essentia, or librosa bindings)
  // would extract BPM, pitch, energy, etc. For now, we provide the structure
  // and let GPT do heavier inference from lyrics + genre context.
  const sizeMB = buffer.length / 1024 / 1024
  const isVideo = mimeType.startsWith('video/')

  return {
    tempoBpm: null,
    energyProfile: 'Unknown',
    vocalIntensity: 'Unknown',
    likelyPerformerCount: 'Unknown',
    vocalStructureSignals: [],
    pitchRangeEstimate: 'Unknown',
    likelyPrimaryRangeCategory: 'Unknown',
    likelySecondaryRangeCategory: 'Unknown',
    dynamicMoments: [],
    likelyHookMoments: [],
    durationSeconds: null,
    notes: `Source: ${fileName} (${sizeMB.toFixed(1)} MB, ${isVideo ? 'video' : 'audio'}). Audio feature extraction is scaffolded — expand with a real analysis library for precise BPM, pitch, and energy data.`,
  }
}

// ---------------------------------------------------------------------------
// GPT prompt — uses lyrics + audio features, no transcript
// ---------------------------------------------------------------------------

function buildAnalysisPrompt(lyrics: string, audioFeatures: AudioFeatures, projectMeta: Record<string, string>) {
  const metaBlock = [
    projectMeta.genre && `Genre: ${projectMeta.genre}`,
    projectMeta.language && `Language: ${projectMeta.language}`,
    projectMeta.contentTone && `Tone: ${projectMeta.contentTone}`,
    projectMeta.targetAudience && `Target audience: ${projectMeta.targetAudience}`,
  ].filter(Boolean).join('\n')

  return `You are a music content strategist and vocal analyst. You are given:
1. Song lyrics
2. Audio feature data extracted from the track
3. Project metadata

Analyze everything and return ONLY valid JSON with this exact structure:

{
  "summary": "Brief summary of the song's content and message",
  "themes": ["theme1", "theme2"],
  "mood": "The overall mood/vibe",
  "audienceFit": "Who this song appeals to",
  "contentAngles": ["angle1", "angle2"],
  "hookIdeas": ["hook1", "hook2"],
  "keywords": ["keyword1", "keyword2"],
  "standoutLyrics": ["lyric1", "lyric2"],
  "recommendedShortClipMoments": ["moment1", "moment2"],
  "brandSafetyNotes": "Any content warnings or brand safety considerations",
  "overallNotes": "Additional strategic notes for content creation",
  "vocalAnalysis": {
    "performerCount": "Solo | Duet | Group | Unknown",
    "vocalStructure": "Solo | Alternating duet | Call-and-response duet | Shared chorus duet | Group vocal | Unknown",
    "detectedVoices": "Description of vocal personas inferred from lyrics and audio cues",
    "primaryRangeCategory": "Bass | Baritone | Tenor | Alto | Mezzo-Soprano | Soprano | Unknown",
    "secondaryRangeCategory": "Bass | Baritone | Tenor | Alto | Mezzo-Soprano | Soprano | None | Unknown",
    "detectedRange": "Approximate vocal range or Unknown",
    "energyLevel": "Low | Medium | High | Mixed",
    "deliveryStyle": "Smooth | Aggressive | Melodic | Rhythmic | Spoken | Emotional | Hybrid",
    "notes": "Short explanation of vocal characteristics"
  },
  "styleMatch": {
    "bestContentStyleMatches": ["e.g. Performance-led", "Chemistry-led"],
    "bestVisualDirectionMatches": ["e.g. Intimate close-ups", "Neon nightlife"],
    "duetContentOpportunities": ["e.g. his/her POV clips"],
    "reasoning": "Why these styles fit"
  }
}

INSTRUCTIONS:
- Use the lyrics to understand themes, structure, performer count, and lyrical style.
- Use the audio features to inform energy, tempo, and vocal characteristics.
- If audio features show Unknown, infer carefully from lyrics and genre context.
- Estimate vocal range categories cautiously. Use Unknown if unclear.
- For styleMatch, recommend content styles matching the song profile.
- If duet is likely, include duet-specific opportunities. If solo, return empty array for duetContentOpportunities.
- You do NOT have raw audio — use the provided data. Be probabilistic, not certain.

Return ONLY the JSON object. No markdown, no explanation.

---

PROJECT METADATA:
${metaBlock || 'None provided'}

AUDIO FEATURES:
${JSON.stringify(audioFeatures, null, 2)}

LYRICS:
${lyrics}`
}

// ---------------------------------------------------------------------------
// Load lyrics + project meta from Details
// ---------------------------------------------------------------------------

async function loadProjectDetails(projectId: string) {
  const { data } = await supabaseAdmin
    .from('project_interviews')
    .select('structured_strategy')
    .eq('project_id', projectId)
    .limit(1)

  const ss = (data?.[0]?.structured_strategy as Record<string, unknown>) ?? {}
  const details = (ss?.project_details as Record<string, Record<string, unknown>>) ?? {}
  const info = details.info ?? {}
  const questions = details.questions ?? {}
  const lyrics = details.lyrics ?? {}

  return {
    lyricsText: (lyrics.lyricsText as string) ?? '',
    genre: (info.genre as string) ?? '',
    language: (info.language as string) ?? '',
    contentTone: (questions.contentTone as string) ?? '',
    targetAudience: Array.isArray(questions.targetAudience)
      ? (questions.targetAudience as string[]).join(', ')
      : (questions.targetAudience as string) ?? '',
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 })
    }
    if (!file) {
      return NextResponse.json({ success: false, error: 'file is required' }, { status: 400 })
    }

    const assetType = MIME_TO_TYPE[file.type]
    if (!assetType) {
      return NextResponse.json({ success: false, error: `Unsupported file type: ${file.type}. Use MP3, MP4, or WAV.` }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum 50MB.' }, { status: 400 })
    }

    // ── Load lyrics from Details ──
    const details = await loadProjectDetails(projectId)
    if (!details.lyricsText.trim()) {
      return NextResponse.json({ success: false, error: 'Lyrics are required. Add them in the Details page first.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // ── Step 1: Upload source file ──
    const sourceAsset = await uploadProjectAsset({
      projectId,
      file: buffer,
      assetName: file.name,
      originalFileName: file.name,
      mimeType: file.type,
      assetType,
      assetCategory: 'source-audio',
      sourceStep: 'track-analysis',
    })
    await updateProjectAsset(projectId, sourceAsset.id, { status: 'processing' })

    // ── Step 2: Extract audio features ──
    const audioFeatures = extractAudioFeatures(buffer, file.type, file.name)

    // Save audio-analysis asset
    const audioAnalysisAsset = await createProjectAssetRecord({
      projectId,
      assetName: `Audio Features — ${file.name}`,
      assetType: 'json',
      assetCategory: 'audio-analysis',
      sourceStep: 'track-analysis',
      status: 'ready',
      metadataJson: audioFeatures as unknown as Record<string, unknown>,
    })

    // ── Step 3: GPT final analysis ──
    let analysis: Record<string, unknown> | null = null

    try {
      const prompt = buildAnalysisPrompt(details.lyricsText, audioFeatures, {
        genre: details.genre,
        language: details.language,
        contentTone: details.contentTone,
        targetAudience: details.targetAudience,
      })

      const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: prompt },
          ],
          temperature: 0.7,
        }),
      })

      if (!gptRes.ok) {
        console.error('GPT error:', await gptRes.text())
      } else {
        const gptData = await gptRes.json()
        const raw = gptData.choices?.[0]?.message?.content || ''
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        try {
          analysis = JSON.parse(cleaned)
        } catch {
          console.error('GPT JSON parse failed, raw:', raw)
        }
      }
    } catch (err) {
      console.error('GPT error:', err)
    }

    // ── Step 4: Save final analysis asset ──
    let analysisAsset = null
    if (analysis) {
      analysisAsset = await createProjectAssetRecord({
        projectId,
        assetName: `Track Analysis — ${file.name}`,
        assetType: 'json',
        assetCategory: 'analysis',
        sourceStep: 'track-analysis',
        status: 'ready',
        metadataJson: analysis,
      })
    }

    await updateProjectAsset(projectId, sourceAsset.id, { status: 'ready' })

    return NextResponse.json({
      success: true,
      sourceAsset,
      audioAnalysisAsset,
      analysisAsset,
      audioFeatures,
      analysis,
    })
  } catch (err) {
    console.error('Track analysis error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Track analysis failed' },
      { status: 500 },
    )
  }
}
