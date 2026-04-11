// src/components/SkillRadar.jsx
export default function SkillRadar({ skills = [] }) {
  const SIZE = 200
  const CENTER = SIZE / 2
  const RADIUS = 80
  const LABELS = ["listening", "speaking", "reading", "writing", "grammar", "vocabulary"]

  const scoreMap = {}
  skills.forEach(s => { scoreMap[s.habilidad] = s.score })

  const toXY = (angle, value, maxR = RADIUS) => {
    const r = (value / 100) * maxR
    const rad = (angle * Math.PI) / 180
    return {
      x: CENTER + r * Math.cos(rad - Math.PI / 2),
      y: CENTER + r * Math.sin(rad - Math.PI / 2)
    }
  }

  const step = 360 / LABELS.length
  const points = LABELS.map((label, i) => toXY(i * step, scoreMap[label] || 0))
  const polygon = points.map(p => `${p.x},${p.y}`).join(" ")

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-xs mx-auto">
      {/* Círculos concéntricos (33%, 66%, 100%) */}
      {[33, 66, 100].map(level => (
        <circle
          key={level}
          cx={CENTER}
          cy={CENTER}
          r={(level / 100) * RADIUS}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
      ))}

      {/* Líneas radiales */}
      {LABELS.map((_, i) => {
        const end = toXY(i * step, 100)
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        )
      })}

      {/* Polígono relleno (área de habilidad) */}
      <polygon
        points={polygon}
        fill="#2471A3"
        fillOpacity="0.25"
        stroke="#2471A3"
        strokeWidth="2"
      />

      {/* Puntos en cada vértice */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2471A3" stroke="white" strokeWidth="1.5" />
      ))}

      {/* Etiquetas de habilidades */}
      {LABELS.map((label, i) => {
        const pos = toXY(i * step, 118)
        return (
          <text
            key={label}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="#4B5563"
            fontFamily="Arial"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}