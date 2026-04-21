from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import User, PredictionResult
from backend.auth import get_current_user
from backend import ml_service

router = APIRouter()


@router.get("/diseases")
def list_diseases():
    """List all diseases with their availability and feature schemas."""
    diseases = ml_service.get_available_diseases()
    return {"diseases": diseases}


@router.get("/diseases/{disease}/features")
def get_disease_features(disease: str):
    """Get the feature schema (field names, types, ranges) for a disease."""
    try:
        features = ml_service.get_disease_features(disease)
        config = ml_service.DISEASE_REGISTRY[disease]
        return {
            "disease": disease,
            "display_name": config["display_name"],
            "features": features,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{disease}")
def predict_disease(
    disease: str,
    feature_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit health data and get a disease risk prediction.
    The feature_data should contain all required features for the disease model.
    """
    try:
        result = ml_service.predict(disease, feature_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Save prediction to database
    db_prediction = PredictionResult(
        user_id=current_user.id,
        disease_name=disease,
        input_data=feature_data,
        prediction=result["prediction"],
        probability=result["probability"],
        risk_level=result["risk_level"],
    )
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)

    return {
        "id": db_prediction.id,
        "disease": disease,
        "display_name": ml_service.DISEASE_REGISTRY[disease]["display_name"],
        "prediction": result["prediction"],
        "label": result["label"],
        "probability": result["probability"],
        "risk_level": result["risk_level"],
        "guidance": result["guidance"],
        "input_data": feature_data,
        "created_at": db_prediction.created_at.isoformat(),
    }


@router.get("/history")
def get_prediction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's prediction history, latest first."""
    predictions = (
        db.query(PredictionResult)
        .filter(PredictionResult.user_id == current_user.id)
        .order_by(desc(PredictionResult.created_at))
        .all()
    )

    return {
        "total": len(predictions),
        "predictions": [
            {
                "id": p.id,
                "disease_name": p.disease_name,
                "display_name": ml_service.DISEASE_REGISTRY.get(
                    p.disease_name, {}
                ).get("display_name", p.disease_name),
                "prediction": p.prediction,
                "probability": p.probability,
                "risk_level": p.risk_level,
                "created_at": p.created_at.isoformat(),
            }
            for p in predictions
        ],
    }


@router.get("/history/{prediction_id}")
def get_prediction_detail(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get full details of a specific prediction."""
    prediction = (
        db.query(PredictionResult)
        .filter(
            PredictionResult.id == prediction_id,
            PredictionResult.user_id == current_user.id,
        )
        .first()
    )

    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    disease = prediction.disease_name
    config = ml_service.DISEASE_REGISTRY.get(disease, {})

    # Regenerate guidance from stored probability
    guidance = ml_service.get_health_guidance(
        disease, prediction.probability, prediction.risk_level
    )

    return {
        "id": prediction.id,
        "disease_name": disease,
        "display_name": config.get("display_name", disease),
        "prediction": prediction.prediction,
        "label": config.get("positive_label", "Positive") if prediction.prediction == 1 else config.get("negative_label", "Negative"),
        "probability": prediction.probability,
        "risk_level": prediction.risk_level,
        "input_data": prediction.input_data,
        "guidance": guidance,
        "created_at": prediction.created_at.isoformat(),
    }
