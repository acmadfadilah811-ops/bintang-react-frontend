import json

for step_idx in [2013, 2025, 2076, 2094]:
    try:
        with open(f"step_{step_idx}.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            print(f"--- Step {step_idx} ---")
            print("Description:", data.get("content"))
            tool_calls = data.get("tool_calls", [])
            print("Number of tool calls:", len(tool_calls))
            for i, tc in enumerate(tool_calls):
                print(f"  Tool Call {i}: {tc.get('name')}")
                args = tc.get("args", {})
                if "TargetFile" in args:
                    print(f"    TargetFile: {args['TargetFile']}")
                if "StartLine" in args:
                    print(f"    Lines: {args['StartLine']} - {args['EndLine']}")
                if "ReplacementContent" in args:
                    content_len = len(args["ReplacementContent"])
                    print(f"    ReplacementContent length: {content_len}")
                    # Write to a file
                    out_name = f"replacement_{step_idx}_{i}.txt"
                    with open(out_name, "w", encoding="utf-8") as out:
                        out.write(args["ReplacementContent"])
                    print(f"    Saved ReplacementContent to {out_name}")
    except Exception as e:
        print(f"Error reading step {step_idx}: {e}")
