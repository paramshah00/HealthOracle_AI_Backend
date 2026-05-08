"""
ML Service — Multi-Disease Model Registry & Inference Engine

Supports loading multiple disease prediction pipelines.
Currently trained: Diabetes
Future: Heart Disease, Hypertension, Kidney Disease
"""

import os
import numpy as np
import pandas as pd
import joblib
from typing import Any

# ─── Base directory for models ───
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "Model")


# ═══════════════════════════════════════════════════
#  DISEASE REGISTRY — add new diseases here
# ═══════════════════════════════════════════════════

DISEASE_REGISTRY = {
    "diabetes": {
        "model_file": "scaler_pipeline.pkl",
        "display_name": "Diabetes",
        "features": [
            {
                "name": "Pregnancies",
                "label": "Number of times pregnant",
                "type": "int",
                "min": 0, "max": 20,
                "hint": "Total number of pregnancies (0 if male or N/A)",
            },
            {
                "name": "Glucose",
                "label": "Glucose Level",
                "type": "float",
                "min": 1, "max": 500,
                "unit": "mg/dL",
                "hint": "Plasma glucose concentration (2-hour oral glucose tolerance test)",
            },
            {
                "name": "BloodPressure",
                "label": "Blood Pressure",
                "type": "float",
                "min": 34, "max": 300,
                "unit": "mm Hg",
                "hint": "Diastolic blood pressure",
            },
            {
                "name": "SkinThickness",
                "label": "Skin Thickness",
                "type": "float",
                "min": 0.05, "max": 4.0,
                "unit": "mm",
                "hint": "Triceps skin fold thickness",
            },
            {
                "name": "Insulin",
                "label": "Insulin Level",
                "type": "float",
                "min": 0, "max": 1000,
                "unit": "μU/mL",
                "hint": "2-Hour serum insulin",
            },
            {
                "name": "BMI",
                "label": "Body Mass Index (BMI)",
                "type": "float",
                "min": 16.1, "max": 100,
                "unit": "kg/m²",
                "hint": "Weight(kg) / Height(m)²",
            },
            {
                "name": "DiabetesPedigreeFunction",
                "label": "Diabetes Pedigree Function",
                "type": "float",
                "min": 0.08, "max": 2.42,
                "hint": "Genetic influence score (0.08–2.42 typical range)",
            },
            {
                "name": "Age",
                "label": "Age",
                "type": "int",
                "min": 5, "max": 100,
                "unit": "years",
                "hint": "Age in years",
            },
        ],
        "positive_label": "Diabetic",
        "negative_label": "Not Diabetic",
    },
    "heart_disease": {
        "model_file": "heart_disease_pipeline.pkl",
        "display_name": "Heart Disease",
        "features": [
            {
                "name": "age",
                "label": "Age",
                "type": "float",
                "min": 29.0,
                "max": 77.0,
                "hint": "Patient's age in years"
            },
            {
                "name": "sex",
                "label": "Sex",
                "type": "float",
                "options": [{"label": "Female", "value": 0.0}, {"label": "Male", "value": 1.0}],
                "hint": "1 = Male, 0 = Female"
            },
            {
                "name": "cp",
                "label": "Chest Pain Type",
                "type": "float",
                "options": [
                    {"label": "Typical Angina", "value": 0.0},
                    {"label": "Atypical Angina", "value": 1.0},
                    {"label": "Non-anginal Pain", "value": 2.0},
                    {"label": "Asymptomatic", "value": 3.0}
                ],
                "hint": "Type of chest pain experienced"
            },
            {
                "name": "trestbps",
                "label": "Resting Blood Pressure",
                "type": "float",
                "min": 94.0,
                "max": 200.0,
                "unit": "mm Hg",
                "hint": "Blood pressure measured at rest"
            },
            {
                "name": "chol",
                "label": "Serum Cholesterol",
                "type": "float",
                "min": 126.0,
                "max": 564.0,
                "unit": "mg/dl",
                "hint": "Cholesterol level - a key heart disease risk factor"
            },
            {
                "name": "fbs",
                "label": "Fasting Blood Sugar > 120",
                "type": "float",
                "options": [{"label": "No", "value": 0.0}, {"label": "Yes", "value": 1.0}],
                "hint": "Fasting blood sugar level greater than 120 mg/dl"
            },
            {
                "name": "restecg",
                "label": "Resting ECG Results",
                "type": "float",
                "options": [
                    {"label": "Normal", "value": 0.0},
                    {"label": "ST-T abnormality", "value": 1.0},
                    {"label": "LV hypertrophy", "value": 2.0}
                ],
                "hint": "Resting electrocardiographic results"
            },
            {
                "name": "thalach",
                "label": "Max Heart Rate",
                "type": "float",
                "min": 71.0,
                "max": 202.0,
                "hint": "Highest heart rate recorded during exercise testing"
            },
            {
                "name": "exang",
                "label": "Exercise Induced Angina",
                "type": "float",
                "options": [{"label": "No", "value": 0.0}, {"label": "Yes", "value": 1.0}],
                "hint": "Chest pain experienced during exercise"
            },
            {
                "name": "oldpeak",
                "label": "ST Depression",
                "type": "float",
                "min": 0.0,
                "max": 6.2,
                "hint": "ECG measure of cardiac stress"
            },
            {
                "name": "slope",
                "label": "Slope of Peak Exercise ST",
                "type": "float",
                "options": [
                    {"label": "Downsloping", "value": 0.0},
                    {"label": "Flat", "value": 1.0},
                    {"label": "Upsloping", "value": 2.0}
                ],
                "hint": "Indicates heart stress pattern"
            },
            {
                "name": "ca",
                "label": "Major Vessels Colored",
                "type": "float",
                "options": [
                    {"label": "0 vessels", "value": 0.0},
                    {"label": "1 vessel", "value": 1.0},
                    {"label": "2 vessels", "value": 2.0},
                    {"label": "3 vessels", "value": 3.0}
                ],
                "hint": "Number of major blood vessels visible via fluoroscopy"
            },
            {
                "name": "thal",
                "label": "Thalassemia",
                "type": "float",
                "options": [
                    {"label": "Normal", "value": 1.0},
                    {"label": "Fixed Defect", "value": 2.0},
                    {"label": "Reversible Defect", "value": 3.0}
                ],
                "hint": "Blood disorder indicator"
            }
        ],
        "positive_label": "Positive for Heart Disease",
        "negative_label": "Negative for Heart Disease"
    },
    "hypertension": {
        "model_file": "hypertension_pipeline.pkl",
        "display_name": "Hypertension",
        "features": [
            {
                "name": "Age",
                "label": "Age",
                "type": "int",
                "min": 18,
                "max": 100,
                "unit": "years",
                "hint": "Patient's age in years"
            },
            {
                "name": "BMI",
                "label": "Body Mass Index (BMI)",
                "type": "float",
                "min": 10.0,
                "max": 60.0,
                "unit": "kg/m²",
                "hint": "Weight(kg) / Height(m)²"
            },
            {
                "name": "Systolic_BP",
                "label": "Systolic Blood Pressure",
                "type": "int",
                "min": 80,
                "max": 250,
                "unit": "mm Hg",
                "hint": "Upper number of blood pressure reading"
            },
            {
                "name": "Diastolic_BP",
                "label": "Diastolic Blood Pressure",
                "type": "int",
                "min": 40,
                "max": 160,
                "unit": "mm Hg",
                "hint": "Lower number of blood pressure reading"
            },
            {
                "name": "Family_History",
                "label": "Family History of Hypertension",
                "type": "str",
                "options": ["yes", "no"],
                "hint": "Do any close relatives have hypertension?"
            },
            {
                "name": "Diabetes",
                "label": "Diabetes",
                "type": "str",
                "options": ["yes", "no"],
                "hint": "Does the patient have diabetes?"
            },
            {
                "name": "Smoking_Status",
                "label": "Smoking Status",
                "type": "str",
                "options": ["yes", "no"],
                "hint": "Current smoking status"
            },
            {
                "name": "Physical_Activity_Level",
                "label": "Physical Activity Level",
                "type": "str",
                "options": ["low", "moderate", "high"],
                "hint": "Level of regular physical activity"
            },
            {
                "name": "Glucose",
                "label": "Glucose Level",
                "type": "int",
                "min": 50,
                "max": 300,
                "unit": "mg/dL",
                "hint": "Blood glucose level"
            },
            {
                "name": "Salt_Intake",
                "label": "Salt Intake",
                "type": "float",
                "min": 0.0,
                "max": 20.0,
                "unit": "g/day",
                "hint": "Daily salt intake in grams"
            }
        ],
        "positive_label": "Positive for Hypertension",
        "negative_label": "Negative for Hypertension"
    },
    "kidney_disease": {
        "model_file": "kidney_disease_pipeline.pkl",
        "display_name": "Kidney Disease",
        "features": [
            {
                "name": "Serum creatinine (mg/dl)",
                "label": "Serum Creatinine",
                "type": "float",
                "min": 0.4,
                "max": 76.0,
                "unit": "mg/dL",
                "hint": "Creatinine level; the most important CKD marker"
            },
            {
                "name": "Blood urea (mg/dl)",
                "label": "Blood Urea",
                "type": "float",
                "min": 1.5,
                "max": 391.0,
                "unit": "mg/dL",
                "hint": "Urea in blood; high = kidneys not filtering waste properly"
            },
            {
                "name": "Estimated Glomerular Filtration Rate (eGFR)",
                "label": "Estimated GFR (eGFR)",
                "type": "float",
                "min": 0.0,
                "max": 150.0,
                "unit": "mL/min/1.73m²",
                "hint": "Kidney filtration rate; lower values indicate worse function"
            },
            {
                "name": "Hemoglobin level (gms)",
                "label": "Hemoglobin Level",
                "type": "float",
                "min": 3.0,
                "max": 18.0,
                "unit": "g/dL",
                "hint": "Blood hemoglobin; CKD often causes anemia"
            },
            {
                "name": "Albumin in urine",
                "label": "Albumin in Urine",
                "type": "int",
                "min": 0,
                "max": 5,
                "hint": "Protein in urine (0-5); higher = kidney leakage"
            },
            {
                "name": "Specific gravity of urine",
                "label": "Specific Gravity of Urine",
                "type": "float",
                "min": 1.0,
                "max": 1.03,
                "hint": "Urine density (1.005-1.025 normal range)"
            },
            {
                "name": "Blood pressure (mm/Hg)",
                "label": "Blood Pressure",
                "type": "int",
                "min": 50,
                "max": 200,
                "unit": "mm Hg",
                "hint": "Diastolic blood pressure in mm Hg"
            },
            {
                "name": "Age of the patient",
                "label": "Age",
                "type": "int",
                "min": 2,
                "max": 100,
                "unit": "years",
                "hint": "Patient age in years"
            },
            {
                "name": "Diabetes mellitus (yes/no)",
                "label": "Diabetes Mellitus",
                "type": "str",
                "options": ["yes", "no"],
                "hint": "Diabetes is the #1 cause of CKD"
            },
            {
                "name": "Hypertension (yes/no)",
                "label": "Hypertension",
                "type": "str",
                "options": ["yes", "no"],
                "hint": "Hypertension is both a cause and effect of CKD"
            }
        ],
        "positive_label": "Positive for Kidney Disease",
        "negative_label": "Negative for Kidney Disease"
    },
}


