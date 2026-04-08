type ProjectAvatarProps = {
  name: string
  mode?: string | null
  coverImage?: string | null
  size?: number
}

function MusicIcon({ size }: { size: number }) {
  const s = Math.round(size * 0.48)
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function AthleteIcon({ size }: { size: number }) {
  const s = Math.round(size * 0.48)
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.23A2 2 0 0 0 4 21h16a2 2 0 0 0 1.9-2.77l-2.49-8.77A2 2 0 0 0 17.5 8z" />
      <path d="m12 10 0 4" />
      <path d="m9 21 3-7 3 7" />
    </svg>
  )
}

export default function ProjectAvatar({ name, mode, coverImage, size = 28 }: ProjectAvatarProps) {
  const radius = Math.round(size * 0.22)

  // Future: show cover image if available
  if (coverImage) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <img
          src={coverImage}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    )
  }

  // Mode icon + color
  const hasIcon = mode === 'Music' || mode === 'Athlete'

  const gradientMap: Record<string, string> = {
    Music: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    Athlete: 'linear-gradient(135deg, #f59e0b, #d97706)',
  }
  const bg = mode && gradientMap[mode] ? gradientMap[mode] : 'linear-gradient(135deg, #5a9af5, #8b7cf5)'

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.42),
      fontWeight: 700,
      color: '#fff',
      flexShrink: 0,
    }}>
      {mode === 'Music' && <MusicIcon size={size} />}
      {mode === 'Athlete' && <AthleteIcon size={size} />}
      {!hasIcon && name.charAt(0).toUpperCase()}
    </div>
  )
}
