"""
AI Health Assistant Service — Groq API Integration

Handles communication with Groq's LLM (Llama 3) to provide
personalized health guidance based on user's prediction history.
"""

import os
import json
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env file
load_dotenv()

# Initialize the Groq client
_client = None

def _get_client():
    """Lazily initialize Groq client to avoid import-time errors."""
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "your_groq_api_key_here":
            raise ValueError(
                "GROQ_API_KEY is not set. Please add your API key to the .env file. "
                "Get a free key at https://console.groq.com"
            )
        _client = Groq(api_key=api_key)
    return _client


MEDICAL_DISCLAIMER = (
    "⚕️ Disclaimer: I am an AI health assistant and NOT a substitute for professional "
    "medical advice, diagnosis, or treatment. Always consult a qualified healthcare "
    "provider for medical decisions."
)


def build_system_prompt(predictions: list, is_specific_prediction: bool = False) -> str:
    """
    Build a context-aware system prompt that includes the user's health history.
    """
    base_prompt = """You are HealthPredict AI, a friendly and advanced medical/lifestyle assistant.

Key Instructions:
1. Act exactly like a normal conversational AI (e.g., ChatGPT, Gemini). If the user says "hi" or asks a simple question, give a short, friendly, and natural conversational reply. DO NOT write long essays.
2. Only use structured, clinical breakdowns (with headers and bullet points) if you are specifically analyzing a complex health prediction result or requested to do so.
3. Keep your answers concise, natural, and directly relevant to the user's prompt. 
4. DO NOT manually add medical disclaimers at the end of every message, as the React application already renders a permanent disclaimer banner above the chat.
"""

    if predictions and len(predictions) > 0:
        if is_specific_prediction:
            base_prompt += "\n\n--- CURRENT PREDICTION CONTEXT ---\n"
            base_prompt += "The user is asking specifically about THIS recent prediction result:\n\n"
        else:
            base_prompt += "\n\n--- USER'S HEALTH HISTORY ---\n"
            base_prompt += f"The user has {len(predictions)} past prediction(s):\n\n"
        
        for i, pred in enumerate(predictions[-5:], 1):  # Last 5 predictions
            if not is_specific_prediction:
                base_prompt += f"Record {i}:\n"
            base_prompt += f"  Disease: {pred.get('disease_name', 'Unknown')}\n"
            base_prompt += f"  Risk Level: {pred.get('risk_level', 'Unknown')}\n"
            base_prompt += f"  Probability: {round(pred.get('probability', 0) * 100, 1)}%\n"

            input_data = pred.get('input_data', {})
            if input_data:
                base_prompt += f"  Health Metrics: {json.dumps(input_data)}\n"
            base_prompt += "\n"

        if is_specific_prediction:
            base_prompt += (
                "Focus your advice specifically on this prediction result and the provided health metrics. "
                "Explain what the risk level means based on their specific inputs.\n"
            )
        else:
            base_prompt += (
                "Use this health history to personalize your responses. "
                "Reference specific metrics when giving advice.\n"
            )

    return base_prompt


def chat(message: str, history: list = None, predictions: list = None, is_specific_prediction: bool = False) -> dict:
    """
    Send a user message and conversation history to Groq API to return context-aware AI response.
    
    Args:
        message: The user's chat message
        history: List of prior message dicts [{"role": "user"/"assistant", "content": "..."}]
        predictions: List of user's past prediction dicts for context
        is_specific_prediction: True if context is a single targeted prediction
    
    Returns:
        dict with 'response' and 'disclaimer' keys
    """
    client = _get_client()
    system_prompt = build_system_prompt(predictions or [], is_specific_prediction)
    
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for msg in history:
            role = msg.get("role", "user")
            if role == "ai": role = "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})
    
    messages.append({"role": "user", "content": message})

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_completion_tokens=1024,
            top_p=1,
            stream=False,
        )

        ai_response = completion.choices[0].message.content
        return {
            "response": ai_response,
            "disclaimer": MEDICAL_DISCLAIMER,
        }

    except Exception as e:
        error_msg = str(e)
        if "authentication" in error_msg.lower() or "api key" in error_msg.lower():
            return {
                "response": "❌ API key error. Please check your GROQ_API_KEY in the .env file.",
                "disclaimer": MEDICAL_DISCLAIMER,
            }
        return {
            "response": f"I'm having trouble connecting right now. Please try again in a moment. (Error: {error_msg})",
            "disclaimer": MEDICAL_DISCLAIMER,
        }
