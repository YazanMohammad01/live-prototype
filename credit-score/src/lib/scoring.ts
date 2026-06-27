export interface CreditInputs {
  // Tier 1 — Payment History (35% weight)
  onTimePaymentRate: number;      // 0–100 (%)
  latePayments30: number;         // 0–20 (30-day late marks)
  latePayments60: number;         // 0–10 (60-day late marks)
  latePayments90: number;         // 0–10 (90+ day late marks)
  defaultsOrCollections: number;  // 0–5

  // Tier 2 — Credit Utilization & Debt (30% weight)
  creditUtilizationPercent: number; // 0–100 (%)
  totalDebt: number;                // 0–500000 ($)
  openAccounts: number;             // 0–30

  // Tier 3 — Credit History Length (15% weight)
  oldestAccountYears: number;     // 0–40 (years)
  avgAccountAgeYears: number;     // 0–25 (years)

  // Tier 4 — Credit Mix & New Activity (20% weight)
  creditTypes: number;            // 1–5 (number of different credit types)
  hardInquiries12Mo: number;      // 0–15
  newAccounts12Mo: number;        // 0–10
}

export type RiskCategory = 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';

export interface TierBreakdown {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
}

export interface ScoreFactor {
  input: string;
  label: string;
  impact: number;
  direction: 'positive' | 'negative';
}

export interface ScoringResult {
  score: number;
  category: RiskCategory;
  tiers: TierBreakdown[];
  topFactors: ScoreFactor[];
}

const MIN_SCORE = 300;
const MAX_SCORE = 850;
const SCORE_RANGE = MAX_SCORE - MIN_SCORE;

const TIER_WEIGHTS = {
  paymentHistory: 0.35,
  utilization: 0.30,
  historyLength: 0.15,
  creditMix: 0.20,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number, invert = false): number {
  const clamped = clamp(value, min, max);
  const normalized = (clamped - min) / (max - min);
  return invert ? 1 - normalized : normalized;
}

function getCategory(score: number): RiskCategory {
  if (score < 580) return 'Poor';
  if (score < 670) return 'Fair';
  if (score < 740) return 'Good';
  if (score < 800) return 'Very Good';
  return 'Excellent';
}

interface TierResult {
  score: number;
  factors: ScoreFactor[];
}

function scorePaymentHistoryTier(inputs: CreditInputs): TierResult {
  const onTime = normalize(inputs.onTimePaymentRate, 0, 100);
  const late30 = normalize(inputs.latePayments30, 0, 20, true);
  const late60 = normalize(inputs.latePayments60, 0, 10, true);
  const late90 = normalize(inputs.latePayments90, 0, 10, true);
  const defaults = normalize(inputs.defaultsOrCollections, 0, 5, true);

  const weights = { onTime: 0.30, late30: 0.15, late60: 0.15, late90: 0.20, defaults: 0.20 };
  const score = onTime * weights.onTime + late30 * weights.late30 + late60 * weights.late60 + late90 * weights.late90 + defaults * weights.defaults;

  const factors: ScoreFactor[] = [
    { input: 'onTimePaymentRate', label: 'On-Time Payment Rate', impact: (1 - onTime) * weights.onTime, direction: onTime >= 0.5 ? 'positive' : 'negative' },
    { input: 'latePayments30', label: '30-Day Late Payments', impact: (1 - late30) * weights.late30, direction: late30 >= 0.5 ? 'positive' : 'negative' },
    { input: 'latePayments60', label: '60-Day Late Payments', impact: (1 - late60) * weights.late60, direction: late60 >= 0.5 ? 'positive' : 'negative' },
    { input: 'latePayments90', label: '90+ Day Late Payments', impact: (1 - late90) * weights.late90, direction: late90 >= 0.5 ? 'positive' : 'negative' },
    { input: 'defaultsOrCollections', label: 'Defaults / Collections', impact: (1 - defaults) * weights.defaults, direction: defaults >= 0.5 ? 'positive' : 'negative' },
  ];

  return { score, factors };
}

function scoreUtilizationTier(inputs: CreditInputs): TierResult {
  let utilScore: number;
  if (inputs.creditUtilizationPercent <= 10) {
    utilScore = 1;
  } else if (inputs.creditUtilizationPercent <= 30) {
    utilScore = 1 - (inputs.creditUtilizationPercent - 10) / 80;
  } else {
    utilScore = normalize(inputs.creditUtilizationPercent, 30, 100, true) * 0.75;
  }

  const debt = normalize(inputs.totalDebt, 0, 500000, true);

  let accountsScore: number;
  if (inputs.openAccounts <= 5) {
    accountsScore = normalize(inputs.openAccounts, 0, 5);
  } else {
    accountsScore = normalize(inputs.openAccounts, 5, 30, true);
  }

  const weights = { util: 0.50, debt: 0.30, accounts: 0.20 };
  const score = utilScore * weights.util + debt * weights.debt + accountsScore * weights.accounts;

  const factors: ScoreFactor[] = [
    { input: 'creditUtilizationPercent', label: 'Credit Utilization', impact: (1 - utilScore) * weights.util, direction: utilScore >= 0.5 ? 'positive' : 'negative' },
    { input: 'totalDebt', label: 'Total Outstanding Debt', impact: (1 - debt) * weights.debt, direction: debt >= 0.5 ? 'positive' : 'negative' },
    { input: 'openAccounts', label: 'Open Accounts', impact: (1 - accountsScore) * weights.accounts, direction: accountsScore >= 0.5 ? 'positive' : 'negative' },
  ];

  return { score, factors };
}

