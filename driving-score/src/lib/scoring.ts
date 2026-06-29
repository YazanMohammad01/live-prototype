export interface DrivingInputs {
  // Factor 1 — Braking (30%)
  hardBrakingPer100Mi: number;     // 0–50

  // Factor 2 — Distraction (25%)
  phoneDistractionPerTrip: number; // 0–20

  // Factor 3 — Acceleration (20%)
  rapidAccelPer100Mi: number;      // 0–50

  // Factor 4 — Cornering (15%)
  sharpCorneringPer100Mi: number;  // 0–40

  // Factor 5 — Speeding (10%)
  speedingPercent: number;         // 0–100 (% of trip time over limit)
}

export type RiskCategory = 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Exceptional';

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

const MIN_SCORE = 100;
const MAX_SCORE = 850;
const SCORE_RANGE = MAX_SCORE - MIN_SCORE;

const TIER_WEIGHTS = {
  braking: 0.30,
  distraction: 0.25,
  acceleration: 0.20,
  cornering: 0.15,
  speeding: 0.10,
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
  if (score < 300) return 'Poor';
  if (score < 500) return 'Fair';
  if (score < 650) return 'Good';
  if (score < 750) return 'Very Good';
  return 'Exceptional';
}

interface TierResult {
  score: number;
  factors: ScoreFactor[];
}

function scoreBrakingTier(inputs: DrivingInputs): TierResult {
  const braking = normalize(inputs.hardBrakingPer100Mi, 0, 50, true);
  return {
    score: braking,
    factors: [{ input: 'hardBrakingPer100Mi', label: 'Harsh Braking', impact: (1 - braking) * 1.0, direction: braking >= 0.5 ? 'positive' : 'negative' }],
  };
}

function scoreDistractionTier(inputs: DrivingInputs): TierResult {
  const distraction = normalize(inputs.phoneDistractionPerTrip, 0, 20, true);
  return {
    score: distraction,
    factors: [{ input: 'phoneDistractionPerTrip', label: 'Phone Distraction', impact: (1 - distraction) * 1.0, direction: distraction >= 0.5 ? 'positive' : 'negative' }],
  };
}

function scoreAccelerationTier(inputs: DrivingInputs): TierResult {
  const accel = normalize(inputs.rapidAccelPer100Mi, 0, 50, true);
  return {
    score: accel,
    factors: [{ input: 'rapidAccelPer100Mi', label: 'Harsh Acceleration', impact: (1 - accel) * 1.0, direction: accel >= 0.5 ? 'positive' : 'negative' }],
  };
}

function scoreCorneringTier(inputs: DrivingInputs): TierResult {
  const cornering = normalize(inputs.sharpCorneringPer100Mi, 0, 40, true);
  return {
    score: cornering,
    factors: [{ input: 'sharpCorneringPer100Mi', label: 'Sharp Cornering', impact: (1 - cornering) * 1.0, direction: cornering >= 0.5 ? 'positive' : 'negative' }],
  };
}

function scoreSpeedingTier(inputs: DrivingInputs): TierResult {
  const speeding = normalize(inputs.speedingPercent, 0, 100, true);
  return {
    score: speeding,
    factors: [{ input: 'speedingPercent', label: 'Speeding', impact: (1 - speeding) * 1.0, direction: speeding >= 0.5 ? 'positive' : 'negative' }],
  };
}

