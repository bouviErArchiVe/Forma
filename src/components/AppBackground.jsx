import { GLOBAL_BG_OPACITY } from '@/config/appearance'

/** Couche de fond global (photo ou filigrane SVG) */
export default function AppBackground({ background, accent }) {
  if (!background) return null

  if (background.kind === 'custom') {
    return (
      <div
        className="forma-app-bg forma-app-bg--custom"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: GLOBAL_BG_OPACITY,
          overflow: 'hidden',
        }}
      >
        <img
          src={background.src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    )
  }

  const svg = background.bg.svg.replace(
    '<svg ',
    '<svg style="width:100%;height:100%;position:absolute;top:0;left:0;" preserveAspectRatio="xMidYMid slice" ',
  )

  return (
    <div
      className="forma-app-bg forma-app-bg--preset"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: GLOBAL_BG_OPACITY,
        color: accent,
        overflow: 'hidden',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
