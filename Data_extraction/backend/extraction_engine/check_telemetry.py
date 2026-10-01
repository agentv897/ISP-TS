import json, sys

path = r"D:\KG_F\KG_F\Data_extraction\backend\uploads\f7d7bb0d-5497-4913-b932-93c1e5c06aae\telemetry_extracted.json"
d = json.load(open(path))

print("=== METADATA ===")
print(json.dumps(d["metadata"], indent=2))

chunks = d["chunks"]
with_tokens = [c for c in chunks if c["total_tokens"] > 0]
with_errors = [c for c in chunks if c.get("error")]

nl = "\n"
print(f"{nl}Chunks total: {len(chunks)}")
print(f"Chunks with tokens: {len(with_tokens)}")
print(f"Chunks with errors: {len(with_errors)}")

if with_errors:
    print(f"{nl}=== FIRST 5 ERRORS ===")
    for c in with_errors[:5]:
        print(f"  [{c['section_type']}] {c['error']}")

if with_tokens:
    print(f"{nl}=== FIRST 3 WITH TOKENS ===")
    for c in with_tokens[:3]:
        print(f"  [{c['section_type']}] tokens={c['total_tokens']}")
