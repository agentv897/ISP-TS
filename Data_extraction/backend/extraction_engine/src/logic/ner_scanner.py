
import re
from typing import Dict, List

class NERScanner:
    """
    Lightweight Named Entity Recognition scanner.
    Falls back to regex-based matching if scispaCy is not installed.
    """
    
    def __init__(self):
        # Basic patterns for common clinical entities in IBs
        self.patterns = {
            "CHEMICAL": [
                r"\bBelinostat\b", r"\bPXD101\b", r"\bHDAC inhibitor\b",
                r"\bhistone deacetylase\b", r"\bBortezomib\b", r"\bDexamethasone\b",
                r"\bCisplatin\b", r"\bGemcitabine\b", r"\bEtoposide\b"
            ],
            "DISEASE": [
                r"\bPeripheral T-Cell Lymphoma\b", r"\bPTCL\b", r"\bLymphoma\b",
                r"\bThrombocytopenia\b", r"\bNeutropenia\b", r"\bAnemia\b",
                r"\bNausea\b", r"\bFatigue\b", r"\bVomiting\b", r"\bPyrexia\b",
                r"\bHepatotoxicity\b", r"\bLiver injury\b"
            ],
            "GENE": [
                r"\bHDAC\d*\b", r"\bUGT1A1\b", r"\bCYP3A4\b", r"\bTP53\b"
            ]
        }
        print("NERScanner initialized (Regex Fallback mode).")

    def scan(self, text: str) -> Dict[str, List[str]]:
        """Scans text for entities."""
        results = {
            "CHEMICAL": [],
            "DISEASE": [],
            "GENE": []
        }
        
        for category, patterns in self.patterns.items():
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    # Deduplicate and add
                    results[category].extend(list(set(matches)))
            
            # Clean results
            results[category] = list(set(results[category]))
            
        return results
