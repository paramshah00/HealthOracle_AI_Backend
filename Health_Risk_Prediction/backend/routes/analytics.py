from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import asc
import json

from backend.database import get_db
from backend.models import User, PredictionResult
from backend.auth import get_current_user
from backend.ml_service import DISEASE_REGISTRY

router = APIRouter()

@router.get("/personal")
def get_personal_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns historical tracking of the user's health parameters 
    across multiple predictions, grouped by disease name.
    Only includes diseases that are still active in the registry.
    """
    predictions = (
        db.query(PredictionResult)
        .filter(PredictionResult.user_id == current_user.id)
        .order_by(asc(PredictionResult.created_at))
        .all()
    )

    disease_data = {}

    for p in predictions:
        disease = p.disease_name
        # Skip predictions for diseases that have been removed from the registry
        if disease not in DISEASE_REGISTRY:
            continue
        
        if disease not in disease_data:
            # Derive chartable fields from the DISEASE_REGISTRY for this disease
            # We include all features so the frontend exactly matches the input form
            chartable = []
            for feat in DISEASE_REGISTRY[disease].get("features", []):
                chartable.append({
                    "field_name": feat["name"],
                    "label": feat.get("label", feat["name"]),
                    "unit": feat.get("unit", "")
                })

            disease_data[disease] = {
                "trends": [],
                "risk_distribution": {"Low": 0, "Moderate": 0, "High": 0, "Critical": 0},
                "chartable_fields": chartable
            }
        
        disease_data[disease]["trends"].append({
            "id": p.id,
            "disease_name": disease,
            "date": p.created_at.isoformat(),
            "probability": p.probability,
            "risk_level": p.risk_level,
            "metrics": p.input_data  # JSON dictionary of inputs (Glucose, BMI, etc)
        })
        
        # Count risk distribution
        level = p.risk_level
        if level in disease_data[disease]["risk_distribution"]:
            disease_data[disease]["risk_distribution"][level] += 1
        elif level == "High Risk": # fallback mappings just in case
            disease_data[disease]["risk_distribution"]["High"] += 1
        else:
            disease_data[disease]["risk_distribution"]["Low"] += 1

    return disease_data

@router.get("/public")
def get_public_analytics(db: Session = Depends(get_db)):
    """
    Returns aggregated and anonymized stats for comparing a user's 
    metrics against system averages for High Risk vs Low Risk patients,
    grouped by disease name.
    Explicitly excludes 'Pregnancies'.
    """
    all_predictions = db.query(PredictionResult).all()

    # Dictionary to hold accumulators per disease
    # format: { disease_name: { "high_sums": {}, "high_counts": {}, "low_sums": {}, "low_counts": {} } }
    accumulators = {}

    for p in all_predictions:
        disease = p.disease_name
        # Skip predictions for diseases that have been removed from the registry
        if disease not in DISEASE_REGISTRY:
            continue
        
        if disease not in accumulators:
            accumulators[disease] = {
                "high_sums": {}, "high_counts": {},
                "low_sums": {}, "low_counts": {}
            }
            
        acc = accumulators[disease]
        is_high_risk = (p.prediction == 1)
        data = p.input_data

        for key, value in data.items():
            if key.lower() == 'pregnancies':
                continue # Exclude pregnancies from public comparison
            
            num_val = None
            try:
                num_val = float(value)
            except (ValueError, TypeError):
                # Try handling Yes/No, True/False
                val_lower = str(value).strip().lower()
                if val_lower in ["yes", "true", "y"]:
                    num_val = 1.0
                elif val_lower in ["no", "false", "n"]:
                    num_val = 0.0

            if num_val is None:
                continue

            if is_high_risk:
                acc["high_sums"][key] = acc["high_sums"].get(key, 0) + num_val
                acc["high_counts"][key] = acc["high_counts"].get(key, 0) + 1
            else:
                acc["low_sums"][key] = acc["low_sums"].get(key, 0) + num_val
                acc["low_counts"][key] = acc["low_counts"].get(key, 0) + 1

    # Compute averages per disease
    results = {}
    for disease, acc in accumulators.items():
        high_avgs = {k: round(acc["high_sums"][k] / acc["high_counts"][k], 2) for k in acc["high_sums"] if acc["high_counts"][k] > 0}
        low_avgs = {k: round(acc["low_sums"][k] / acc["low_counts"][k], 2) for k in acc["low_sums"] if acc["low_counts"][k] > 0}
        
        results[disease] = {
            "high_risk_averages": high_avgs,
            "low_risk_averages": low_avgs
        }

    return results
