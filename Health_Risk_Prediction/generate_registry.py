import pandas as pd
import json

datasets = {
    "heart_disease": "Data/heart_disease.csv",
    "hypertension": "Data/hypertension.csv",
    "stroke": "Data/stroke.csv",
    "kidney_disease": "Data/kidney_disease.csv"
}

targets = {
    "heart_disease": "target",
    "hypertension": "target",
    "stroke": "stroke",
    "kidney_disease": "classification"
}

drop_cols = {
    "heart_disease": [],
    "hypertension": [],
    "stroke": ["id"],
    "kidney_disease": ["id"]
}

display_names = {
    "heart_disease": "Heart Disease",
    "hypertension": "Hypertension",
    "stroke": "Stroke",
    "kidney_disease": "Kidney Disease"
}

registry_entries = {}

for name, path in datasets.items():
    df = pd.read_csv(path)
    
    if name == 'kidney_disease':
        df = df.replace('?', None)
        df = df.replace('\t?', None)
        for col in df.columns:
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.strip()
                
        numeric_cols = ['age', 'bp', 'sg', 'al', 'su', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
    
    drop = drop_cols[name]
    if drop:
        df = df.drop(columns=[col for col in drop if col in df.columns], errors='ignore')
        
    df.replace(r'^\s*$', None, regex=True, inplace=True)
    target = targets[name]
    
    features = []
    for col in df.columns:
        if col == target:
            continue
            
        dtype = str(df[col].dtype)
        if 'int' in dtype or 'float' in dtype:
            type_str = 'float' # Accept float for all numeric to be safe
            min_val = float(df[col].min()) if not pd.isna(df[col].min()) else 0.0
            max_val = float(df[col].max()) if not pd.isna(df[col].max()) else 1000.0
            features.append({
                "name": col,
                "label": col.replace('_', ' ').title(),
                "type": type_str,
                "min": round(min_val, 2),
                "max": round(max_val, 2),
                "hint": f"Enter value for {col}"
            })
        else:
            features.append({
                "name": col,
                "label": col.replace('_', ' ').title(),
                "type": "str",
                "options": [str(x) for x in df[col].dropna().unique()[:10]],
                "hint": f"Enter value for {col}"
            })
            
    registry_entries[name] = {
        "model_file": f"{name}_pipeline.pkl",
        "display_name": display_names[name],
        "features": features,
        "positive_label": f"Positive for {display_names[name]}",
        "negative_label": f"Negative for {display_names[name]}"
    }

with open('registry_output.json', 'w') as f:
    json.dump(registry_entries, f, indent=4)
print("Generated registry items to registry_output.json!")
