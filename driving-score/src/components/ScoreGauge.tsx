import { type RiskCategory } from '../lib/scoring'

interface ScoreGaugeProps {
  score: number;
  minScore: number;
  maxScore: number;
  category: RiskCategory;
}

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  Poor: 'var(--color-score-poor)',
  Fair: 'var(--color-score-fair)',
  Good: 'var(--color-score-good)',
  'Very Good': 'var(--color-score-excellent)',
  Exceptional: 'var(--color-score-excellent)',
}

const CATEGORY_HEX: Record<RiskCategory, string> = {
  Poor: '#ef4444',
  Fair: '#f97316',
  Good: '#22c55e',
  'Very Good': '#06b6d4',
  Exceptional: '#10b981',
}

export default function ScoreGauge({ score, minScore, maxScore, category }: ScoreGaugeProps) {
  const rawPct = Math.min((score - minScore) / (maxScore - minScore), 1)
  const percentage = Math.max(0.005, Math.min(0.995, rawPct))

  const cx = 150
  const cy = 140
  const radius = 110
  const strokeWidth = 14
  const startAngle = 180
  const endAngle = 360
  const totalArc = endAngle - startAngle

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  function describeArc(start: number, end: number) {
    const s = polarToCartesian(start)
    const e = polarToCartesian(end)
    const largeArc = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  function pointAtRadius(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const bgArc = describeArc(startAngle, endAngle)
  const needleAngle = startAngle + totalArc * percentage

  const needleInnerGap = 10
  const needleOuterGap = 10
  const needleStart = pointAtRadius(needleAngle, needleInnerGap)
  const needleTip = pointAtRadius(needleAngle, radius - needleOuterGap)

  const tickCount = 6
  const tickLabels: number[] = []
  for (let i = 0; i < tickCount; i++) {
    tickLabels.push(Math.round(minScore + ((maxScore - minScore) / (tickCount - 1)) * i))
  }

  const categoryColor = CATEGORY_COLORS[category]
  const categoryHex = CATEGORY_HEX[category]

  return (
    <div className="flex flex-col items-center" role="figure" aria-label={`Driving score: ${score} out of ${maxScore}, rated ${category}`}>
      <svg viewBox="0 0 300 180" className="w-full max-w-[320px]" aria-hidden="true">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="75%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <clipPath id="scoreTextClip">
            <rect x="0" y="0" width="300" height="85" />
            <rect x="0" y="122" width="300" height="60" />
            <rect x={cx + 50} y="85" width={300 - cx - 50} height="37" />
            <rect x="0" y="85" width={cx - 50} height="37" />
          </clipPath>
        </defs>

        <path d={bgArc} fill="none" stroke="#1a2940" strokeWidth={strokeWidth} strokeLinecap="round" />

        <path
          d={describeArc(startAngle, needleAngle)}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ transition: 'all 0.3s ease-out' }}
        />

        {tickLabels.map((label, i) => {
          const angle = startAngle + (totalArc / (tickCount - 1)) * i
          const outerR = radius + strokeWidth / 2 + 6
          const innerR = radius + strokeWidth / 2 + 20
          const outer = {
            x: cx + outerR * Math.cos((angle * Math.PI) / 180),
            y: cy + outerR * Math.sin((angle * Math.PI) / 180),
          }
          const labelPos = {
            x: cx + innerR * Math.cos((angle * Math.PI) / 180),
            y: cy + innerR * Math.sin((angle * Math.PI) / 180),
          }
          return (
            <g key={i}>
              <circle cx={outer.x} cy={outer.y} r={1.5} fill="#64748b" />
              <text
                x={labelPos.x}
                y={labelPos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#64748b"
                fontSize="9"
                fontFamily="system-ui"
              >
                {label}
              </text>
            </g>
          )
        })}

        <g clipPath="url(#scoreTextClip)">
          <line
            x1={needleStart.x}
            y1={needleStart.y}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke={categoryHex}
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ transition: 'all 0.3s ease-out' }}
          />
        </g>

        <circle cx={cx} cy={cy} r={5} fill={categoryHex} style={{ transition: 'fill 0.3s' }} />
        <circle cx={cx} cy={cy} r={2.5} fill="#111d2e" />

        <text
          x={cx}
          y={cy - 24}
          textAnchor="middle"
          fill="white"
          fontSize="42"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          {score}
        </text>
      </svg>

      <div className="text-center -mt-4">
        <div className="text-lg font-semibold" style={{ color: categoryColor }}>
          {category}
        </div>
        <div className="text-text-muted text-xs">{minScore} – {maxScore} range</div>
      </div>
    </div>
  )
}
