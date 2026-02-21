from fastapi import FastAPI, HTTPException, status
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from database import create_tables, create_user, get_all_users, update_user, get_user_by_email, get_plans_by_county, User as DBUser
from schemas import UserCreate, UserResponse, UserUpdate, PlanResponse

app = FastAPI(title="Health Insurance API", version="1.0.0")

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

@app.get("/")
async def root():
    return {"message": "Welcome to Health Insurance API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    # Check if user already exists
    existing_user = get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    db_user = create_user(
        full_name=user.full_name,
        email=user.email,
        income_profile=user.income_profile,
        coverage=user.coverage,
        county=user.county
    )
    
    return UserResponse(
        id=db_user.id,
        full_name=db_user.full_name,
        email=db_user.email,
        income_profile=db_user.income_profile,
        coverage=db_user.coverage,
        county=db_user.county,
        created_at=str(db_user.created_at),
        updated_at=str(db_user.updated_at)
    )

@app.get("/users", response_model=List[UserResponse])
async def get_all_users_endpoint():
    users = get_all_users()
    return [
        UserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            income_profile=user.income_profile,
            coverage=user.coverage,
            county=user.county,
            created_at=str(user.created_at),
            updated_at=str(user.updated_at)
        ) for user in users
    ]

@app.get("/users/{email}", response_model=UserResponse)
async def get_user(email: str):
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        income_profile=user.income_profile,
        coverage=user.coverage,
        county=user.county,
        created_at=str(user.created_at),
        updated_at=str(user.updated_at)
    )

@app.put("/users/{email}", response_model=UserResponse)
async def update_user_endpoint(
    email: str,
    user_update: UserUpdate
):
    current_user = get_user_by_email(email)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    updated_user = update_user(
        user_id=current_user.id,
        full_name=user_update.full_name,
        income_profile=user_update.income_profile,
        coverage=user_update.coverage,
        county=user_update.county
    )
    
    return UserResponse(
        id=updated_user.id,
        full_name=updated_user.full_name,
        email=updated_user.email,
        income_profile=updated_user.income_profile,
        coverage=updated_user.coverage,
        county=updated_user.county,
        created_at=str(updated_user.created_at),
        updated_at=str(updated_user.updated_at)
    )

if __name__ == "__main__":
    import hypercorn
    import asyncio
    from hypercorn.config import Config
    from hypercorn.asyncio import serve
    
    config = Config()
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    config.bind = [f"{host}:{port}"]
    asyncio.run(serve(app, config))

@app.get("/plans/{county}", response_model=List[PlanResponse])
async def get_plans(county: str):
    plans = get_plans_by_county(county)
    return [
        PlanResponse(
            Health_Insurance_Provider=plan.Health_Insurance_Provider,
            Health_Insurance_Plan=plan.Health_Insurance_Plan,
            Plan_Marketing_Name=plan.Plan_Marketing_Name,
            County=plan.County,
            Metal=plan.Metal,
            Premium_21_Year_Old=plan.Premium_21_Year_Old,
            Deductible_21_Year_Old=plan.Deductible_21_Year_Old,
            Copay_Primary_Care=plan.Copay_Primary_Care,
            Copay_Specialist=plan.Copay_Specialist,
            Copay_Emergency_Room=plan.Copay_Emergency_Room,
            Subsidy_Details=plan.Subsidy_Details
        ) for plan in plans
    ]