function scoreHistoryLengthTier(inputs: CreditInputs): TierResult {
  const oldest = normalize(inputs.oldestAccountYears, 0, 40);
  const avgAge = normalize(inputs.avgAccountAgeYears, 0, 25);

  const weights = { oldest: 0.55, avgAge: 0.45 };
  const score = oldest * weights.oldest + avgAge * weights.avgAge;

  const factors: ScoreFactor[] = [
    { input: 'oldestAccountYears', label: 'Oldest Account Age', impact: (1 - oldest) * weights.oldest, direction: oldest >= 0.5 ? 'positive' : 'negative' },
    { input: 'avgAccountAgeYears', label: 'Average Account Age', impact: (1 - avgAge) * weights.avgAge, direction: avgAge >= 0.5 ? 'positive' : 'negative' },
  ];

  return { score, factors };
}

function scoreCreditMixTier(inputs: CreditInputs): TierResult {
  const types = normalize(inputs.creditTypes, 1, 5);
  const inquiries = normalize(inputs.hardInquiries12Mo, 0, 15, true);
  const newAccounts = normalize(inputs.newAccounts12Mo, 0, 10, true);

  const weights = { types: 0.40, inquiries: 0.30, newAccounts: 0.30 };
  const score = types * weights.types + inquiries * weights.inquiries + newAccounts * weights.newAccounts;

  const factors: ScoreFactor[] = [
    { input: 'creditTypes', label: 'Credit Type Mix', impact: (1 - types) * weights.types, direction: types >= 0.5 ? 'positive' : 'negative' },
    { input: 'hardInquiries12Mo', label: 'Hard Inquiries (12 mo)', impact: (1 - inquiries) * weights.inquiries, direction: inquiries >= 0.5 ? 'positive' : 'negative' },
    { input: 'newAccounts12Mo', label: 'New Accounts (12 mo)', impact: (1 - newAccounts) * weights.newAccounts, direction: newAccounts >= 0.5 ? 'positive' : 'negative' },
  ];

  return { score, factors };
}

export function calculateCreditScore(inputs: CreditInputs): ScoringResult {
  const payment = scorePaymentHistoryTier(inputs);
  const utilization = scoreUtilizationTier(inputs);
  const history = scoreHistoryLengthTier(inputs);
  const mix = scoreCreditMixTier(inputs);

  const weightedScore =
    payment.score * TIER_WEIGHTS.paymentHistory +
    utilization.score * TIER_WEIGHTS.utilization +
    history.score * TIER_WEIGHTS.historyLength +
    mix.score * TIER_WEIGHTS.creditMix;

  const finalScore = Math.round(MIN_SCORE + weightedScore * SCORE_RANGE);
  const clampedScore = clamp(finalScore, MIN_SCORE, MAX_SCORE);

  const tiers: TierBreakdown[] = [
    { name: 'Payment History', weight: TIER_WEIGHTS.paymentHistory, score: Math.round(payment.score * TIER_WEIGHTS.paymentHistory * SCORE_RANGE), maxScore: TIER_WEIGHTS.paymentHistory * SCORE_RANGE },
    { name: 'Credit Utilization', weight: TIER_WEIGHTS.utilization, score: Math.round(utilization.score * TIER_WEIGHTS.utilization * SCORE_RANGE), maxScore: TIER_WEIGHTS.utilization * SCORE_RANGE },
    { name: 'History Length', weight: TIER_WEIGHTS.historyLength, score: Math.round(history.score * TIER_WEIGHTS.historyLength * SCORE_RANGE), maxScore: TIER_WEIGHTS.historyLength * SCORE_RANGE },
    { name: 'Credit Mix & Activity', weight: TIER_WEIGHTS.creditMix, score: Math.round(mix.score * TIER_WEIGHTS.creditMix * SCORE_RANGE), maxScore: TIER_WEIGHTS.creditMix * SCORE_RANGE },
  ];

  const allFactors = [...payment.factors, ...utilization.factors, ...history.factors, ...mix.factors];
  allFactors.sort((a, b) => b.impact - a.impact);
  const topFactors = allFactors.filter(f => f.direction === 'negative').slice(0, 3);
  if (topFactors.length < 3) {
    const positives = allFactors.filter(f => f.direction === 'positive').slice(0, 3 - topFactors.length);
    topFactors.push(...positives);
  }

  return {
    score: clampedScore,
    category: getCategory(clampedScore),
    tiers,
    topFactors,
  };
}

