import json
import os

notebook_path = "c:\\Users\\Prince\\OneDrive\\Desktop\\Health Risk Prediction\\Notebook\\eda.ipynb"

with open(notebook_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Find the cell where split happens
# Before this, we had manual scaling
split_idx = -1
for i, cell in enumerate(nb["cells"]):
    if cell["cell_type"] == "code" and "train_test_split(" in "".join(cell["source"]):
        split_idx = i
        break

if split_idx != -1:
    # Delete the double scaling cells that come after split
    # Cells [10], [11], [12] in the original notebook 
    # Let's just find and mark them for deletion instead of assuming index
    cells_to_delete = []
    
    for i in range(split_idx + 1, len(nb["cells"])):
        source = "".join(nb["cells"][i]["source"])
        
        # 1. scaler = StandardScaler()
        if "scaler = StandardScaler()" in source and "X_train = scaler.fit_transform(X_train)" in source:
            cells_to_delete.append(i)
        # 2. X_test = scaler.transform(X_test)
        elif "X_test =" in source and "scaler.transform(X_test)" in source and "X_train[:5]" in source:
            cells_to_delete.append(i)
        # 3. Double scaling pd.DataFrame(...)
        elif "X_train = pd.DataFrame(" in source and "scaler.fit_transform(X_train)" in source:
            cells_to_delete.append(i)
            
    # Delete in reverse order to keep indices valid
    for i in reversed(cells_to_delete):
        del nb["cells"][i]

# Find the pipeline cell and replace GaussianNB with DecisionTreeClassifier
for cell in nb["cells"]:
    if cell["cell_type"] == "code":
        source = "".join(cell["source"])
        if "from sklearn.pipeline import Pipeline" in source and "GaussianNB" in source:
            cell["source"] = [
                "from sklearn.pipeline import Pipeline\n",
                "from sklearn.preprocessing import StandardScaler\n",
                "from sklearn.tree import DecisionTreeClassifier"
            ]
        elif "pipeline = Pipeline([" in source and "GaussianNB()" in source:
            cell["source"] = [
                "pipeline = Pipeline([\n",
                "    (\"scaler\", StandardScaler()),\n",
                "    (\"model\", DecisionTreeClassifier(\n",
                "        max_depth=5, min_samples_split=5,\n",
                "        min_samples_leaf=2, random_state=42\n",
                "    ))\n",
                "])"
            ]
            # Clear outputs since they are stale
            cell["outputs"] = []

# Find pipeline fitting cell and clear its stale output
for cell in nb["cells"]:
    if cell["cell_type"] == "code":
        source = "".join(cell["source"])
        if "pipeline.fit" in source or "pipeline.predict(" in source or "joblib.dump(" in source:
            cell["outputs"] = []

with open(notebook_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1)
    
print("Notebook updated successfully.")