# ═══════════════════════════════════════════════════
#  HEALTH GUIDANCE — predefined advice per risk tier
# ═══════════════════════════════════════════════════

DISEASE_SPECIFIC_GUIDANCE = {
    "diabetes": {
        "critical": [
            "🏥 Schedule an appointment with an endocrinologist immediately",
            "🩸 Monitor your blood glucose levels meticulously everyday",
            "🥗 Adopt a strict diabetic diet (low glycemic index foods)",
            "⚠️ Watch for signs of diabetic ketoacidosis or severe hypoglycemia",
        ],
        "high": [
            "👨‍⚕️ Consult a doctor or diabetes specialist within 1-2 weeks",
            "📉 Cut out refined sugars and highly processed carbohydrates",
            "🏃 Incorporate regular aerobic exercise like brisk walking",
            "📊 Keep a daily log of your blood sugar readings",
        ],
        "moderate": [
            "🥦 Focus on portion control and complex carbohydrates",
            "🚶 Aim for at least 30 minutes of physical activity daily",
            "⚖️ Maintain a healthy weight to improve insulin sensitivity",
            "📅 Schedule a routine HbA1c test every 3-6 months",
        ],
        "low": [
            "✅ Continue your current healthy lifestyle and balanced diet",
            "🏋️ Stay consistent with regular physical activity",
            "🩺 Get an annual metabolic blood panel for ongoing wellness",
            "💧 Stay hydrated and avoid sugary beverages",
        ]
    },
    "heart_disease": {
        "critical": [
            "🏥 Schedule an appointment with a cardiologist immediately",
            "🚨 Avoid any strenuous physical exertion or extreme stress",
            "📋 Bring this prediction report to your healthcare provider",
            "⚠️ Do not ignore symptoms like chest pain or severe shortness of breath",
        ],
        "high": [
            "👨‍⚕️ Consult a cardiologist within the next 1–2 weeks",
            "🥗 Adopt a heart-healthy diet (like DASH or Mediterranean)",
            "🧂 Strictly limit sodium, saturated fats, and cholesterol",
            "📊 Monitor your blood pressure and resting heart rate regularly",
        ],
        "moderate": [
            "🥦 Maintain a heart-healthy, balanced diet",
            "🚶 Stay physically active — aim for 150 mins of moderate cardio weekly",
            "💤 Ensure 7–8 hours of quality sleep to reduce cardiovascular stress",
            "📅 Schedule a routine lipid profile and ECG check-up",
        ],
        "low": [
            "✅ Continue your current heart-healthy lifestyle",
            "🏋️ Stay cardiovascularly fit with regular aerobic exercise",
            "🩺 Get an annual heart health check-up for ongoing wellness",
            "🧘 Manage stress levels through relaxation techniques",
        ]
    },
    "hypertension": {
        "critical": [
            "🏥 Seek immediate medical attention if systolic BP > 180 or diastolic > 120",
            "💊 Do not stop taking any prescribed blood pressure medications",
            "🚨 Avoid sudden physical exertion or highly stressful environments",
            "📋 Consult a primary care physician immediately for medication adjustment",
        ],
        "high": [
            "👨‍⚕️ Consult your doctor within the next 1–2 weeks for BP management",
            "🧂 Strictly adopt a low-sodium diet (under 1500mg daily)",
            "🧘 Begin practicing stress-reduction techniques daily",
            "📊 Buy a home blood pressure monitor and check twice daily",
        ],
        "moderate": [
            "🥦 Reduce salt intake and limit processed foods",
            "🚶 Engage in regular, moderate aerobic exercise",
            "📉 Limit alcohol consumption and reduce caffeine intake",
            "📅 Schedule a routine blood pressure screening",
        ],
        "low": [
            "✅ Continue maintaining a healthy blood pressure",
            "✅ Keep dietary sodium at reasonable levels",
            "🏋️ Stay active to keep blood vessels flexible",
            "🩺 Check your blood pressure occasionally to ensure stability",
        ]
    },
    "kidney_disease": {
         "critical": [
            "🏥 Schedule an appointment with a nephrologist immediately",
            "💧 Strictly manage your fluid intake as directed by a doctor",
            "🥩 Drastically reduce sodium, potassium, and protein intake",
            "⚠️ Watch for swelling in legs/ankles or severe fatigue, and report immediately",
        ],
        "high": [
            "👨‍⚕️ Consult a nephrologist within 1-2 weeks",
            "💊 Avoid NSAIDs (like ibuprofen) which can damage kidneys further",
            "📉 Closely monitor your blood pressure and blood sugar",
            "📊 Get a comprehensive renal function panel (eGFR, Creatinine) done",
        ],
        "moderate": [
            "🥦 Eat a balanced diet, avoiding excess salt and protein",
            "💧 Stay adequately hydrated, but avoid over-hydration",
            "🚶 Engage in regular physical activity to help lower blood pressure",
            "📅 Schedule a routine kidney function screening (urine and blood)",
        ],
        "low": [
            "✅ Continue protecting your kidneys with a healthy lifestyle",
            "💧 Drink plenty of water daily to flush out toxins",
            "🩺 Get an annual check-up including basic metabolic panels",
            "💊 Use over-the-counter pain medications sparingly",
        ]
    }
}

