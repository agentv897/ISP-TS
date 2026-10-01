import sys, os, json
from typing import Union

os.chdir(r'd:\KG_F\KG_F\Data_extraction\backend\extraction_engine')
sys.path.insert(0, '.')

from src.schema.section_schemas import get_schema_for_section

# Replicate the manual schema builder from dili_extractor.py
def build_schema_manual(model_cls):
    properties = {}
    required = []
    for field_name, field_info in model_cls.model_fields.items():
        prop = {}
        annotation = field_info.annotation
        origin = getattr(annotation, '__origin__', None)
        is_optional = False
        inner_type = annotation
        if origin is Union:
            args = [a for a in annotation.__args__ if a is not type(None)]
            if args:
                inner_type = args[0]
                is_optional = True
                origin = getattr(inner_type, '__origin__', None)
        if inner_type is str:
            prop["type"] = "string"
        elif inner_type is int:
            prop["type"] = "integer"
        elif inner_type is float:
            prop["type"] = "number"
        elif inner_type is bool:
            prop["type"] = "boolean"
        elif origin is list:
            prop["type"] = "array"
            prop["items"] = {"type": "string"}
        elif hasattr(inner_type, 'model_fields'):
            prop = build_schema_manual(inner_type)
        else:
            prop["type"] = "string"
        if field_info.description:
            prop["description"] = str(field_info.description)
        properties[field_name] = prop
        if field_info.is_required() and not is_optional:
            required.append(field_name)
    schema = {"type": "object", "properties": properties}
    if required:
        schema["required"] = required
    return schema

sections = [
    'Population Characteristics',
    'Safety and Adverse Events',
    'Pharmacokinetics',
    'Efficacy Outcomes',
    'Drug Overview',
    'Nonclinical Toxicology',
    'Other',
]

for s in sections:
    info = get_schema_for_section(s)
    schema = build_schema_manual(info["model"])
    n_props = len(schema.get("properties", {}))
    # Verify it's JSON-serializable
    json.dumps(schema)
    print(f"  {s}: {n_props} properties - OK")

print("\nALL SCHEMAS PASS - no _SpecialForm crash")
