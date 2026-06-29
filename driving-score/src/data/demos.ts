import { type DrivingInputs } from '../lib/scoring'

export interface DemoProfile {
  name: string;
  description: string;
  inputs: DrivingInputs;
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    name: 'Safe Driver',
    description: 'Smooth driving, no phone use, no incidents',
    inputs: {
      hardBrakingPer100Mi: 2,
      phoneDistractionPerTrip: 0,
      rapidAccelPer100Mi: 1,
      sharpCorneringPer100Mi: 3,
      speedingPercent: 2,
    },
  },
  {
    name: 'Average Driver',
    description: 'Typical commuter, occasional harsh events',
    inputs: {
      hardBrakingPer100Mi: 15,
      phoneDistractionPerTrip: 5,
      rapidAccelPer100Mi: 12,
      sharpCorneringPer100Mi: 10,
      speedingPercent: 18,
    },
  },
  {
    name: 'Risky Driver',
    description: 'Aggressive habits, frequent phone use',
    inputs: {
      hardBrakingPer100Mi: 35,
      phoneDistractionPerTrip: 14,
      rapidAccelPer100Mi: 30,
      sharpCorneringPer100Mi: 28,
      speedingPercent: 55,
    },
  },
]