def get_health_guidance(disease: str, probability: float, risk_level: str) -> dict:
    """Return structured health advice based on prediction result."""

    guidance = {
        "risk_level": risk_level,
        "summary": "",
        "recommendations": [],
        "urgency": "",
        "show_ai_chat": False,
    }
    
    # Fallback generic recommendations if disease is fully unknown
    disease_recs = DISEASE_SPECIFIC_GUIDANCE.get(disease, DISEASE_SPECIFIC_GUIDANCE["heart_disease"])

    if probability >= 0.75:
        guidance["urgency"] = "urgent"
        guidance["summary"] = (
            f"Your {DISEASE_REGISTRY[disease]['display_name']} risk is critically high. "
            "Please consult a healthcare professional immediately."
        )
        guidance["recommendations"] = disease_recs["critical"]
        guidance["show_ai_chat"] = True

    elif probability >= 0.50:
        guidance["urgency"] = "high"
        guidance["summary"] = (
            f"Your {DISEASE_REGISTRY[disease]['display_name']} risk is elevated. "
            "A medical consultation is strongly recommended."
        )
        guidance["recommendations"] = disease_recs["high"]
        guidance["show_ai_chat"] = True

    elif probability >= 0.30:
        guidance["urgency"] = "moderate"
        guidance["summary"] = (
            f"Your {DISEASE_REGISTRY[disease]['display_name']} risk is moderate. "
            "Preventive measures can help reduce your risk significantly."
        )
        guidance["recommendations"] = disease_recs["moderate"]
        guidance["show_ai_chat"] = True

    else:
        guidance["urgency"] = "low"
        guidance["summary"] = (
            f"Your {DISEASE_REGISTRY[disease]['display_name']} risk is low. "
            "Keep up the great work maintaining your health!"
        )
        guidance["recommendations"] = disease_recs["low"]
        guidance["show_ai_chat"] = True

    return guidance


