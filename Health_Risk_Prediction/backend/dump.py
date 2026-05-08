import json
from backend.database import SessionLocal
from backend.models import PredictionResult

db = SessionLocal()
preds = db.query(PredictionResult).all()
for p in preds:
    print(p.disease_name, p.input_data)
db.close()