export interface WhatIfHint {
  label: string;
  currentValue: number;
  suggestedValue: number;
  unit: string;
  pointsGain: number;
}

const HINT_LABELS: Record<string, string> = {
  onTimePaymentRate: 'On-Time Payments',
  latePayments30: '30-Day Lates',
  latePayments60: '60-Day Lates',
  latePayments90: '90+ Day Lates',
  defaultsOrCollections: 'Defaults',
  creditUtilizationPercent: 'Utilization',
  totalDebt: 'Total Debt',
  hardInquiries12Mo: 'Hard Inquiries',
  newAccounts12Mo: 'New Accounts',
};

const IMPROVABLE_DECREASE: (keyof CreditInputs)[] = [
  'latePayments30', 'latePayments60', 'latePayments90',
  'defaultsOrCollections', 'creditUtilizationPercent',
  'hardInquiries12Mo', 'newAccounts12Mo',
];

const IMPROVABLE_INCREASE: (keyof CreditInputs)[] = [
  'onTimePaymentRate',
];

export function generateHints(inputs: CreditInputs, currentScore: number): WhatIfHint[] {
  const hints: WhatIfHint[] = [];

  for (const field of IMPROVABLE_DECREASE) {
    const current = inputs[field];
    const bounds = INPUT_BOUNDS[field];
    if (current <= bounds.min) continue;

    const targetSteps = [bounds.min, Math.round(current * 0.25), Math.round(current * 0.5)];
    let bestGain = 0;
    let bestTarget = current;

    for (const target of targetSteps) {
      const clamped = Math.max(bounds.min, target);
      if (clamped >= current) continue;
      const newScore = calculateCreditScore({ ...inputs, [field]: clamped }).score;
      const gain = newScore - currentScore;
      if (gain > bestGain) {
        bestGain = gain;
        bestTarget = clamped;
      }
    }

    if (bestGain > 0) {
      hints.push({ label: HINT_LABELS[field] ?? field, currentValue: current, suggestedValue: bestTarget, unit: bounds.unit, pointsGain: bestGain });
    }
  }

  for (const field of IMPROVABLE_INCREASE) {
    const current = inputs[field];
    const bounds = INPUT_BOUNDS[field];
    if (current >= bounds.max) continue;

    const gap = bounds.max - current;
    const targetSteps = [bounds.max, Math.round(current + gap * 0.75), Math.round(current + gap * 0.5)];
    let bestGain = 0;
    let bestTarget = current;

    for (const target of targetSteps) {
      const clamped = Math.min(bounds.max, target);
      if (clamped <= current) continue;
      const newScore = calculateCreditScore({ ...inputs, [field]: clamped }).score;
      const gain = newScore - currentScore;
      if (gain > bestGain) {
        bestGain = gain;
        bestTarget = clamped;
      }
    }

    if (bestGain > 0) {
      hints.push({ label: HINT_LABELS[field] ?? field, currentValue: current, suggestedValue: bestTarget, unit: bounds.unit, pointsGain: bestGain });
    }
  }

  hints.sort((a, b) => b.pointsGain - a.pointsGain);
  return hints.slice(0, 3);
}

export const INPUT_BOUNDS: Record<keyof CreditInputs, { min: number; max: number; step: number; unit: string }> = {
  onTimePaymentRate:        { min: 0,  max: 100,    step: 1,     unit: '%' },
  latePayments30:           { min: 0,  max: 20,     step: 1,     unit: '' },
  latePayments60:           { min: 0,  max: 10,     step: 1,     unit: '' },
  latePayments90:           { min: 0,  max: 10,     step: 1,     unit: '' },
  defaultsOrCollections:    { min: 0,  max: 5,      step: 1,     unit: '' },
  creditUtilizationPercent: { min: 0,  max: 100,    step: 1,     unit: '%' },
  totalDebt:                { min: 0,  max: 500000, step: 1000,  unit: '$' },
  openAccounts:             { min: 0,  max: 30,     step: 1,     unit: '' },
  oldestAccountYears:       { min: 0,  max: 40,     step: 1,     unit: 'years' },
  avgAccountAgeYears:       { min: 0,  max: 25,     step: 0.5,   unit: 'years' },
  creditTypes:              { min: 1,  max: 5,      step: 1,     unit: 'types' },
  hardInquiries12Mo:        { min: 0,  max: 15,     step: 1,     unit: '' },
  newAccounts12Mo:          { min: 0,  max: 10,     step: 1,     unit: '' },
};
