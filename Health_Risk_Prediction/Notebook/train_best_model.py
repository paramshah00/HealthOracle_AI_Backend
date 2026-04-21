"""
Diabetes Model Training & Comparison Script
=============================================
Trains multiple models WITHOUT double-scaling, compares them on all criteria
(Accuracy, Precision, Recall, F1-Score, ROC-AUC), and saves the best pipeline.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report,
    confusion_matrix
)

# ── Models to compare ──
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    AdaBoostClassifier
)
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier

import joblib
import os
import warnings
warnings.filterwarnings("ignore")

# ═══════════════════════════════════════════
#  1. LOAD & PREPROCESS DATA
# ═══════════════════════════════════════════

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "Data", "diabetes.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "Model")

print("=" * 70)
print("  DIABETES MODEL TRAINING & COMPARISON")
print("=" * 70)

df = pd.read_csv(DATA_PATH)
print(f"\nDataset shape: {df.shape}")
print(f"Class distribution:\n{df['Outcome'].value_counts()}\n")

# Replace biologically impossible 0 values with NaN, then fill with median
cols_with_zeros = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]
df[cols_with_zeros] = df[cols_with_zeros].replace(0, np.nan)
df.fillna(df.median(), inplace=True)

# Split features and target
X = df.drop("Outcome", axis=1)
y = df["Outcome"]

# Train/test split (NO manual scaling — each Pipeline handles its own scaling)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training set: {X_train.shape[0]} samples")
print(f"Test set:     {X_test.shape[0]} samples\n")


# ═══════════════════════════════════════════
#  2. DEFINE MODEL PIPELINES
# ═══════════════════════════════════════════

pipelines = {
    "Logistic Regression": Pipeline([
        ("scaler", StandardScaler()),
        ("model", LogisticRegression(max_iter=1000, random_state=42))
    ]),
    "Gaussian Naive Bayes": Pipeline([
        ("scaler", StandardScaler()),
        ("model", GaussianNB())
    ]),
    "Random Forest": Pipeline([
        ("scaler", StandardScaler()),
        ("model", RandomForestClassifier(
            n_estimators=200, max_depth=10, min_samples_split=5,
            min_samples_leaf=2, random_state=42
        ))
    ]),
    "Gradient Boosting": Pipeline([
        ("scaler", StandardScaler()),
        ("model", GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.1, max_depth=4,
            min_samples_split=5, min_samples_leaf=2, random_state=42
        ))
    ]),
    "SVM (RBF)": Pipeline([
        ("scaler", StandardScaler()),
        ("model", SVC(kernel="rbf", probability=True, random_state=42))
    ]),
    "KNN": Pipeline([
        ("scaler", StandardScaler()),
        ("model", KNeighborsClassifier(n_neighbors=7))
    ]),
    "Decision Tree": Pipeline([
        ("scaler", StandardScaler()),
        ("model", DecisionTreeClassifier(
            max_depth=5, min_samples_split=5,
            min_samples_leaf=2, random_state=42
        ))
    ]),
    "AdaBoost": Pipeline([
        ("scaler", StandardScaler()),
        ("model", AdaBoostClassifier(
            n_estimators=100, learning_rate=0.1, random_state=42
        ))
    ]),
}


# ═══════════════════════════════════════════
#  3. TRAIN & EVALUATE ALL MODELS
# ═══════════════════════════════════════════

print("=" * 70)
print("  MODEL COMPARISON RESULTS")
print("=" * 70)

results = []
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for name, pipeline in pipelines.items():
    # Train
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    # Metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)

    # Cross-validation score (accuracy)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="accuracy")
    cv_mean = cv_scores.mean()
    cv_std = cv_scores.std()

    results.append({
        "Model": name,
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1-Score": f1,
        "ROC-AUC": auc,
        "CV Mean": cv_mean,
        "CV Std": cv_std,
    })

    print(f"\n{'─' * 50}")
    print(f"  {name}")
    print(f"{'─' * 50}")
    print(f"  Accuracy:   {acc:.4f}")
    print(f"  Precision:  {prec:.4f}")
    print(f"  Recall:     {rec:.4f}")
    print(f"  F1-Score:   {f1:.4f}")
    print(f"  ROC-AUC:    {auc:.4f}")
    print(f"  CV Accuracy: {cv_mean:.4f} ± {cv_std:.4f}")

    # Show sample probabilities to verify they're between 0 and 1
    print(f"  Sample probabilities: {y_proba[:5].round(4)}")


# ═══════════════════════════════════════════
#  4. COMPARISON TABLE & BEST MODEL SELECTION
# ═══════════════════════════════════════════

results_df = pd.DataFrame(results)

# Composite score: weighted combination of key metrics
# F1 and ROC-AUC most important for medical predictions
results_df["Composite"] = (
    results_df["F1-Score"] * 0.30 +
    results_df["ROC-AUC"] * 0.30 +
    results_df["Accuracy"] * 0.15 +
    results_df["Precision"] * 0.10 +
    results_df["Recall"] * 0.10 +
    results_df["CV Mean"] * 0.05
)

results_df = results_df.sort_values("Composite", ascending=False).reset_index(drop=True)

print("\n\n" + "=" * 70)
print("  FINAL COMPARISON TABLE (sorted by composite score)")
print("=" * 70)
print(results_df.to_string(index=False, float_format=lambda x: f"{x:.4f}"))

best_model_name = results_df.iloc[0]["Model"]
print(f"\n{'★' * 50}")
print(f"  BEST MODEL: {best_model_name}")
print(f"  Composite Score: {results_df.iloc[0]['Composite']:.4f}")
print(f"{'★' * 50}")


# ═══════════════════════════════════════════
#  5. DETAILED REPORT FOR BEST MODEL
# ═══════════════════════════════════════════

best_pipeline = pipelines[best_model_name]
y_pred_best = best_pipeline.predict(X_test)
y_proba_best = best_pipeline.predict_proba(X_test)[:, 1]

print(f"\n{'=' * 70}")
print(f"  DETAILED REPORT: {best_model_name}")
print(f"{'=' * 70}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred_best, target_names=["Not Diabetic", "Diabetic"]))

print("Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred_best)
print(f"  TN={cm[0][0]}  FP={cm[0][1]}")
print(f"  FN={cm[1][0]}  TP={cm[1][1]}")

print(f"\nProbability Distribution (positive class):")
print(f"  Min:    {y_proba_best.min():.4f}")
print(f"  Max:    {y_proba_best.max():.4f}")
print(f"  Mean:   {y_proba_best.mean():.4f}")
print(f"  Median: {np.median(y_proba_best):.4f}")

# Verify probabilities are NOT just 0 and 1
unique_probas = np.unique(y_proba_best.round(2))
print(f"  Unique values (rounded): {len(unique_probas)}")
if len(unique_probas) <= 2:
    print("  ⚠️  WARNING: Probabilities are still binary!")
else:
    print("  ✅ Probabilities show proper continuous distribution!")


# ═══════════════════════════════════════════
#  6. SAVE BEST MODEL
# ═══════════════════════════════════════════

os.makedirs(MODEL_DIR, exist_ok=True)

# Save as diabetes_pipeline.pkl (used by backend)
pipeline_path = os.path.join(MODEL_DIR, "diabetes_pipeline.pkl")
joblib.dump(best_pipeline, pipeline_path)
print(f"\n✅ Saved best model ({best_model_name}) to: {pipeline_path}")

# Also save as scaler_pipeline.pkl (the name used in ml_service.py)
scaler_pipeline_path = os.path.join(MODEL_DIR, "scaler_pipeline.pkl")
joblib.dump(best_pipeline, scaler_pipeline_path)
print(f"✅ Saved best model ({best_model_name}) to: {scaler_pipeline_path}")

print(f"\n{'=' * 70}")
print("  DONE! The best model has been saved and is ready for inference.")
print(f"{'=' * 70}")
