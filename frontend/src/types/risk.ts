export interface FormData {
  name: string;
  email: string;
  county: string;
  income: string;
  medicationCount: string;
  expectedErVisits: string;
  therapyFrequency: string;
}

export interface FragilityCurvePoint {
  income: number;
  net_premium: number;
  subsidy: number;
  fragility_slope: number;
  discontinuity_flag: boolean;
}

export interface DistributionPoint {
  cost: number;
  cumulative_probability: number;
}

export interface RiskPlanProfile {
  plan_id: string;
  provider?: string;
  metal_tier?: string;
  net_premium: number;
  fragility_slope: number;
  elasticity_ratio: number;
  distance_to_cliff: number;
  stability_classification: string;
  fragility_level: string;
  breach_probability: number;
  mean_oop: number;
  p90_exposure: number;
  expected_annual_total_cost: number;
  oop_max?: number;
  deductible?: number;
  base_premium?: number;
  premium_fragility_curve: FragilityCurvePoint[];
  distribution_points?: DistributionPoint[];
  annual_cost_samples?: number[];
}

export interface RiskResponse {
  profile_key: string;
  county?: string;
  annual_income?: number;
  plans: RiskPlanProfile[];
}

export interface ShockPlanDelta {
  plan_id: string;
  provider?: string;
  delta_expected_annual_total_cost: number;
  delta_net_premium_monthly: number;
  delta_breach_probability: number;
  delta_p90_exposure: number;
  shocked_net_premium: number;
  shocked_breach_probability: number;
  shocked_p90_exposure: number;
  shocked_expected_annual_total_cost: number;
}

export interface ShockResponse {
  profile_key: string;
  scenario_type: string;
  results: ShockPlanDelta[];
}
