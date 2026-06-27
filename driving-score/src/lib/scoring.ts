export interface DrivingInputs {
  // Tier 1 — Core Driving Behavior (50% weight)
  hardBrakingPer100Mi: number;    // 0–50
  rapidAccelPer100Mi: number;     // 0–50
  speedingPercent: number;        // 0–100 (% of trip time over limit)
  phoneDistractionPerTrip: number; // 0–20

  // Tier 2 — Trip Context (30% weight)
  monthlyMiles: number;           // 0–5000
  nightDrivingPercent: number;    // 0–100 (% of driving 11pm–5am)
  avgTripDurationMin: number;     // 1–180

  // Tier 3 — Driver Profile (20% weight)
  yearsExperience: number;        // 0–50
  accidentsLast3Yr: number;       // 0–10
  violationsLast3Yr: number;      // 0–10
}

export type RiskCategory = 'Poor' | 'Fair' | 'Good' | 'Excellent';

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

const MIN_SCORE = 150;
const MAX_SCORE = 800;
const SCORE_RANGE = MAX_SCORE - MIN_SCORE;

const TIER_WEIGHTS = {
  behavior: 0.50,
  tripContext: 0.30,
  profile: 0.20,
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
  if (score < 350) return 'Poor';
  if (score < 500) return 'Fair';
  if (score < 650) return 'Good';
  return 'Excellent';
}

interface TierResult {
  score: number;
  factors: ScoreFactor[];
}

function scoreBehaviorTier(inputs: DrivingInputs): TierResult {
  const braking = normalize(inputs.hardBrakingPer100Mi, 0, 50, true);
  const accel = normalize(inputs.rapidAccelPer100Mi, 0, 50, true);
  const speeding = normalize(inputs.speedingPercent, 0, 100, true);
  const phone = normalize(inputs.phoneDistractionPerTrip, 0, 20, true);

  const weights = { braking: 0.30, accel: 0.25, speeding: 0.25, phone: 0.20 };
  const score = (braking * weights.braking + accel * weights.accel + speeding * weights.speeding + phone * weights.phone);

  const factors: ScoreFactor[] = [
    { input: 'hardBrakingPer100Mi', label: 'Hard Braking Events', impact: (1 - braking) * weights.braking, direction: braking >= 0.5 ? 'positive' : 'negative' },
    { input: 'rapidAccelPer100Mi', label: 'Rapid Acceleration', impact: (1 - accel) * weights.accel, direction: accel >= 0.5 ? 'positive' : 'negative' },
    { input: 'speedingPercent', label: 'Speeding Frequency', impact: (1 - speeding) * weights.speeding, direction: speeding >= 0.5 ? 'positive' : 'negative' },
    { input: 'phoneDistractionPerTrip', label: 'Phone Distraction', impact: (1 - phone) * weights.phone, direction: phone >= 0.5 ? 'positive' : 'negative' },
  ];

  return { score, factors };
}

function scoreTripContextTier(inputs: DrivingInputs): TierResult {
  let milesScore: number;
  if (inputs.monthlyMiles <= 2000) {
    milesScore = normalize(inputs.monthlyMiles, 0, 2000);
  } else {
    milesScore = normalize(inputs.monthlyMiles, 2000, 5000, true);
  }

  const nightScore = normalize(inputs.nightDrivingPercent, 0, 100, true);

  let durationScore: number;
  if (inputs.avgTripDurationMin <= 45) {
    durationScore = normalize(inputs.avgTripDurationMin, 1, 45);
  } else {
    durationScore = normalize(inputs.avgTripDurationMin, 45, 180, true);
  }

  const weights = { miles: 0.35, night: 0.35, duration: 0.30 };
  const score = milesScore * weights.miles + nightScore * weights.night + durationScore * weights.duration;

  const factors: ScoreFactor[] = [
    { input: 'monthlyMiles', label: 'Monthly Miles Driven', impact: (1 - milesScore) * weights.miles, direction: milesScore >= 0.5 ? 'positive' : 'negative' },
    { input: 'nightDrivingPercent', label: 'Night Driving Ratio', impact: (1 - nightScore) * weights.night, direction: nightScore >= 0.5 ? 'positive' : 'negative' },
    { input: 'avgTripDurationMin', label: 'Avg Trip Duration', impact: (1 - durationScore) * weights.duration, direction: durationScore >= 0.5 ? 'positive' : 'negative' },
  ];

  return { score, factors };
}

