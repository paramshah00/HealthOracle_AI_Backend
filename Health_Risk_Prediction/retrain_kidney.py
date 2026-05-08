"""
Retrain kidney disease model with current sklearn version.
Maps old CSV column names to the new feature names used by the model.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier
import joblib
import os

# -----------------------------
# 1. LOAD DATA
# -----------------------------
DATA_PATH = os.path.join("Data", "kidney_disease.csv")
df = pd.read_csv(DATA_PATH)
df.replace('?', np.nan, inplace=True)
df.columns = df.columns.str.strip()
print(f"Loaded {len(df)} rows from {DATA_PATH}")

# -----------------------------
# 2. RENAME COLUMNS to match new feature names
# -----------------------------
column_mapping = {
    'sc': 'Serum creatinine (mg/dl)',
    'bu': 'Blood urea (mg/dl)',
    'hemo': 'Hemoglobin level (gms)',
    'al': 'Albumin in urine',
    'sg': 'Specific gravity of urine',
    'bp': 'Blood pressure (mm/Hg)',
    'age': 'Age of the patient',
    'dm': 'Diabetes mellitus (yes/no)',
    'htn': 'Hypertension (yes/no)',
    'classification': 'Target',
}
df.rename(columns=column_mapping, inplace=True)

# Compute eGFR from serum creatinine and age (CKD-EPI simplified approximation)
# eGFR = 141 * min(Scr/k, 1)^a * max(Scr/k, 1)^(-1.209) * 0.993^Age
# Using a simplified formula: eGFR ~ 186 * Scr^(-1.154) * Age^(-0.203)
df['Serum creatinine (mg/dl)'] = pd.to_numeric(df['Serum creatinine (mg/dl)'], errors='coerce')
df['Age of the patient'] = pd.to_numeric(df['Age of the patient'], errors='coerce')
sc_vals = df['Serum creatinine (mg/dl)'].fillna(df['Serum creatinine (mg/dl)'].median())
age_vals = df['Age of the patient'].fillna(df['Age of the patient'].median())
df['Estimated Glomerular Filtration Rate (eGFR)'] = 186 * (sc_vals ** -1.154) * (age_vals ** -0.203)

# -----------------------------
# 3. FIX TARGET
# -----------------------------
df['Target'] = df['Target'].astype(str).str.strip().str.lower()
df['Target'] = df['Target'].apply(lambda x: 0 if 'not' in x or 'no' in x else 1)
df = df.dropna(subset=['Target'])
print(f"Target distribution:\n{df['Target'].value_counts()}")

# -----------------------------
# 4. SELECT FEATURES
# -----------------------------
features = [
    'Serum creatinine (mg/dl)',
    'Blood urea (mg/dl)',
    'Estimated Glomerular Filtration Rate (eGFR)',
    'Hemoglobin level (gms)',
    'Albumin in urine',
    'Specific gravity of urine',
    'Blood pressure (mm/Hg)',
    'Age of the patient',
    'Diabetes mellitus (yes/no)',
    'Hypertension (yes/no)'
]

X = df[features]
y = df['Target'].astype(int)

# -----------------------------
# 5. SEPARATE TYPES
# -----------------------------
numeric_features = [
    'Serum creatinine (mg/dl)',
    'Blood urea (mg/dl)',
    'Estimated Glomerular Filtration Rate (eGFR)',
    'Hemoglobin level (gms)',
    'Albumin in urine',
    'Specific gravity of urine',
    'Blood pressure (mm/Hg)',
    'Age of the patient'
]

categorical_features = [
    'Diabetes mellitus (yes/no)',
    'Hypertension (yes/no)'
]

# Clean categorical
for col in categorical_features:
    X[col] = X[col].astype(str).str.strip().str.lower()

# Clean numeric
for col in numeric_features:
    X[col] = pd.to_numeric(X[col], errors='coerce')

# -----------------------------
# 6. PREPROCESSING
# -----------------------------
preprocessor = ColumnTransformer([
    ('num', Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ]), numeric_features),

    ('cat', Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore'))
    ]), categorical_features)
])

# -----------------------------
# 7. TRAIN-TEST SPLIT
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\nTraining set: {len(X_train)} samples")
print(f"Test set: {len(X_test)} samples")

# -----------------------------
# 8. MODEL
# -----------------------------
model = Pipeline([
    ('preprocessing', preprocessor),
    ('classifier', XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        scale_pos_weight=2,
        random_state=42,
        eval_metric='logloss'
    ))
])

# -----------------------------
# 9. TRAIN
# -----------------------------
print("\nTraining model...")
model.fit(X_train, y_train)

# -----------------------------
# 10. EVALUATE
# -----------------------------
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\nAccuracy: {acc:.4f}")
print(f"\nClassification Report:\n{classification_report(y_test, y_pred)}")

# -----------------------------
# 11. SAVE MODEL
# -----------------------------
output_path = os.path.join("Model", "kidney_disease_pipeline.pkl")
joblib.dump(model, output_path)
print(f"Model saved to {output_path}")

# -----------------------------
# 12. TEST PREDICTION
# -----------------------------
loaded = joblib.load(output_path)
sample = pd.DataFrame([{
    'Serum creatinine (mg/dl)': 3.5,
    'Blood urea (mg/dl)': 120.0,
    'Estimated Glomerular Filtration Rate (eGFR)': 15.0,
    'Hemoglobin level (gms)': 9.5,
    'Albumin in urine': 4,
    'Specific gravity of urine': 1.010,
    'Blood pressure (mm/Hg)': 90,
    'Age of the patient': 55,
    'Diabetes mellitus (yes/no)': 'yes',
    'Hypertension (yes/no)': 'yes'
}])

pred = loaded.predict(sample)[0]
prob = loaded.predict_proba(sample)[0][1]
print(f"\nTest prediction (0=No CKD, 1=CKD): {pred}")
print(f"Risk Probability: {round(prob, 4)}")
