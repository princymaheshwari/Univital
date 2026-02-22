import json
import os
from typing import Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def match_demo_profile(user_dict: dict) -> str:
    points = 0
    if user_dict.get("income_profile", 50000) < 18000:
        points += 1
    if user_dict.get("medication_count", 0) >= 2:
        points += 1
    if user_dict.get("expected_er_visits", 0) >= 0.5:
        points += 1
    if user_dict.get("therapy_frequency", 0) >= 1.0:
        points += 1

    if points <= 1:
        tier = "lowrisk"
    elif points <= 2:
        tier = "midrisk"
    else:
        tier = "highrisk"

    county = user_dict.get("county", "fulton").lower().replace(" ", "").replace("county", "").strip()
    return f"profile_{tier}_{county}"


def _synthesize_distribution_points(plan: dict) -> list:
    """Interpolate a CDF curve from precomputed percentile anchors.

    This is NOT Monte Carlo recomputation — just piecewise-linear
    interpolation between the known quantiles already in the Gold export.
    """
    deductible = plan.get("deductible", 3000)
    bp = plan.get("breach_probability", 0.3)
    p90 = plan.get("p90_exposure", 7000)
    oop_max = plan.get("oop_max", 9000)

    f_ded = max(0.01, min(0.99, 1.0 - bp))
    pts: list[tuple[float, float]] = []

    n1 = 10
    for i in range(n1 + 1):
        t = i / n1
        cost = deductible * t
        prob = f_ded * (t ** 0.65)
        pts.append((round(cost), round(prob, 4)))

    gap = p90 - deductible
    if gap > 0:
        n2 = 8
        for i in range(1, n2 + 1):
            t = i / n2
            cost = deductible + gap * t
            prob = f_ded + (0.9 - f_ded) * (t ** 0.8)
            pts.append((round(cost), round(prob, 4)))
    else:
        pts.append((round(p90), 0.9))

    tail = oop_max - p90
    if tail > 0:
        n3 = 6
        for i in range(1, n3 + 1):
            t = i / n3
            cost = p90 + tail * t
            prob = min(0.9 + 0.098 * (t ** 1.5), 0.998)
            pts.append((round(cost), round(prob, 4)))
    else:
        pts.append((round(oop_max), 0.998))

    return [{"cost": c, "cumulative_probability": p} for c, p in pts]


def load_profile(profile_key: str, scenario: str = "baseline") -> Optional[list]:
    if scenario == "baseline":
        filename = f"{profile_key}.json"
    else:
        filename = f"{profile_key}__{scenario}.json"

    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return None

    with open(path, "r") as f:
        data = json.load(f)

    for plan in data:
        if "expected_annual_total_cost" not in plan:
            plan["expected_annual_total_cost"] = round(
                12 * plan.get("net_premium", 0) + plan.get("mean_oop", 0), 2
            )
        if "distribution_points" not in plan or not plan["distribution_points"]:
            plan["distribution_points"] = _synthesize_distribution_points(plan)

    return data
