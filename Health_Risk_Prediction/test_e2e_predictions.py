from fastapi.testclient import TestClient
from backend.main import app
import random

client = TestClient(app)

print("\n--- 1. Registering & Authenticating Test User ---")
user_data = {
    "email": f"e2e_test_{random.randint(1000,9999)}@example.com",
    "password": "Password123!",
    "full_name": "E2E Tester",
    "phone": f"9{random.randint(100000000,999999999)}"
}
client.post("/api/auth/register", json=user_data)
res_login = client.post("/api/auth/login", json={"username": user_data["email"], "password": "Password123!"})
token = res_login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("Successfully Authenticated.")

print("\n--- 2. Fetching Disease List ---")
res_diseases = client.get("/api/predict/diseases", headers=headers)
diseases = [d["key"] for d in res_diseases.json()["diseases"]]
print(f"Discovered Diseases: {diseases}")

print("\n--- 3. Testing E2E Inference for All Diseases ---")
for disease in diseases:
    print(f"\nEvaluating: {disease.upper()}")
    # 1. Get Schema
    res_schema = client.get(f"/api/predict/diseases/{disease}/features", headers=headers)
    if res_schema.status_code != 200:
        print(f"❌ Failed to fetch schema: {res_schema.json()}")
        continue
    
    features = res_schema.json()["features"]
    
    # 2. Build mock payload
    payload = {}
    for f in features:
        if f["type"] == "float":
            payload[f["name"]] = f.get("min", 0.0)
        elif f.get("options"):
            opt = f["options"][0]
            if isinstance(opt, dict):
                payload[f["name"]] = opt["value"]
            else:
                payload[f["name"]] = opt
        else:
            payload[f["name"]] = f.get("min", 0.0)
            
    print(f"  Payload size: {len(payload)} features")
    
    # 3. Predict
    res_predict = client.post(f"/api/predict/{disease}", json=payload, headers=headers)
    if res_predict.status_code == 200:
        data = res_predict.json()
        print(f"  [SUCCESS] Level={data['risk_level']}, Prob={round(data['probability']*100, 2)}%")
    else:
        print(f"  [FAILED] {res_predict.json()}")

print("\n--- E2E Tests Completed ---")
