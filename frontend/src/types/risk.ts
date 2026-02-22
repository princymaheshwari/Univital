export interface FormData {
  name: string;
  email: string;
  password: string;
  school: string;
  major: string;
  year: string;
  income: string;
  status: string;
  sex: string;
  age: string;
  height: string;
  weight: string;
  county: string;
}

export interface Medication {
  name: string;
  dose: string;
  time: string;
  taken: boolean;
  icon: string;
  color: string;
}

// TODO: per-plan fragility curve data points
export interface FragilityCurvePoint {
  income: number;
  netPremium: number;
  fragilitySlope: number;
}

// TODO: per-plan risk metrics from Databricks serving endpoint
export interface RiskMetrics {
  fragilityScore: number;
  cliffDistance: number;
  breachProbability: number;
  p90Exposure: number;
  stabilityCategory: string;
}
