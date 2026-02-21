import requests

BASE_URL = "http://localhost:8000"


def test_health():
    print("1. GET /health")
    r = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {r.status_code}  Body: {r.json()}\n")


def test_create_user():
    print("2. POST /users")
    payload = {
        "full_name": "Jane Doe",
        "email": "jane.doe@example.com",
        "income_profile": 28000.0,
        "coverage": "individual",
        "county": "Fulton",
    }
    r = requests.post(f"{BASE_URL}/users", json=payload)
    print(f"   Status: {r.status_code}  Body: {r.json()}\n")
    return r.json() if r.status_code == 201 else None


def test_get_all_users():
    print("3. GET /users")
    r = requests.get(f"{BASE_URL}/users")
    print(f"   Status: {r.status_code}  Body: {r.json()}\n")


def test_get_user_by_email(email: str):
    print(f"4. GET /users/{email}")
    r = requests.get(f"{BASE_URL}/users/{email}")
    print(f"   Status: {r.status_code}  Body: {r.json()}\n")


def test_update_user(email: str):
    print(f"5. PUT /users/{email}")
    payload = {"income_profile": 32000.0, "coverage": "family"}
    r = requests.put(f"{BASE_URL}/users/{email}", json=payload)
    print(f"   Status: {r.status_code}  Body: {r.json()}\n")


def test_get_plans(county: str):
    print(f"6. GET /plans/{county}")
    r = requests.get(f"{BASE_URL}/plans/{county}")
    print(f"   Status: {r.status_code}  Body: {r.json()}\n")


def test_risk_stub():
    print("7. POST /risk (stub)")
    r = requests.post(f"{BASE_URL}/risk")
    print(f"   Status: {r.status_code}  Body: {r.json()}\n")


def test_shock_stub():
    print("8. POST /shock (stub)")
    r = requests.post(f"{BASE_URL}/shock")
    print(f"   Status: {r.status_code}  Body: {r.json()}\n")


def test_policy_query_stub():
    print("9. POST /policy/query (stub)")
    r = requests.post(f"{BASE_URL}/policy/query")
    print(f"   Status: {r.status_code}  Body: {r.json()}\n")


if __name__ == "__main__":
    print("=== UniVital API Tests ===\n")
    test_health()
    user = test_create_user()
    test_get_all_users()

    email = user["email"] if user else "jane.doe@example.com"
    test_get_user_by_email(email)
    test_update_user(email)

    test_get_plans("Fulton")

    test_risk_stub()
    test_shock_stub()
    test_policy_query_stub()
