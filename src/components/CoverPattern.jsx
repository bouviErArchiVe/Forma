/** Motif de couverture de carnet (aperçu SVG). */
export default function CoverPattern({ tmpl, color }) {
  const c = color + '28'
  const L = []
  if (tmpl === 'lined') {
    for (let y = 22; y < 130; y += 18) L.push(<line key={y} x1={10} y1={y} x2={190} y2={y} stroke={c} strokeWidth={1} />)
  } else if (['grid5', 'plan', 'math', 'detail'].includes(tmpl)) {
    for (let x = 0; x < 200; x += 20) L.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={130} stroke={c} strokeWidth={.7} />)
    for (let y = 0; y < 130; y += 20) L.push(<line key={`h${y}`} x1={0} y1={y} x2={200} y2={y} stroke={c} strokeWidth={.7} />)
  } else if (tmpl === 'grid10') {
    for (let x = 0; x < 200; x += 30) L.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={130} stroke={c} strokeWidth={.7} />)
    for (let y = 0; y < 130; y += 30) L.push(<line key={`h${y}`} x1={0} y1={y} x2={200} y2={y} stroke={c} strokeWidth={.7} />)
  } else if (tmpl === 'dotted') {
    for (let x = 15; x < 200; x += 22) for (let y = 15; y < 130; y += 22) L.push(<circle key={`${x},${y}`} cx={x} cy={y} r={1.8} fill={c} />)
  } else if (tmpl === 'cornell') {
    L.push(<line key="v" x1={50} y1={10} x2={50} y2={115} stroke={c} strokeWidth={1.2} />)
    for (let y = 25; y < 115; y += 18) L.push(<line key={y} x1={55} y1={y} x2={190} y2={y} stroke={c} strokeWidth={1} />)
  } else if (tmpl === 'isometric') {
    for (let i = -200; i < 400; i += 28) {
      L.push(<line key={`a${i}`} x1={i} y1={0} x2={i + 130} y2={130} stroke={c} strokeWidth={.6} />)
      L.push(<line key={`b${i}`} x1={i} y1={0} x2={i - 130} y2={130} stroke={c} strokeWidth={.6} />)
    }
  } else if (['elevation', 'section'].includes(tmpl)) {
    for (let x = 0; x < 200; x += 28) L.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={130} stroke={c} strokeWidth={.6} />)
    for (let y = 0; y < 130; y += 28) L.push(<line key={`h${y}`} x1={0} y1={y} x2={200} y2={y} stroke={c} strokeWidth={.6} />)
    L.push(<rect key="tb" x={10} y={100} width={180} height={22} fill="none" stroke={c} strokeWidth={1} />)
    L.push(<rect key="b" x={5} y={5} width={190} height={120} fill="none" stroke={c} strokeWidth={1.5} />)
  } else if (tmpl === 'mindmap') {
    L.push(<circle key="c" cx={100} cy={65} r={22} fill="none" stroke={c} strokeWidth={2} />)
    ;[[40, 22], [160, 22], [180, 65], [155, 108], [45, 108], [20, 65]].forEach(([x, y], i) => {
      L.push(<line key={`b${i}`} x1={100} y1={65} x2={x} y2={y} stroke={c} strokeWidth={1} />)
      L.push(<circle key={`n${i}`} cx={x} cy={y} r={11} fill="none" stroke={c} strokeWidth={1.2} />)
    })
  } else if (tmpl === 'music') {
    for (let y = 20; y < 110; y += 38) for (let s = 0; s < 5; s++) L.push(<line key={`m${y}${s}`} x1={15} y1={y + s * 6} x2={185} y2={y + s * 6} stroke={c} strokeWidth={.9} />)
  }
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice">
      {L}
    </svg>
  )
}
