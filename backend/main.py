from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

from database import (
    create_tables,
    create_user,
    get_all_users,
    update_user,
    get_user_by_email,
    get_plans_by_county,
    User as DBUser,
)
from schemas import (
    UserCreate, UserResponse, UserUpdate, PlanResponse,
    RiskResponse, RiskPlanProfile,
    ShockRequest, ShockResponse, ShockPlanDelta,
    ChatRequest, ChatResponse,
)
from risk_store import match_demo_profile, load_profile

app = FastAPI(title="UniVital API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    create_tables()


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "Welcome to UniVital API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# ── Users ────────────────────────────────────────────────────────────────────

def _user_to_response(user: DBUser) -> UserResponse:
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        income_profile=user.income_profile,
        coverage=user.coverage,
        county=user.county,
        medication_count=user.medication_count,
        expected_er_visits=user.expected_er_visits,
        therapy_frequency=user.therapy_frequency,
        income_volatility=user.income_volatility,
        created_at=str(user.created_at),
        updated_at=str(user.updated_at),
    )


@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    existing_user = get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    db_user = create_user(
        full_name=user.full_name,
        email=user.email,
        income_profile=user.income_profile,
        coverage=user.coverage,
        county=user.county,
        medication_count=user.medication_count,
        expected_er_visits=user.expected_er_visits,
        therapy_frequency=user.therapy_frequency,
        income_volatility=user.income_volatility,
    )
    return _user_to_response(db_user)


@app.get("/users", response_model=List[UserResponse])
async def get_all_users_endpoint():
    return [_user_to_response(u) for u in get_all_users()]


@app.get("/users/{email}", response_model=UserResponse)
async def get_user(email: str):
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_to_response(user)


@app.put("/users/{email}", response_model=UserResponse)
async def update_user_endpoint(email: str, user_update: UserUpdate):
    current_user = get_user_by_email(email)
    if not current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    updated_user = update_user(
        user_id=current_user.id,
        full_name=user_update.full_name,
        income_profile=user_update.income_profile,
        coverage=user_update.coverage,
        county=user_update.county,
        medication_count=user_update.medication_count,
        expected_er_visits=user_update.expected_er_visits,
        therapy_frequency=user_update.therapy_frequency,
        income_volatility=user_update.income_volatility,
    )
    return _user_to_response(updated_user)


# ── Plans ────────────────────────────────────────────────────────────────────

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
            Subsidy_Details=plan.Subsidy_Details,
        )
        for plan in plans
    ]


# ── Risk metrics ─────────────────────────────────────────────────────────────

@app.get("/risk/{email}", response_model=RiskResponse)
async def get_risk(email: str):
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_dict = {
        "income_profile": user.income_profile,
        "medication_count": user.medication_count,
        "expected_er_visits": user.expected_er_visits,
        "therapy_frequency": user.therapy_frequency,
        "county": user.county,
    }
    profile_key = match_demo_profile(user_dict)
    data = load_profile(profile_key, "baseline")

    if data is None:
        raise HTTPException(status_code=404, detail=f"No risk profile found for key: {profile_key}")

    return RiskResponse(
        profile_key=profile_key,
        county=user.county,
        annual_income=user.income_profile,
        plans=[RiskPlanProfile(**p) for p in data],
    )


# ── Shock scenarios ──────────────────────────────────────────────────────────

@app.post("/shock/{email}", response_model=ShockResponse)
async def run_shock(email: str, body: ShockRequest):
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_dict = {
        "income_profile": user.income_profile,
        "medication_count": user.medication_count,
        "expected_er_visits": user.expected_er_visits,
        "therapy_frequency": user.therapy_frequency,
        "county": user.county,
    }
    profile_key = match_demo_profile(user_dict)

    baseline = load_profile(profile_key, "baseline")
    if baseline is None:
        raise HTTPException(status_code=404, detail="Baseline profile not found")

    shocked = load_profile(profile_key, body.scenario_type)
    if shocked is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{body.scenario_type}' not found for profile '{profile_key}'",
        )

    baseline_map = {p["plan_id"]: p for p in baseline}
    results = []
    for sp in shocked:
        bp = baseline_map.get(sp["plan_id"])
        if not bp:
            continue
        results.append(ShockPlanDelta(
            plan_id=sp["plan_id"],
            provider=sp.get("provider"),
            delta_expected_annual_total_cost=round(sp["expected_annual_total_cost"] - bp["expected_annual_total_cost"], 2),
            delta_net_premium_monthly=round(sp["net_premium"] - bp["net_premium"], 2),
            delta_breach_probability=round(sp["breach_probability"] - bp["breach_probability"], 4),
            delta_p90_exposure=round(sp["p90_exposure"] - bp["p90_exposure"], 2),
            shocked_net_premium=sp["net_premium"],
            shocked_breach_probability=sp["breach_probability"],
            shocked_p90_exposure=sp["p90_exposure"],
            shocked_expected_annual_total_cost=sp["expected_annual_total_cost"],
        ))

    return ShockResponse(
        profile_key=profile_key,
        scenario_type=body.scenario_type,
        results=results,
    )


# ── Chatbot (Gemini + Actian VectorAI DB) ────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    try:
        import chatbot_service
        chatbot_service.ensure_index()
        reply = chatbot_service.query(body.message, body.tier_filter)
        return ChatResponse(reply=reply)
    except ImportError:
        raise HTTPException(status_code=501, detail="Chatbot dependencies not installed (google-genai, cortex)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {e}")


# ── Policy clause query (placeholder) ────────────────────────────────────────

@app.post("/policy/query")
async def query_policy_clauses():
    raise HTTPException(status_code=501, detail="Policy query not implemented yet")


# ── Entrypoint ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
