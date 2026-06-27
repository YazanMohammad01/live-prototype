import { useState } from 'react'
import { type DrivingInputs, INPUT_BOUNDS } from '../lib/scoring'

interface InputPanelProps {
  inputs: DrivingInputs;
  onChange: (inputs: DrivingInputs) => void;
}

interface TierSectionProps {
  title: string;
  color: string;
  weight: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function TierSection({ title, color, weight, defaultOpen = true, children }: TierSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-navy-700/50 hover:bg-navy-700 transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
          <span className="text-sm font-semibold text-text-primary">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{weight}</span>
          <svg
            className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && <div className="mt-2 space-y-3 px-1">{children}</div>}
    </div>
  )
}

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function SliderInput({ label, value, min, max, step, unit, onChange }: SliderInputProps) {
  const percentage = ((value - min) / (max - min)) * 100
  const displayValue = unit ? `${value} ${unit}` : `${value}`

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-xs text-text-secondary">{label}</label>
        <span className="text-xs font-mono text-text-primary">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:hover:bg-accent-hover [&::-webkit-slider-thumb]:transition-colors
          [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
        style={{
          background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, #1a2940 ${percentage}%, #1a2940 100%)`,
        }}
      />
    </div>
  )
}

const INPUT_LABELS: Record<keyof DrivingInputs, string> = {
  hardBrakingPer100Mi: 'Hard Braking (per 100 mi)',
  rapidAccelPer100Mi: 'Rapid Acceleration (per 100 mi)',
  speedingPercent: 'Speeding Frequency',
  phoneDistractionPerTrip: 'Phone Distraction (per trip)',
  monthlyMiles: 'Monthly Miles Driven',
  nightDrivingPercent: 'Night Driving Ratio',
  avgTripDurationMin: 'Avg Trip Duration',
  yearsExperience: 'Years of Experience',
  accidentsLast3Yr: 'Accidents (last 3 years)',
  violationsLast3Yr: 'Violations (last 3 years)',
}

export default function InputPanel({ inputs, onChange }: InputPanelProps) {
  function updateField(field: keyof DrivingInputs, value: number) {
    onChange({ ...inputs, [field]: value })
  }

  function renderSlider(field: keyof DrivingInputs) {
    const bounds = INPUT_BOUNDS[field]
    return (
      <SliderInput
        key={field}
        label={INPUT_LABELS[field]}
        value={inputs[field]}
        min={bounds.min}
        max={bounds.max}
        step={bounds.step}
        unit={bounds.unit}
        onChange={v => updateField(field, v)}
      />
    )
  }

  return (
    <div className="bg-navy-800 rounded-xl p-4 border border-navy-600">
      <h2 className="text-lg font-bold text-text-primary mb-4">Driver Inputs</h2>

      <TierSection title="Driving Behavior" color="#3b82f6" weight="50%">
        {renderSlider('hardBrakingPer100Mi')}
        {renderSlider('rapidAccelPer100Mi')}
        {renderSlider('speedingPercent')}
        {renderSlider('phoneDistractionPerTrip')}
      </TierSection>

      <TierSection title="Trip Context" color="#8b5cf6" weight="30%">
        {renderSlider('monthlyMiles')}
        {renderSlider('nightDrivingPercent')}
        {renderSlider('avgTripDurationMin')}
      </TierSection>

      <TierSection title="Driver Profile" color="#10b981" weight="20%">
        {renderSlider('yearsExperience')}
        {renderSlider('accidentsLast3Yr')}
        {renderSlider('violationsLast3Yr')}
      </TierSection>
    </div>
  )
}