# ═══════════════════════════════════════════════════
#  MODEL LOADING & PREDICTION
# ═══════════════════════════════════════════════════

# Cache loaded models to avoid reloading on every request
_loaded_models: dict[str, Any] = {}


def _load_model(disease: str):
    """Load and cache a disease prediction model."""
    if disease not in DISEASE_REGISTRY:
        raise ValueError(f"Unknown disease: '{disease}'. Available: {list(DISEASE_REGISTRY.keys())}")

    if disease not in _loaded_models:
        model_file = DISEASE_REGISTRY[disease]["model_file"]
        model_path = os.path.join(MODEL_DIR, model_file)

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model file not found: {model_path}. "
                f"Please train the {disease} model first."
            )

        _loaded_models[disease] = joblib.load(model_path)
        print(f"[OK] Loaded model for '{disease}' from {model_path}")

    return _loaded_models[disease]


def get_available_diseases() -> list[dict]:
    """Return list of diseases that have trained models available."""
    available = []
    for key, config in DISEASE_REGISTRY.items():
        model_path = os.path.join(MODEL_DIR, config["model_file"])
        available.append({
            "key": key,
            "display_name": config["display_name"],
            "available": os.path.exists(model_path),
            "feature_count": len(config["features"]),
        })
    return available


def get_disease_features(disease: str) -> list[dict]:
    """Return the feature schema for a disease model."""
    if disease not in DISEASE_REGISTRY:
        raise ValueError(f"Unknown disease: '{disease}'")
    return DISEASE_REGISTRY[disease]["features"]


