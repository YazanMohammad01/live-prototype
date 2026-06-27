import { useState } from 'react'
import { type CreditInputs, INPUT_BOUNDS } from '../lib/scoring'

interface InputPanelProps {
  inputs: CreditInputs;
  onChange: (inputs: CreditInputs) => void;
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
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors cursor-pointer hover:bg-charcoal-700/50"
        style={{ borderLeft: `2px solid ${color}` }}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-text-primary tracking-wide">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gold-500 font-semibold bg-gold-glow px-2 py-0.5 rounded-full">{weight}</span>
          <svg
            className={`w-3.5 h-3.5 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && <div className="mt-2 space-y-3 pl-3 ml-0.5 border-l border-charcoal-700">{children}</div>}
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

function formatValue(value: number, unit: string): string {
  if (unit === '$') return `$${value.toLocaleString()}`
  if (unit) return `${value} ${unit}`
  return `${value}`
}

function SliderInput({ label, value, min, max, step, unit, onChange }: SliderInputProps) {
  const percentage = ((value - min) / (max - min)) * 100
  const displayValue = formatValue(value, unit)

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-xs text-text-muted">{label}</label>
        <span className="text-xs font-mono text-gold-400">
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
        className="w-full h-1 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-500 [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:hover:bg-gold-400 [&::-webkit-slider-thumb]:transition-colors
          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-gold-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
        style={{
          background: `linear-gradient(to right, var(--color-gold-500) 0%, var(--color-gold-500) ${percentage}%, var(--color-charcoal-700) ${percentage}%, var(--color-charcoal-700) 100%)`,
        }}
      />
    </div>
  )
}

const INPUT_LABELS: Record<keyof CreditInputs, string> = {
  onTimePaymentRate: 'On-Time Payment Rate',
  latePayments30: '30-Day Late Payments',
  latePayments60: '60-Day Late Payments',
  latePayments90: '90+ Day Late Payments',
  defaultsOrCollections: 'Defaults / Collections',
  creditUtilizationPercent: 'Credit Utilization',
  totalDebt: 'Total Outstanding Debt',
  openAccounts: 'Open Accounts',
  oldestAccountYears: 'Oldest Account Age',
  avgAccountAgeYears: 'Average Account Age',
  creditTypes: 'Credit Type Mix',
  hardInquiries12Mo: 'Hard Inquiries (12 mo)',
  newAccounts12Mo: 'New Accounts (12 mo)',
}

export default function InputPanel({ inputs, onChange }: InputPanelProps) {
  function updateField(field: keyof CreditInputs, value: number) {
    onChange({ ...inputs, [field]: value })
  }

  function renderSlider(field: keyof CreditInputs) {
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
    <div className="bg-charcoal-800 rounded-2xl p-5 border border-charcoal-700/50">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-5 bg-gold-500 rounded-full" />
        <h2 className="text-base font-semibold text-text-primary tracking-wide">Credit Profile</h2>
      </div>

      <TierSection title="Payment History" color="#d4a853" weight="35%">
        {renderSlider('onTimePaymentRate')}
        {renderSlider('latePayments30')}
        {renderSlider('latePayments60')}
        {renderSlider('latePayments90')}
        {renderSlider('defaultsOrCollections')}
      </TierSection>

      <TierSection title="Utilization & Debt" color="#e2be73" weight="30%">
        {renderSlider('creditUtilizationPercent')}
        {renderSlider('totalDebt')}
        {renderSlider('openAccounts')}
      </TierSection>

      <TierSection title="History Length" color="#b8923e" weight="15%">
        {renderSlider('oldestAccountYears')}
        {renderSlider('avgAccountAgeYears')}
      </TierSection>

      <TierSection title="Mix & New Activity" color="#a8a29e" weight="20%">
        {renderSlider('creditTypes')}
        {renderSlider('hardInquiries12Mo')}
        {renderSlider('newAccounts12Mo')}
      </TierSection>
    </div>
  )
}
