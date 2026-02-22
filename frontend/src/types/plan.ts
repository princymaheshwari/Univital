export interface PlanResponse {
  Health_Insurance_Provider: string | null;
  Health_Insurance_Plan: string | null;
  Plan_Marketing_Name: string | null;
  County: string | null;
  Metal: string | null;
  Premium_21_Year_Old: string | null;
  Deductible_21_Year_Old: string | null;
  Copay_Primary_Care: string | null;
  Copay_Specialist: string | null;
  Copay_Emergency_Room: string | null;
  Subsidy_Details: string | null;
}

export interface MappedPlan {
  name: string;
  planName?: string;
  compatibility: number;
  savings: string;
  color: string;
  risk: string;
  details: string;
  premium?: string | null;
  deductible?: string | null;
  copayPrimary?: string | null;
  copaySpecialist?: string | null;
  copayER?: string | null;
  metal?: string | null;
  raw?: PlanResponse;
}

export interface Discount {
  name: string;
  store: string;
  price: string;
  off: string;
}