export function calculateDrivingScore(inputs: DrivingInputs): ScoringResult {
  const braking = scoreBrakingTier(inputs);
  const distraction = scoreDistractionTier(inputs);
  const acceleration = scoreAccelerationTier(inputs);
  const cornering = scoreCorneringTier(inputs);
  const speeding = scoreSpeedingTier(inputs);

  const weightedScore =
    braking.score * TIER_WEIGHTS.braking +
    distraction.score * TIER_WEIGHTS.distraction +
    acceleration.score * TIER_WEIGHTS.acceleration +
    cornering.score * TIER_WEIGHTS.cornering +
    speeding.score * TIER_WEIGHTS.speeding;

  const finalScore = Math.round(MIN_SCORE + weightedScore * SCORE_RANGE);
  const clampedScore = clamp(finalScore, MIN_SCORE, MAX_SCORE);

  const tiers: TierBreakdown[] = [
    { name: 'Braking', weight: TIER_WEIGHTS.braking, score: Math.round(braking.score * TIER_WEIGHTS.braking * SCORE_RANGE), maxScore: TIER_WEIGHTS.braking * SCORE_RANGE },
    { name: 'Distraction', weight: TIER_WEIGHTS.distraction, score: Math.round(distraction.score * TIER_WEIGHTS.distraction * SCORE_RANGE), maxScore: TIER_WEIGHTS.distraction * SCORE_RANGE },
    { name: 'Acceleration', weight: TIER_WEIGHTS.acceleration, score: Math.round(acceleration.score * TIER_WEIGHTS.acceleration * SCORE_RANGE), maxScore: TIER_WEIGHTS.acceleration * SCORE_RANGE },
    { name: 'Cornering', weight: TIER_WEIGHTS.cornering, score: Math.round(cornering.score * TIER_WEIGHTS.cornering * SCORE_RANGE), maxScore: TIER_WEIGHTS.cornering * SCORE_RANGE },
    { name: 'Speeding', weight: TIER_WEIGHTS.speeding, score: Math.round(speeding.score * TIER_WEIGHTS.speeding * SCORE_RANGE), maxScore: TIER_WEIGHTS.speeding * SCORE_RANGE },
  ];

  const allFactors = [...braking.factors, ...distraction.factors, ...acceleration.factors, ...cornering.factors, ...speeding.factors];
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

const INPUT_LABELS: Record<keyof DrivingInputs, string> = {
  hardBrakingPer100Mi: 'Harsh Braking',
  phoneDistractionPerTrip: 'Phone Distraction',
  rapidAccelPer100Mi: 'Harsh Acceleration',
  sharpCorneringPer100Mi: 'Sharp Cornering',
  speedingPercent: 'Speeding',
};

const IMPROVABLE_INPUTS: (keyof DrivingInputs)[] = [
  'hardBrakingPer100Mi', 'phoneDistractionPerTrip', 'rapidAccelPer100Mi',
  'sharpCorneringPer100Mi', 'speedingPercent',
];

export function generateHints(inputs: DrivingInputs, currentScore: number): WhatIfHint[] {
  const hints: WhatIfHint[] = [];

  for (const field of IMPROVABLE_INPUTS) {
    const bounds = INPUT_BOUNDS[field];
    const current = inputs[field];
    if (current <= bounds.min) continue;

    const targetSteps = [bounds.min, Math.round(current * 0.25), Math.round(current * 0.5)];
    let bestGain = 0;
    let bestTarget = current;

    for (const target of targetSteps) {
      const clamped = Math.max(bounds.min, target);
      if (clamped >= current) continue;
      const newScore = calculateDrivingScore({ ...inputs, [field]: clamped }).score;
      const gain = newScore - currentScore;
      if (gain > bestGain) {
        bestGain = gain;
        bestTarget = clamped;
      }
    }

    if (bestGain > 0) {
      hints.push({
        label: INPUT_LABELS[field],
        currentValue: current,
        suggestedValue: bestTarget,
        unit: bounds.unit,
        pointsGain: bestGain,
      });
    }
  }

  hints.sort((a, b) => b.pointsGain - a.pointsGain);
  return hints.slice(0, 3);
}

export const INPUT_BOUNDS: Record<keyof DrivingInputs, { min: number; max: number; step: number; unit: string }> = {
  hardBrakingPer100Mi:     { min: 0, max: 50,  step: 1, unit: 'events' },
  phoneDistractionPerTrip: { min: 0, max: 20,  step: 1, unit: 'events' },
  rapidAccelPer100Mi:      { min: 0, max: 50,  step: 1, unit: 'events' },
  sharpCorneringPer100Mi:  { min: 0, max: 40,  step: 1, unit: 'events' },
  speedingPercent:         { min: 0, max: 100, step: 1, unit: '%' },
};
