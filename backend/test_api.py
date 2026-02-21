import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("Testing Health Insurance API...")
    
    # Test health endpoint
    print("\n1. Testing health endpoint:")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test user registration
    print("\n2. Testing user registration:")
    user_data = {
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "password": "securepassword123",
        "income_profile": 75000.0,
        "coverage": "premium"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=user_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 201:
        user = response.json()
        
        # Test login
        print("\n3. Testing login:")
        login_data = {
            "email": "john.doe@example.com",
            "password": "securepassword123"
        }
        
        response = requests.post(f"{BASE_URL}/login", json=login_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test protected endpoint - get current user
            print("\n4. Testing protected endpoint - get current user:")
            response = requests.get(f"{BASE_URL}/users/me", headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
            
            # Test protected endpoint - get all users
            print("\n5. Testing protected endpoint - get all users:")
            response = requests.get(f"{BASE_URL}/users", headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_api()
