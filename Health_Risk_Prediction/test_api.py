from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

diseases = ["heart_disease", "hypertension", "stroke", "kidney_disease"]

for disease in diseases:
    print(f"\n--- Testing Features Endpoint for {disease} ---")
    res = client.get(f"/api/predict/diseases/{disease}/features")
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        features = res.json().get('features', [])
        print(f"Features mapped: {len(features)}")
    else:
        print(res.json())

# Test prediction with mock payload
print("\n--- Testing Prediction Routing for Heart Disease ---")
mock_payload = {
    "age": 55, "sex": 1, "cp": 2, "trestbps": 140, "chol": 240,
    "fbs": 0, "restecg": 1, "thalach": 150, "exang": 0, "oldpeak": 0.5,
    "slope": 1, "ca": 0, "thal": 2
}
res = client.post("/api/predict/heart_disease", json=mock_payload)
print(f"Status: {res.status_code}")
if res.status_code == 200:
    print(f"Prediction Result: {res.json()}")
else:
    print(res.json())
