nodes = [
  {
    "id": "Futibatinib_Rat_Male_0_5mgkg",
    "label": "Rat (Male) 0.3mg/kg",
    "type": "Preclinical",
    "properties": {
      "SPECIES": {"value": "Rat", "details": ""},
      "SEX": {"value": "Male", "details": ""},
      "DOSE": {"value": "0.3 mg/kg", "details": ""},
      "NOAEL": {"value": "0.3 mg/kg", "details": ""},
      "LOAEL": {"value": "0.6 mg/kg", "details": ""},
      "BIOAVAILABILITY": {"value": "65%", "details": ""},
      "CMAX": {"value": "15.2 ng/mL", "details": ""},
      "AUC": {"value": "95 ng*h/mL", "details": ""},
      "HALF_LIFE": {"value": "4.5 Hours", "details": ""},
      "ALT": {"value": "42 U/L", "details": ""},
      "AST": {"value": "42 U/L", "details": ""},
      "LIVER_WEIGHT": {"value": "Unchanged", "details": ""},
      "LATENCY": {"value": "14 Days", "details": ""},
      "SEVERITY": {"value": "None", "details": ""},
      "CLINICAL_SIGN": {"value": "No Adverse Signs", "details": ""},
      "HISTOPATHOLOGY": {"value": "Normal Tissue", "details": ""}
    }
  },
  {
    "id": "Futibatinib_Rat_Female_1mgkg",
    "label": "Rat (Female) 0.6mg/kg",
    "type": "Preclinical",
    "properties": {
      "SPECIES": {"value": "Rat", "details": ""},
      "SEX": {"value": "Female", "details": ""},
      "DOSE": {"value": "0.6 mg/kg", "details": ""},
      "CMAX": {"value": "29.8 ng/mL", "details": ""},
      "AUC": {"value": "160 ng*h/mL", "details": ""},
      "ALT": {"value": "42 U/L", "details": ""},
      "AST": {"value": "42 U/L", "details": ""},
      "LIVER_WEIGHT": {"value": "Increased", "details": ""},
      "LATENCY": {"value": "14 Days", "details": ""},
      "SEVERITY": {"value": "None", "details": ""},
      "CLINICAL_SIGN": {"value": "Lethargy", "details": ""},
      "HISTOPATHOLOGY": {"value": "Mineralization", "details": ""}
    }
  },
  {
    "id": "CD_Futibatinib_Clinical_Male",
    "label": "Human (Male)",
    "type": "Clinical",
    "properties": {
      "SPECIES": {"value": "Human", "details": ""},
      "SEX": {"value": "Male", "details": ""},
      "DOSE": {"value": "20 mg once daily", "details": ""},
      "CMAX": {"value": "0.85 ng/mL", "details": ""},
      "AUC": {"value": "14.2 ng*h/mL", "details": ""},
      "ALT": {"value": "42 U/L", "details": ""},
      "AST": {"value": "42 U/L", "details": ""},
      "POPULATION": {"value": "Adult Males", "details": ""}
    }
  },
  {
    "id": "CD_Futibatinib_Clinical_Female",
    "label": "Human (Female)",
    "type": "Clinical",
    "properties": {
      "SPECIES": {"value": "Human", "details": ""},
      "SEX": {"value": "Female", "details": ""},
      "DOSE": {"value": "20 mg once daily", "details": ""},
      "CMAX": {"value": "0.91 ng/mL", "details": ""},
      "AUC": {"value": "15.8 ng*h/mL", "details": ""},
      "ALT": {"value": "42 U/L", "details": ""},
      "AST": {"value": "42 U/L", "details": ""},
      "POPULATION": {"value": "Adult Females", "details": ""}
    }
  },
  {
    "id": "DUSP6",
    "label": "DUSP6",
    "type": "Transcriptomics",
    "properties": {
      "LOG2FC": {"value": "-1.5", "details": ""},
      "CELL_LINE": {"value": "U2OS", "details": ""},
      "GENE_LENGTH": {"value": "4,124 bp", "details": ""},
      "GENE_TARGET": {"value": "MAPK/ERK signaling pathway", "details": ""},
      "TOX_PREDICTION": {"value": "Risk of cellular senescence / metabolic stress", "details": ""},
      "EXPRESSION_LEVEL": {"value": "High (Heart, Brain, Liver)", "details": ""}
    }
  },
  {
    "id": "SPRY2",
    "label": "SPRY2",
    "type": "Transcriptomics",
    "properties": {
      "LOG2FC": {"value": "-2.1", "details": ""},
      "CELL_LINE": {"value": "U2OS", "details": ""},
      "GENE_LENGTH": {"value": "5,302 bp", "details": ""},
      "GENE_TARGET": {"value": "RTK inhibitor feedback loop", "details": ""},
      "TOX_PREDICTION": {"value": "Hyperproliferation risk if downregulated", "details": ""},
      "EXPRESSION_LEVEL": {"value": "Moderate (Kidney, Lung)", "details": ""}
    }
  },
  {
    "id": "Hyperphosphatemia",
    "label": "Hyperphosphatemia",
    "type": "AdverseEvent",
    "properties": {
      "SEVERITY": {"value": "Moderate", "details": ""}
    }
  },
  {
    "id": "Alopecia",
    "label": "Alopecia",
    "type": "AdverseEvent",
    "properties": {
      "SEVERITY": {"value": "Moderate", "details": ""}
    }
  },
  {
    "id": "FGFR1",
    "label": "FGFR1",
    "type": "Endpoint",
    "properties": {
      "NAME": {"value": "Fibroblast Growth Factor Receptor 1", "details": ""},
      "FUNCTION": {"value": "Cell proliferation & differentiation", "details": ""},
      "EXPRESSION": {"value": "Bone, blood vessels, brain", "details": ""},
      "ROLE_IN_CANCER": {"value": "Amplified in breast & squamous lung cancer", "details": ""}
    }
  },
  {
    "id": "FGFR2",
    "label": "FGFR2",
    "type": "Endpoint",
    "properties": {
      "NAME": {"value": "Fibroblast Growth Factor Receptor 2", "details": ""},
      "FUNCTION": {"value": "Embryonic development & tissue repair", "details": ""},
      "EXPRESSION": {"value": "Epithelial cells", "details": ""},
      "ROLE_IN_CANCER": {"value": "Fusions in cholangiocarcinoma", "details": ""}
    }
  }
]