function scoreProfileTier(inputs: DrivingInputs): TierResult {
  const experience = normalize(inputs.yearsExperience, 0, 50);
  const accidents = normalize(inputs.accidentsLast3Yr, 0, 10, true);
  const violations = normalize(inputs.violationsLast3Yr, 0, 10, true);

  const weights = { experience: 0.30, accidents: 0.40, violations: 0.30 };
  const score = experience * weights.experience + accidents * weights.accidents + violations * weights.violations;

  const factors: ScoreFactor[] = [
    { input: 'yearsExperience', label: 'Years of Experience', impact: (1 - experience) * weights.experience, direction: experience >= 0.5 ? 'positive' : 'negative' },
    { input: 'accidentsLast3Yr', label: 'Accident History', impact: (1 - accidents) * weights.accidents, direction: accidents >= 0.5 ? 'positive' : 'negative' },
    { input: 'violationsLast3Yr', label: 'Traffic Violations', impact: (1 - violations) * weights.violations, direction: violations >= 0.5 ? 'positive' : 'negative' },
  ];

  return { score, factors };
}

export function calculateDrivingScore(inputs: DrivingInputs): ScoringResult {
  const behavior = scoreBehaviorTier(inputs);
  const tripContext = scoreTripContextTier(inputs);
  const profile = scoreProfileTier(inputs);

  const weightedScore =
    behavior.score * TIER_WEIGHTS.behavior +
    tripContext.score * TIER_WEIGHTS.tripContext +
    profile.score * TIER_WEIGHTS.profile;

  const finalScore = Math.round(MIN_SCORE + weightedScore * SCORE_RANGE);
  const clampedScore = clamp(finalScore, MIN_SCORE, MAX_SCORE);

  const tiers: TierBreakdown[] = [
    { name: 'Driving Behavior', weight: TIER_WEIGHTS.behavior, score: Math.round(behavior.score * TIER_WEIGHTS.behavior * SCORE_RANGE), maxScore: TIER_WEIGHTS.behavior * SCORE_RANGE },
    { name: 'Trip Context', weight: TIER_WEIGHTS.tripContext, score: Math.round(tripContext.score * TIER_WEIGHTS.tripContext * SCORE_RANGE), maxScore: TIER_WEIGHTS.tripContext * SCORE_RANGE },
    { name: 'Driver Profile', weight: TIER_WEIGHTS.profile, score: Math.round(profile.score * TIER_WEIGHTS.profile * SCORE_RANGE), maxScore: TIER_WEIGHTS.profile * SCORE_RANGE },
  ];

  const allFactors = [...behavior.factors, ...tripContext.factors, ...profile.factors];
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
  hardBrakingPer100Mi: 'Hard Braking',
  rapidAccelPer100Mi: 'Rapid Acceleration',
  speedingPercent: 'Speeding Frequency',
  phoneDistractionPerTrip: 'Phone Distraction',
  monthlyMiles: 'Monthly Miles',
  nightDrivingPercent: 'Night Driving',
  avgTripDurationMin: 'Trip Duration',
  yearsExperience: 'Experience',
  accidentsLast3Yr: 'Accidents',
  violationsLast3Yr: 'Violations',
};

const IMPROVABLE_INPUTS: (keyof DrivingInputs)[] = [
  'hardBrakingPer100Mi', 'rapidAccelPer100Mi', 'speedingPercent',
  'phoneDistractionPerTrip', 'nightDrivingPercent',
  'accidentsLast3Yr', 'violationsLast3Yr',
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
  hardBrakingPer100Mi:    { min: 0, max: 50,   step: 1,  unit: 'events' },
  rapidAccelPer100Mi:     { min: 0, max: 50,   step: 1,  unit: 'events' },
  speedingPercent:        { min: 0, max: 100,  step: 1,  unit: '%' },
  phoneDistractionPerTrip:{ min: 0, max: 20,   step: 1,  unit: 'events' },
  monthlyMiles:           { min: 0, max: 5000, step: 50, unit: 'miles' },
  nightDrivingPercent:    { min: 0, max: 100,  step: 1,  unit: '%' },
  avgTripDurationMin:     { min: 1, max: 180,  step: 1,  unit: 'min' },
  yearsExperience:        { min: 0, max: 50,   step: 1,  unit: 'years' },
  accidentsLast3Yr:       { min: 0, max: 10,   step: 1,  unit: '' },
  violationsLast3Yr:      { min: 0, max: 10,   step: 1,  unit: '' },
};
