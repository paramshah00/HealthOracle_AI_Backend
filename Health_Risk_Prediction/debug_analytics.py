from backend.database import SessionLocal
from backend.models import PredictionResult, User

db = SessionLocal()

users = db.query(User).all()
print("Users:")
for u in users:
    count = db.query(PredictionResult).filter(PredictionResult.user_id == u.id).count()
    diseases = db.query(PredictionResult.disease_name).filter(PredictionResult.user_id == u.id).distinct().all()
    disease_list = [d[0] for d in diseases]
    print(f"  id={u.id}, name={u.full_name}, email={u.email} -> {count} predictions, diseases: {disease_list}")

# Check the analytics endpoint response for the user with most predictions
print("\n--- Analytics API Response Debug ---")
from sqlalchemy import asc

# Find user with most predictions
max_user = max(users, key=lambda u: db.query(PredictionResult).filter(PredictionResult.user_id == u.id).count())
print(f"\nUser with most data: {max_user.full_name} (id={max_user.id})")

predictions = (
    db.query(PredictionResult)
    .filter(PredictionResult.user_id == max_user.id)
    .order_by(asc(PredictionResult.created_at))
    .all()
)

disease_data = {}
for p in predictions:
    disease = p.disease_name
    if disease not in disease_data:
        disease_data[disease] = {"trends": [], "count": 0}
    disease_data[disease]["count"] += 1
    disease_data[disease]["trends"].append({
        "id": p.id,
        "date": p.created_at.isoformat() if p.created_at else None,
        "probability": p.probability,
        "risk_level": p.risk_level,
        "has_input_data": p.input_data is not None,
        "input_data_type": type(p.input_data).__name__,
        "input_data_keys": list(p.input_data.keys()) if isinstance(p.input_data, dict) else str(p.input_data)[:100]
    })

print("\nDisease data summary:")
for disease, info in disease_data.items():
    print(f"  {disease}: {info['count']} predictions")
    for t in info['trends'][:2]:
        print(f"    id={t['id']}, date={t['date']}, prob={t['probability']}, input_type={t['input_data_type']}, keys={t['input_data_keys']}")

db.close()