links = [
  {
    "source": "Futibatinib",
    "target": "Futibatinib_Rat_Male_0_5mgkg",
    "label": "Has Preclinical Data"
  },
  {
    "source": "Futibatinib",
    "target": "Futibatinib_Rat_Female_1mgkg",
    "label": "Has Preclinical Data"
  },
  {
    "source": "CAT_Clinical_Futibatinib",
    "target": "CD_Futibatinib_Clinical_Male",
    "label": "Has Clinical Data"
  },
  {
    "source": "CAT_Clinical_Futibatinib",
    "target": "CD_Futibatinib_Clinical_Female",
    "label": "Has Clinical Data"
  },
  {
    "source": "DUSP6",
    "target": "Futibatinib",
    "label": "DOWNREGULATED_BY"
  },
  {
    "source": "SPRY2",
    "target": "Futibatinib",
    "label": "DOWNREGULATED_BY"
  },
  {
    "source": "Futibatinib",
    "target": "Hyperphosphatemia",
    "label": "COMMON_AE"
  },
  {
    "source": "Futibatinib",
    "target": "Alopecia",
    "label": "COMMON_AE"
  },
  {
    "source": "Futibatinib",
    "target": "FGFR1",
    "label": "TARGETS"
  },
  {
    "source": "Futibatinib",
    "target": "FGFR2",
    "label": "TARGETS"
  }

  {
    "source": "Futibatinib",
    "target": "Futibatinib_Monkey_Male_Female",
    "label": "Has Preclinical Data"
  },
]
