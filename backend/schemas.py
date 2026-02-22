from pydantic import BaseModel, EmailStr
from typing import Optional, List


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    income_profile: float
    coverage: str
    county: str
    medication_count: int = 0
    expected_er_visits: float = 0.0
    therapy_frequency: float = 0.0
    income_volatility: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    income_profile: Optional[float] = None
    coverage: Optional[str] = None
    county: Optional[str] = None
    medication_count: Optional[int] = None
    expected_er_visits: Optional[float] = None
    therapy_frequency: Optional[float] = None
    income_volatility: Optional[str] = None


class UserResponse(UserBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PlanResponse(BaseModel):
    Health_Insurance_Provider: Optional[str] = None
    Health_Insurance_Plan: Optional[str] = None
    Plan_Marketing_Name: Optional[str] = None
    County: Optional[str] = None
    Metal: Optional[str] = None
    Premium_21_Year_Old: Optional[str] = None
    Deductible_21_Year_Old: Optional[str] = None
    Copay_Primary_Care: Optional[str] = None
    Copay_Specialist: Optional[str] = None
    Copay_Emergency_Room: Optional[str] = None
    Subsidy_Details: Optional[str] = None

    class Config:
        from_attributes = True


class FragilityCurvePoint(BaseModel):
    income: float
    net_premium: float
    subsidy: float = 0
    fragility_slope: float = 0
    discontinuity_flag: bool = False


class DistributionPoint(BaseModel):
    cost: float
    cumulative_probability: float


class RiskPlanProfile(BaseModel):
    plan_id: str
    provider: Optional[str] = None
    metal_tier: Optional[str] = None
    net_premium: float
    fragility_slope: float
    elasticity_ratio: float
    distance_to_cliff: float
    stability_classification: str = "Stable"
    fragility_level: str = "Low"
    breach_probability: float
    mean_oop: float
    p90_exposure: float
    expected_annual_total_cost: float
    oop_max: Optional[float] = None
    deductible: Optional[float] = None
    base_premium: Optional[float] = None
    premium_fragility_curve: List[FragilityCurvePoint] = []
    distribution_points: List[DistributionPoint] = []


class RiskResponse(BaseModel):
    profile_key: str
    county: Optional[str] = None
    annual_income: Optional[float] = None
    plans: List[RiskPlanProfile]


class ShockRequest(BaseModel):
    scenario_type: str


class ShockPlanDelta(BaseModel):
    plan_id: str
    provider: Optional[str] = None
    delta_expected_annual_total_cost: float
    delta_net_premium_monthly: float
    delta_breach_probability: float
    delta_p90_exposure: float
    shocked_net_premium: float
    shocked_breach_probability: float
    shocked_p90_exposure: float
    shocked_expected_annual_total_cost: float


class ShockResponse(BaseModel):
    profile_key: str
    scenario_type: str
    results: List[ShockPlanDelta]


class ChatRequest(BaseModel):
    message: str
    tier_filter: Optional[List[str]] = None


class ChatResponse(BaseModel):
    reply: str
