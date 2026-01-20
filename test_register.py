import requests
import json

url = "http://localhost:8001/api/auth/register"
import time
data = {
    "email": f"test{int(time.time())}@example.com",  # Unique email each time
    "password": "password123",
    "full_name": "Test User",
    "role": "lawyer"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
