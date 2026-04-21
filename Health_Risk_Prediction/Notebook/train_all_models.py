import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import warnings

warnings.filterwarnings('ignore')

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
DATA_DIR = os.path.join(BASE_DIR, "Data")
MODEL_DIR = os.path.join(BASE_DIR, "Model")
os.makedirs(MODEL_DIR, exist_ok=True)

configs = [
    {
        "name": "heart_disease",
        "file": "heart_disease.csv",
        "target": "target",
        "drop": [],
    },
    {
        "name": "hypertension",
        "file": "hypertension.csv",
        "target": "target",
        "drop": [],
    },
    {
        "name": "stroke",
        "file": "stroke.csv",
        "target": "stroke",
        "drop": ["id"],
    },
    {
        "name": "kidney_disease",
        "file": "kidney_disease.csv",
        "target": "classification",
        "drop": ["id"],
    }
]

def build_pipeline(X_train):
    numeric_features = X_train.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X_train.select_dtypes(include=['object', 'category']).columns.tolist()
    
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    return pipeline

def clean_kidney_disease(df):
    df = df.replace('?', np.nan)
    df = df.replace('\t?', np.nan)
    df = df.replace('\t', np.nan)
    df = df.replace(' ', np.nan)
    
    # Strip whitespace from string columns
    for col in df.select_dtypes(include=['object']):
        df[col] = df[col].astype(str).str.strip()
    
    # Clean target column
    if 'classification' in df.columns:
        df['classification'] = df['classification'].replace({'ckd\t': 'ckd'})
        # Convert target to 1/0 (ckd = 1, notckd = 0)
        df['classification'] = df['classification'].map({'ckd': 1, 'notckd': 0})
        # Drop rows where target is NaN (if any)
        df = df.dropna(subset=['classification']).copy()
        
    # Attempt to cast numeric columns that might have been inferred as objects
    numeric_cols = ['age', 'bp', 'sg', 'al', 'su', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
    return df

for config in configs:
    print(f"\n{'='*50}")
    print(f"Training Model: {config['name']}")
    print(f"{'='*50}")
    
    file_path = os.path.join(DATA_DIR, config['file'])
    if not os.path.exists(file_path):
        print(f"Data file not found: {file_path}. Skipping.")
        continue
        
    df = pd.read_csv(file_path)
    
    if config['name'] == 'kidney_disease':
        df = clean_kidney_disease(df)
        
    if config['drop']:
        df = df.drop(columns=[col for col in config['drop'] if col in df.columns], errors='ignore')
        
    # Replace any empty strings or space strings with NaN
    df.replace(r'^\s*$', np.nan, regex=True, inplace=True)
        
    X = df.drop(columns=[config['target']])
    y = df[config['target']]
    
    # Ensure y is integer
    y = y.astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    pipeline = build_pipeline(X_train)
    pipeline.fit(X_train, y_train)
    
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    
    model_path = os.path.join(MODEL_DIR, f"{config['name']}_pipeline.pkl")
    joblib.dump(pipeline, model_path)
    print(f"Saved pipeline to: {model_path}")
    
print("\nAll models trained and saved successfully.")
