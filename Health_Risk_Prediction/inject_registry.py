import json

with open('registry_output.json', 'r') as f:
    new_registry = json.load(f)

# Format the dict as a python string
dict_str = json.dumps(new_registry, indent=4)
# We need to remove the first '{' and last '}' to just get the inner items
# Actually, the easiest way is to format each key and value and indent them properly.
lines = []
for key, val in new_registry.items():
    val_str = json.dumps(val, indent=4)
    # indent val_str by 4 spaces
    indented_val = "\n".join("    " + line for line in val_str.split("\n"))
    lines.append(f'    "{key}": {indented_val.strip()},')

insert_str = "\n".join(lines)

with open('backend/ml_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

import re
# We want to replace the commented out future diseases block:
#     # ─── Future diseases (add model file + features when trained) ───
#     # "heart_disease": { ... },
#     # "hypertension": { ... },
#     # "stroke": { ... },
#     # "kidney_disease": { ... },

pattern = r'(\s*# ─── Future diseases.*?# "kidney_disease": \{ \.\.\. \},\n)'
replacement = "\n" + insert_str + "\n"

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('backend/ml_service.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Injected into ml_service.py successfully!")