def predict(disease: str, features: dict) -> dict:
    """
    Run prediction for a disease using the provided feature values.

    Returns:
        {
            prediction: int (0 or 1),
            probability: float (0.0–1.0),
            risk_level: str,
            label: str,
            guidance: dict
        }
    """
    config = DISEASE_REGISTRY.get(disease)
    if not config:
        raise ValueError(f"Unknown disease: '{disease}'")

    model = _load_model(disease)

    # Build feature dict and validate
    cleaned_data = {}
    missing = []
    
    for f in config["features"]:
        name = f["name"]
        if name not in features:
            missing.append(name)
            continue
            
        val = features[name]
        
        if f.get("type", "float") in ("float", "int"):
            try:
                val = float(val)
            except (ValueError, TypeError):
                raise ValueError(f"Invalid numeric value for {f['label']}")
                
            if val < f.get("min", -float('inf')) or val > f.get("max", float('inf')):
                raise ValueError(f"{f['label']} must be between {f.get('min')} and {f.get('max')}")
        else:
            # It's categorical/string
            if "options" in f and val not in f["options"]:
                # Only validate if exact options are required
                # Just keeping it as is to avoid strict breakdown if case mismatches
                pass
                
        cleaned_data[name] = val
        
    if missing:
        raise ValueError(f"Missing features: {missing}")

    X = pd.DataFrame([cleaned_data])

    # Predict
    prediction = int(model.predict(X)[0])

    # Get probability of positive class (class 1)
    if hasattr(model, "predict_proba"):
        proba = float(model.predict_proba(X)[0][1])
    else:
        proba = float(prediction)

    # Determine risk level
    if proba >= 0.75:
        risk_level = "Critical"
    elif proba >= 0.50:
        risk_level = "High"
    elif proba >= 0.30:
        risk_level = "Moderate"
    else:
        risk_level = "Low"

    # Human-readable label
    label = config["positive_label"] if prediction == 1 else config["negative_label"]

    # Health guidance
    guidance = get_health_guidance(disease, proba, risk_level)

    return {
        "prediction": prediction,
        "probability": round(proba, 4),
        "risk_level": risk_level,
        "label": label,
        "guidance": guidance,
    }
