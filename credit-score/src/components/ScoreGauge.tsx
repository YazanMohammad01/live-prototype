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
  'Very Good': 'var(--color-score-very-good)',
  Exceptional: 'var(--color-score-exceptional)',
}

const CATEGORY_HEX: Record<RiskCategory, string> = {
  Poor: '#e11d48',
  Fair: '#d97706',
  Good: '#059669',
  'Very Good': '#2dd4a8',
  Exceptional: '#f5e6c8',
}

export default function ScoreGauge({ score, minScore, maxScore, category }: ScoreGaugeProps) {
  const rawPct = Math.min((score - minScore) / (maxScore - minScore), 1)
  const percentage = Math.max(0.005, Math.min(0.995, rawPct))

  const cx = 150
  const cy = 140
  const radius = 110
  const strokeWidth = 12
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

  const needleStart = pointAtRadius(needleAngle, 10)
  const needleTip = pointAtRadius(needleAngle, radius - 10)

  const tickCount = 6
  const tickLabels: number[] = []
  for (let i = 0; i < tickCount; i++) {
    tickLabels.push(Math.round(minScore + ((maxScore - minScore) / (tickCount - 1)) * i))
  }

  const categoryColor = CATEGORY_COLORS[category]
  const categoryHex = CATEGORY_HEX[category]

  return (
    <div className="flex flex-col items-center" role="figure" aria-label={`Credit score: ${score} out of ${maxScore}, rated ${category}`}>
      <svg viewBox="0 0 300 180" className="w-full max-w-[320px]" aria-hidden="true">
        <defs>
          <linearGradient id="creditGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="28%" stopColor="#d97706" />
            <stop offset="52%" stopColor="#059669" />
            <stop offset="76%" stopColor="#2dd4a8" />
            <stop offset="100%" stopColor="#f5e6c8" />
          </linearGradient>
          <filter id="needleGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="creditNeedleClip">
            <rect x="0" y="0" width="300" height="85" />
            <rect x="0" y="122" width="300" height="60" />
            <rect x={cx + 50} y="85" width={300 - cx - 50} height="37" />
            <rect x="0" y="85" width={cx - 50} height="37" />
          </clipPath>
        </defs>

        <path d={bgArc} fill="none" stroke="#27272a" strokeWidth={strokeWidth} strokeLinecap="round" />

        <path
          d={describeArc(startAngle, needleAngle)}
          fill="none"
          stroke="url(#creditGaugeGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ transition: 'all 0.4s ease-out' }}
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
              <circle cx={outer.x} cy={outer.y} r={1.5} fill="#78716c" />
              <text
                x={labelPos.x}
                y={labelPos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#78716c"
                fontSize="9"
                fontFamily="system-ui"
              >
                {label}
              </text>
            </g>
          )
        })}

        <g clipPath="url(#creditNeedleClip)">
          <line
            x1={needleStart.x}
            y1={needleStart.y}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke={categoryHex}
            strokeWidth={2}
            strokeLinecap="round"
            filter="url(#needleGlow)"
            style={{ transition: 'all 0.4s ease-out' }}
          />
        </g>

        <circle cx={cx} cy={cy} r={6} fill="none" stroke={categoryHex} strokeWidth={1.5} style={{ transition: 'stroke 0.3s' }} />
        <circle cx={cx} cy={cy} r={2.5} fill={categoryHex} style={{ transition: 'fill 0.3s' }} />

        <text
          x={cx}
          y={cy - 24}
          textAnchor="middle"
          fill="#fafaf9"
          fontSize="40"
          fontWeight="700"
          fontFamily="'Segoe UI', system-ui"
          letterSpacing="-1"
        >
          {score}
        </text>
      </svg>

      <div className="text-center -mt-3">
        <div className="text-base font-semibold tracking-wide" style={{ color: categoryColor }}>
          {category}
        </div>
        <div className="text-text-muted text-[11px] mt-0.5">{minScore} – {maxScore} range</div>
      </div>
    </div>
  )
}
