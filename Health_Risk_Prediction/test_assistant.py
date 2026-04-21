from fastapi.testclient import TestClient
from backend.main import app
import re

client = TestClient(app)

print("\n--- 1. Registering Test User ---")
user_data = {
    "email": "test_assistant@example.com",
    "password": "Password123!",
    "full_name": "Test User",
    "phone": "9998887776"
}
res_register = client.post("/api/auth/register", json=user_data)
print(f"Register Status: {res_register.status_code}")

print("\n--- 2. Logging In ---")
login_data = {
    "username": "test_assistant@example.com",
    "password": "Password123!"
}
res_login = client.post("/api/auth/login", json=login_data)
if res_login.status_code != 200:
    print("Login failed!", res_login.json())
    exit(1)

token = res_login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"Got Token!")

print("\n--- 3. Testing Assistant Chat ---")
mock_chat = {
    "message": "Can you explain what a high kidney disease risk means and what I should do?",
    "prediction_id": None
}
res_chat = client.post("/api/assistant/chat", json=mock_chat, headers=headers)
print(f"Chat Status: {res_chat.status_code}")
if res_chat.status_code == 200:
    print(f"Chat Response: {res_chat.json()['response'][:100]}...")
else:
    print(res_chat.json())
