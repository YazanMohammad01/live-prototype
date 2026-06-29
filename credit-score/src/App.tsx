import { useMemo, useState } from 'react'
import { calculateCreditScore, generateHints, type CreditInputs } from './lib/scoring'
import InputPanel from './components/InputPanel'
import ScoreGauge from './components/ScoreGauge'
import { DEMO_PROFILES } from './data/demos'

const DEFAULT_INPUTS: CreditInputs = {
  onTimePaymentRate: 92,
  latePayments30: 2,
  latePayments60: 1,
  latePayments90: 0,
  defaultsOrCollections: 0,
  creditUtilizationPercent: 28,
  totalDebt: 22000,
  openAccounts: 4,
  oldestAccountYears: 10,
  avgAccountAgeYears: 5,
  creditTypes: 3,
  hardInquiries12Mo: 2,
  newAccounts12Mo: 1,
}

const DEMO_COLORS: Record<string, { accent: string; glow: string; border: string }> = {
  'Exceptional Credit': { accent: '#d4a853', glow: 'rgba(212,168,83,0.12)', border: 'rgba(212,168,83,0.25)' },
  'Fair Credit':      { accent: '#d97706', glow: 'rgba(217,119,6,0.12)',  border: 'rgba(217,119,6,0.25)' },
  'Poor Credit':      { accent: '#e11d48', glow: 'rgba(225,29,72,0.12)', border: 'rgba(225,29,72,0.25)' },
}

function App() {
  const [inputs, setInputs] = useState<CreditInputs>(DEFAULT_INPUTS)
  const [activeDemo, setActiveDemo] = useState<string | null>(null)
  const result = useMemo(() => calculateCreditScore(inputs), [inputs])
  const hints = useMemo(() => generateHints(inputs, result.score), [inputs, result.score])

  function loadDemo(profileName: string) {
    const profile = DEMO_PROFILES.find(p => p.name === profileName)
    if (profile) {
      setInputs({ ...profile.inputs })
      setActiveDemo(profileName)
    }
  }

  function handleInputChange(newInputs: CreditInputs) {
    setInputs(newInputs)
    setActiveDemo(null)
  }

  return (
    <div className="min-h-screen bg-charcoal-950 p-6">
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-0.5 bg-gold-500/40 rounded-full" />
          <span className="text-[10px] text-gold-500 uppercase tracking-[0.2em] font-semibold">Prototype</span>
          <div className="w-8 h-0.5 bg-gold-500/40 rounded-full" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary tracking-tight">FICO Credit Score</h1>
        <p className="text-text-muted text-sm mt-1.5">Real-time credit scoring simulation</p>
      </header>

      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-3 gap-4">
          {DEMO_PROFILES.map(profile => {
            const isActive = activeDemo === profile.name
            const c = DEMO_COLORS[profile.name]

            return (
              <button
                key={profile.name}
                onClick={() => loadDemo(profile.name)}
                className="group relative rounded-2xl p-5 text-left transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-[0_0_15px_var(--demo-glow)]"
                style={{
                  '--demo-glow': c.glow,
                  backgroundColor: isActive ? c.glow : 'var(--color-charcoal-800)',
                  border: `1px solid ${isActive ? c.border : 'var(--color-charcoal-700)'}`,
                } as React.CSSProperties}
              >
                {isActive && (
                  <div
                    className="absolute inset-0 opacity-20 rounded-2xl"
                    style={{ background: `radial-gradient(ellipse at top, ${c.accent}22, transparent 70%)` }}
                  />
                )}
                <div className="relative">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full transition-shadow"
                      style={{
                        backgroundColor: c.accent,
                        boxShadow: isActive ? `0 0 8px ${c.accent}` : 'none',
                      }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-text-primary">{profile.name}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{profile.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <InputPanel inputs={inputs} onChange={handleInputChange} />

        <div className="space-y-5">
          <div className="bg-charcoal-800 rounded-2xl p-6 border border-charcoal-700/50">
            <ScoreGauge score={result.score} minScore={300} maxScore={850} category={result.category} />
          </div>

          <div className="bg-charcoal-800 rounded-2xl p-6 border border-charcoal-700/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-gold-500 rounded-full" />
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                Tier Breakdown
              </h3>
            </div>
            <div className="space-y-4">
              {result.tiers.map(tier => {
                const pct = (tier.score / tier.maxScore) * 100
                return (
                  <div key={tier.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-text-secondary">{tier.name} <span className="text-text-muted text-xs">({tier.weight * 100}%)</span></span>
                      <span className="text-text-primary font-mono text-xs">{tier.score} <span className="text-text-muted">/ {tier.maxScore}</span></span>
                    </div>
                    <div className="h-2.5 bg-charcoal-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          background: pct > 70
                            ? 'linear-gradient(90deg, var(--color-score-good), var(--color-gold-500))'
                            : pct > 40
                            ? 'linear-gradient(90deg, var(--color-score-fair), var(--color-gold-400))'
                            : 'linear-gradient(90deg, var(--color-score-poor), var(--color-score-fair))',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-charcoal-800 rounded-2xl p-6 border border-charcoal-700/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-gold-500 rounded-full" />
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                Top Factors
              </h3>
            </div>
            <div className="space-y-2">
              {result.topFactors.map((factor, i) => (
                <div key={factor.input} className="flex items-center justify-between py-2 border-b border-charcoal-700/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted text-[10px] font-mono w-4 text-right">{i + 1}</span>
                    <span className="text-sm text-text-primary">{factor.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: factor.direction === 'positive' ? 'var(--color-score-very-good)' : 'var(--color-score-poor)',
                        boxShadow: `0 0 4px ${factor.direction === 'positive' ? 'rgba(45,212,168,0.2)' : 'rgba(225,29,72,0.2)'}`,
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
            <div className="bg-charcoal-800 rounded-2xl p-6 border border-charcoal-700/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-gold-500 rounded-full" />
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                  Opportunities
                </h3>
              </div>
              <div className="space-y-2">
                {hints.map(hint => (
                  <div key={hint.label} className="flex items-center justify-between rounded-xl px-4 py-3 border border-charcoal-700/30 bg-charcoal-900/50">
                    <div>
                      <span className="text-sm text-text-primary">{hint.label}</span>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {hint.unit === '$' ? `$${hint.currentValue.toLocaleString()}` : hint.currentValue}{hint.unit && hint.unit !== '$' ? ` ${hint.unit}` : ''}
                        <span className="text-gold-500 mx-1.5">→</span>
                        {hint.unit === '$' ? `$${hint.suggestedValue.toLocaleString()}` : hint.suggestedValue}{hint.unit && hint.unit !== '$' ? ` ${hint.unit}` : ''}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gold-400">
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
