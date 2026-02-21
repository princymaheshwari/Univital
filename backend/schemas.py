from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    income_profile: float
    coverage: str
    county: str

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    income_profile: Optional[float] = None
    coverage: Optional[str] = None
    county: Optional[str] = None

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
