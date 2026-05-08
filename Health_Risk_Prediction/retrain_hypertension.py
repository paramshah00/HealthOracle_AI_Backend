"""
Retrain hypertension model with current sklearn version.
This script mirrors the Colab notebook logic exactly.
"""

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier
import joblib
import os

# -----------------------------
# 1. LOAD DATA
# -----------------------------
DATA_PATH = os.path.join("Data", "hypertension.csv")
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows from {DATA_PATH}")

target = "Hypertension"

# -----------------------------
# 2. TARGET CLEANING
# -----------------------------
df[target] = df[target].astype(str).str.strip().str.lower()
df[target] = df[target].map({"high": 1, "low": 0})
df = df.dropna(subset=[target])
print(f"After target cleaning: {len(df)} rows")
print(f"Target distribution:\n{df[target].value_counts()}")

# -----------------------------
# 3. FEATURES
# -----------------------------
features = [
    "Age", "BMI", "Systolic_BP", "Diastolic_BP",
    "Family_History", "Diabetes", "Smoking_Status",
    "Physical_Activity_Level", "Glucose", "Salt_Intake"
]

df = df[features + [target]]

# -----------------------------
# 4. CLEAN DATA
# -----------------------------
cat_cols = ["Family_History", "Diabetes", "Smoking_Status", "Physical_Activity_Level"]
num_cols = ["Age", "BMI", "Systolic_BP", "Diastolic_BP", "Glucose", "Salt_Intake"]

for col in cat_cols:
    df[col] = df[col].astype(str).str.strip().str.lower()

df[num_cols] = df[num_cols].apply(pd.to_numeric, errors="coerce")
df[num_cols] = df[num_cols].fillna(df[num_cols].median())

# -----------------------------
# 5. SPLIT
# -----------------------------
X = df.drop(columns=[target])
y = df[target].astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\nTraining set: {len(X_train)} samples")
print(f"Test set: {len(X_test)} samples")

# -----------------------------
# 6. PIPELINE
# -----------------------------
preprocessor = ColumnTransformer([
    ("num", StandardScaler(), num_cols),
    ("cat", OneHotEncoder(drop="first", handle_unknown="ignore"), cat_cols)
])

model = XGBClassifier(
    n_estimators=250,
    learning_rate=0.05,
    max_depth=5,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.5,
    reg_lambda=1.0,
    random_state=42,
    eval_metric="logloss"
)

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("model", model)
])

# -----------------------------
# 7. TRAIN
# -----------------------------
print("\nTraining model...")
pipeline.fit(X_train, y_train)

# Evaluate
train_acc = pipeline.score(X_train, y_train)
test_acc = pipeline.score(X_test, y_test)
print(f"Train accuracy: {train_acc:.4f}")
print(f"Test accuracy:  {test_acc:.4f}")

# -----------------------------
# 8. SAVE MODEL
# -----------------------------
output_path = os.path.join("Model", "hypertension_pipeline.pkl")
joblib.dump(pipeline, output_path)
print(f"\n✅ Model saved to {output_path}")

# -----------------------------
# 9. TEST PREDICTION
# -----------------------------
loaded_model = joblib.load(output_path)

sample = pd.DataFrame([{
    "Age": 50,
    "BMI": 28,
    "Systolic_BP": 135,
    "Diastolic_BP": 88,
    "Family_History": "yes",
    "Diabetes": "no",
    "Smoking_Status": "yes",
    "Physical_Activity_Level": "low",
    "Glucose": 120,
    "Salt_Intake": 8
}])

pred = loaded_model.predict(sample)[0]
prob = loaded_model.predict_proba(sample)[0][1]

print(f"\nTest prediction (0=Low, 1=High): {pred}")
print(f"Risk Probability: {round(prob, 4)}")
print(f"\nsklearn version used: {__import__('sklearn').__version__}")
