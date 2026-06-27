import { type CreditInputs } from '../lib/scoring'

export interface DemoProfile {
  name: string;
  description: string;
  inputs: CreditInputs;
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    name: 'Excellent Credit',
    description: 'Long history, low utilization, no missed payments',
    inputs: {
      onTimePaymentRate: 99,
      latePayments30: 0,
      latePayments60: 0,
      latePayments90: 0,
      defaultsOrCollections: 0,
      creditUtilizationPercent: 7,
      totalDebt: 12000,
      openAccounts: 5,
      oldestAccountYears: 25,
      avgAccountAgeYears: 12,
      creditTypes: 4,
      hardInquiries12Mo: 0,
      newAccounts12Mo: 0,
    },
  },
  {
    name: 'Fair Credit',
    description: 'Some late payments, moderate utilization',
    inputs: {
      onTimePaymentRate: 75,
      latePayments30: 7,
      latePayments60: 3,
      latePayments90: 2,
      defaultsOrCollections: 1,
      creditUtilizationPercent: 55,
      totalDebt: 48000,
      openAccounts: 9,
      oldestAccountYears: 5,
      avgAccountAgeYears: 2.5,
      creditTypes: 2,
      hardInquiries12Mo: 5,
      newAccounts12Mo: 3,
    },
  },
  {
    name: 'Poor Credit',
    description: 'Defaults, high utilization, thin file',
    inputs: {
      onTimePaymentRate: 50,
      latePayments30: 15,
      latePayments60: 7,
      latePayments90: 5,
      defaultsOrCollections: 3,
      creditUtilizationPercent: 92,
      totalDebt: 120000,
      openAccounts: 15,
      oldestAccountYears: 2,
      avgAccountAgeYears: 1,
      creditTypes: 1,
      hardInquiries12Mo: 12,
      newAccounts12Mo: 7,
    },
  },
]
