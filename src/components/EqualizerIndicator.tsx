export default function EqualizerIndicator({ size = 14 }: { size?: number }) {
  const barWidth = Math.max(2, Math.round(size * 0.14))
  const gap = Math.max(1, Math.round(size * 0.07))

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap,
        height: size,
        flexShrink: 0,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            borderRadius: barWidth / 2,
            background: 'rgba(90, 154, 245, 0.38)',
            animation: `eq-bar 1.4s ease-in-out ${i * 0.17}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes eq-bar {
          0%   { height: 20%; }
          50%  { height: 80%; }
          100% { height: 35%; }
        }
      `}</style>
    </div>
  )
}
