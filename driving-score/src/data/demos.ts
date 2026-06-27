import { type DrivingInputs } from '../lib/scoring'

export interface DemoProfile {
  name: string;
  description: string;
  inputs: DrivingInputs;
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    name: 'Low Risk',
    description: 'Experienced driver, clean record, safe habits',
    inputs: {
      hardBrakingPer100Mi: 2,
      rapidAccelPer100Mi: 1,
      speedingPercent: 3,
      phoneDistractionPerTrip: 0,
      monthlyMiles: 1200,
      nightDrivingPercent: 8,
      avgTripDurationMin: 20,
      yearsExperience: 22,
      accidentsLast3Yr: 0,
      violationsLast3Yr: 0,
    },
  },
  {
    name: 'Average',
    description: 'Typical commuter, minor infractions',
    inputs: {
      hardBrakingPer100Mi: 12,
      rapidAccelPer100Mi: 10,
      speedingPercent: 20,
      phoneDistractionPerTrip: 4,
      monthlyMiles: 1800,
      nightDrivingPercent: 25,
      avgTripDurationMin: 35,
      yearsExperience: 7,
      accidentsLast3Yr: 1,
      violationsLast3Yr: 2,
    },
  },
  {
    name: 'High Risk',
    description: 'New driver, aggressive habits, multiple incidents',
    inputs: {
      hardBrakingPer100Mi: 38,
      rapidAccelPer100Mi: 32,
      speedingPercent: 55,
      phoneDistractionPerTrip: 14,
      monthlyMiles: 3800,
      nightDrivingPercent: 45,
      avgTripDurationMin: 110,
      yearsExperience: 2,
      accidentsLast3Yr: 4,
      violationsLast3Yr: 6,
    },
  },
]
