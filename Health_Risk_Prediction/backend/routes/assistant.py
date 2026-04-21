"""
AI Assistant Router — Chat endpoint for the health chatbot.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.auth import get_current_user
from backend.models import User, PredictionResult
from backend import assistant_service

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    prediction_id: Optional[int] = None
    history: Optional[list] = []


class ChatResponse(BaseModel):
    response: str
    disclaimer: str


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a message to the AI Health Assistant.
    The assistant has context of the user's past predictions, or a specific prediction if ID is provided.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    is_specific = False
    
    # Fetch specific prediction context if requested
    if req.prediction_id:
        prediction = (
            db.query(PredictionResult)
            .filter(
                PredictionResult.id == req.prediction_id,
                PredictionResult.user_id == current_user.id
            )
            .first()
        )
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")
        predictions = [prediction]
        is_specific = True
    else:
        # Fetch user's general prediction history for context
        predictions = (
            db.query(PredictionResult)
            .filter(PredictionResult.user_id == current_user.id)
            .order_by(PredictionResult.created_at.desc())
            .limit(10)
            .all()
        )

    # Convert ORM objects to dicts
    pred_dicts = []
    for p in predictions:
        pred_dicts.append({
            "disease_name": p.disease_name,
            "risk_level": p.risk_level,
            "probability": p.probability,
            "input_data": p.input_data,
            "created_at": str(p.created_at),
        })

    # Call the Groq AI service
    result = assistant_service.chat(req.message, req.history, pred_dicts, is_specific)
    return result
