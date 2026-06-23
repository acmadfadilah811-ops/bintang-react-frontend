import json

log_path = r"C:\Users\USER\.gemini\antigravity\brain\c5294f84-113f-4279-a90d-18d682be8b23\.system_generated\logs\overview.txt"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step_idx = data.get('step_index')
            if step_idx in [2013, 2025, 2076, 2094]:
                print(f"Found step {step_idx}")
                with open(f"step_{step_idx}.json", "w", encoding="utf-8") as out:
                    json.dump(data, out, indent=2)
        except Exception as e:
            print("Error parsing line:", e)
