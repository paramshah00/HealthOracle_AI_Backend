import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Models
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier

import warnings
warnings.filterwarnings('ignore')

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
DATA_DIR = os.path.join(BASE_DIR, "Data")
MODEL_DIR = os.path.join(BASE_DIR, "Model")
os.makedirs(MODEL_DIR, exist_ok=True)

configs = [
    {"name": "heart_disease", "file": "heart_disease.csv", "drop": [], "target": "target"},
    {"name": "hypertension", "file": "hypertension.csv", "drop": [], "target": "target"},
    {"name": "stroke", "file": "stroke.csv", "drop": ["id"], "target": "stroke"},
    {"name": "kidney_disease", "file": "kidney_disease.csv", "drop": ["id"], "target": "classification"}
]

def clean_kidney_disease(df):
    df = df.replace('?', np.nan)
    df = df.replace('\t?', np.nan)
    df = df.replace('\t', np.nan)
    df = df.replace(' ', np.nan)
    for col in df.select_dtypes(include=['object']):
        df[col] = df[col].astype(str).str.strip()
    if 'classification' in df.columns:
        df['classification'] = df['classification'].replace({'ckd\t': 'ckd'})
        df['classification'] = df['classification'].map({'ckd': 1, 'notckd': 0})
        df = df.dropna(subset=['classification']).copy()
    numeric_cols = ['age', 'bp', 'sg', 'al', 'su', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    return df

for config in configs:
    print(f"\n\n{'#'*80}")
    print(f"EVALUATING MULTIPLE MODELS FOR: {config['name'].upper()}")
    print(f"{'#'*80}")
    
    file_path = os.path.join(DATA_DIR, config['file'])
    if not os.path.exists(file_path):
        print(f"Data file not found: {file_path}. Skipping.")
        continue
        
    df = pd.read_csv(file_path)
    if config['name'] == 'kidney_disease':
        df = clean_kidney_disease(df)
        
    if config['drop']:
        df = df.drop(columns=[col for col in config['drop'] if col in df.columns], errors='ignore')
        
    df.replace(r'^\s*$', np.nan, regex=True, inplace=True)
    
    X = df.drop(columns=[config['target']])
    y = df[config['target']].astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()
    
    preprocessor = ColumnTransformer(transformers=[
        ('num', Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler())]), numeric_features),
        ('cat', Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))]), categorical_features)
    ])
    
    pipelines = {
        'Logistic Regression': Pipeline([('preprocessor', preprocessor), ('model', LogisticRegression(max_iter=1000, random_state=42))]),
        'Gaussian Naive Bayes': Pipeline([('preprocessor', preprocessor), ('model', GaussianNB())]),
        'Random Forest': Pipeline([('preprocessor', preprocessor), ('model', RandomForestClassifier(n_estimators=200, max_depth=10, min_samples_split=5, min_samples_leaf=2, random_state=42))]),
        'Gradient Boosting': Pipeline([('preprocessor', preprocessor), ('model', GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=4, min_samples_split=5, min_samples_leaf=2, random_state=42))]),
        # 'SVM (RBF)': Pipeline([('preprocessor', preprocessor), ('model', SVC(kernel='rbf', probability=True, random_state=42))]),
        # 'KNN': Pipeline([('preprocessor', preprocessor), ('model', KNeighborsClassifier(n_neighbors=7))]),
        'Decision Tree': Pipeline([('preprocessor', preprocessor), ('model', DecisionTreeClassifier(max_depth=5, min_samples_split=5, min_samples_leaf=2, random_state=42))]),
        'AdaBoost': Pipeline([('preprocessor', preprocessor), ('model', AdaBoostClassifier(n_estimators=100, learning_rate=0.1, random_state=42))]),
    }
    
    results = []
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    for name, pipeline in pipelines.items():
        try:
            pipeline.fit(X_train, y_train)
            y_pred = pipeline.predict(X_test)
            if hasattr(pipeline['model'], 'predict_proba'):
                y_proba = pipeline.predict_proba(X_test)[:, 1]
            else:
                y_proba = y_pred
            
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, zero_division=0)
            rec = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            auc = roc_auc_score(y_test, y_proba) if len(np.unique(y_test)) == 2 else 0
            
            cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='accuracy')
            
            results.append({
                'Model': name,
                'Accuracy': acc,
                'Precision': prec,
                'Recall': rec,
                'F1-Score': f1,
                'ROC-AUC': auc,
                'CV Mean': cv_scores.mean()
            })
        except Exception as e:
            print(f"Error training {name}: {e}")
            
    results_df = pd.DataFrame(results)
    results_df['Composite'] = (
        results_df['F1-Score'] * 0.30 +
        results_df['ROC-AUC'] * 0.30 +
        results_df['Accuracy'] * 0.15 +
        results_df['Precision'] * 0.10 +
        results_df['Recall'] * 0.10 +
        results_df['CV Mean'] * 0.05
    )
    results_df = results_df.sort_values('Composite', ascending=False).reset_index(drop=True)
    print(results_df.to_string(index=False, float_format=lambda x: f'{x:.4f}'))
    
    best_model_name = results_df.iloc[0]['Model']
    best_pipeline = pipelines[best_model_name]
    
    model_path = os.path.join(MODEL_DIR, f"{config['name']}_pipeline.pkl")
    joblib.dump(best_pipeline, model_path)
    print(f"\n=> WINNER: {best_model_name} (Saved to {model_path})")
