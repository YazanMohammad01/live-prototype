import { useMemo, useState } from 'react'
import { calculateDrivingScore, generateHints, type DrivingInputs } from './lib/scoring'
import InputPanel from './components/InputPanel'
import ScoreGauge from './components/ScoreGauge'
import { DEMO_PROFILES } from './data/demos'

const DEFAULT_INPUTS: DrivingInputs = {
  hardBrakingPer100Mi: 10,
  rapidAccelPer100Mi: 8,
  speedingPercent: 15,
  phoneDistractionPerTrip: 3,
  monthlyMiles: 1500,
  nightDrivingPercent: 20,
  avgTripDurationMin: 30,
  yearsExperience: 8,
  accidentsLast3Yr: 1,
  violationsLast3Yr: 1,
}

const DEMO_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  'Low Risk':  { accent: 'var(--color-score-good)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)' },
  'Average':   { accent: 'var(--color-score-fair)', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.3)' },
  'High Risk': { accent: 'var(--color-score-poor)', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)' },
}

function App() {
  const [inputs, setInputs] = useState<DrivingInputs>(DEFAULT_INPUTS)
  const [activeDemo, setActiveDemo] = useState<string | null>(null)
  const result = useMemo(() => calculateDrivingScore(inputs), [inputs])
  const hints = useMemo(() => generateHints(inputs, result.score), [inputs, result.score])

  function loadDemo(profileName: string) {
    const profile = DEMO_PROFILES.find(p => p.name === profileName)
    if (profile) {
      setInputs({ ...profile.inputs })
      setActiveDemo(profileName)
    }
  }

  function handleInputChange(newInputs: DrivingInputs) {
    setInputs(newInputs)
    setActiveDemo(null)
  }

  return (
    <div className="min-h-screen bg-navy-900 p-6">
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-0.5 bg-accent/30 rounded-full" />
          <span className="text-[10px] text-accent uppercase tracking-[0.2em] font-semibold">Prototype</span>
          <div className="w-8 h-0.5 bg-accent/30 rounded-full" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">FICO Safe Driving Score</h1>
        <p className="text-text-muted text-sm mt-1.5">Real-time telematics scoring simulation</p>
      </header>

      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">Demo Profiles</span>
          <div className="flex-1 h-px bg-navy-700" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {DEMO_PROFILES.map(profile => {
            const isActive = activeDemo === profile.name
            const c = DEMO_COLORS[profile.name] ?? DEMO_COLORS['Average']

            return (
              <button
                key={profile.name}
                onClick={() => loadDemo(profile.name)}
                className="relative rounded-xl p-4 text-left transition-all cursor-pointer border"
                style={{
                  backgroundColor: isActive ? c.bg : 'var(--color-navy-800)',
                  borderColor: isActive ? c.border : 'var(--color-navy-600)',
                  boxShadow: isActive ? `0 0 20px ${c.bg}` : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: c.accent, boxShadow: isActive ? `0 0 6px ${c.accent}` : 'none' }}
                  />
                  <span className="text-sm font-semibold text-text-primary">{profile.name}</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{profile.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <InputPanel inputs={inputs} onChange={handleInputChange} />

        <div className="space-y-6">
          <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
            <ScoreGauge score={result.score} minScore={150} maxScore={800} category={result.category} />
          </div>

          <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-accent rounded-full" />
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                Tier Breakdown
              </h3>
            </div>
            <div className="space-y-3">
              {result.tiers.map(tier => {
                const pct = (tier.score / tier.maxScore) * 100
                return (
                  <div key={tier.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{tier.name} <span className="text-text-muted text-xs">({tier.weight * 100}%)</span></span>
                      <span className="text-text-primary font-mono text-xs">{tier.score} <span className="text-text-muted">/ {tier.maxScore}</span></span>
                    </div>
                    <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct > 70 ? 'var(--color-score-good)' : pct > 40 ? 'var(--color-score-fair)' : 'var(--color-score-poor)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-accent rounded-full" />
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                Top Factors
              </h3>
            </div>
            <div className="space-y-2">
              {result.topFactors.map((factor, i) => (
                <div key={factor.input} className="flex items-center justify-between py-2 border-b border-navy-700/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted text-[10px] font-mono w-4 text-right">{i + 1}</span>
                    <span className="text-sm text-text-primary">{factor.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: factor.direction === 'positive' ? 'var(--color-score-good)' : 'var(--color-score-poor)',
                        boxShadow: `0 0 4px ${factor.direction === 'positive' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      }}
                    />
                    <span className={`text-xs font-medium ${factor.direction === 'positive' ? 'text-score-good' : 'text-score-poor'}`}>
                      {factor.direction === 'positive' ? 'Helping' : 'Hurting'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hints.length > 0 && (
            <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-accent rounded-full" />
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                  How to Improve
                </h3>
              </div>
              <div className="space-y-2">
                {hints.map(hint => (
                  <div key={hint.label} className="flex items-center justify-between rounded-lg px-4 py-3 bg-navy-700/30 border-l-2 border-score-good">
                    <div>
                      <span className="text-sm text-text-primary">{hint.label}</span>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {hint.currentValue}{hint.unit ? ` ${hint.unit}` : ''}
                        <span className="text-accent mx-1.5">→</span>
                        {hint.suggestedValue}{hint.unit ? ` ${hint.unit}` : ''}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-score-good">
                      +{hint.pointsGain}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-10 text-center">
        <p className="text-[10px] text-text-muted/50 tracking-wide">
          This is a simulation prototype. Not affiliated with or endorsed by FICO.
        </p>
      </div>
    </div>
  )
}

export default App
