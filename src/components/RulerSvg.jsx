import { useMemo } from 'react'
import { buildRulerTicks } from '@/lib/ruler'

export default function RulerSvg({
  widthPx,
  unitSys,
  scale,
  zoom = 1,
  strokeColor = '#888',
}) {
  const { ticks, labelScale } = useMemo(
    () => buildRulerTicks({ widthPx, unitSys, scale, zoom }),
    [widthPx, unitSys, scale, zoom],
  )

  const tickLen = (kind) => {
    if (kind === 'major') return 19
    if (kind === 'med') return 14
    return 7
  }

  const fontSize = 7

  return (
    <svg width={widthPx} height={24} style={{ marginLeft: 22, display: 'block', pointerEvents: 'none' }}>
      {ticks.map((tick, i) => {
        const len = tickLen(tick.kind)
        const sw = tick.kind === 'major' ? 1 : 0.5
        const lx = tick.x + 2
        const ly = 8
        return (
          <g key={`${tick.x}-${tick.kind}-${i}`}>
            <line
              x1={tick.x}
              y1={24}
              x2={tick.x}
              y2={24 - len}
              stroke={strokeColor}
              strokeWidth={sw}
            />
            {tick.label && (
              <text
                x={lx}
                y={ly}
                fontSize={fontSize}
                fill={strokeColor}
                fontFamily="monospace"
                transform={labelScale !== 1 ? `translate(${lx},${ly}) scale(${labelScale}) translate(${-lx},${-ly})` : undefined}
              >
                {tick.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
