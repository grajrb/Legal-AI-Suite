import requests
import json

# Test login to see full response
url = "http://localhost:8001/api/auth/login"
data = {
    "email": "test1767686951@example.com",
    "password": "password123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Response:\n{json.dumps(result, indent=2)}")
    
    # Check user role
    if 'user' in result:
        print(f"\nUser Role: {result['user'].get('role')}")
        print(f"User Email: {result['user'].get('email')}")
except Exception as e:
    print(f"Error: {e}")
