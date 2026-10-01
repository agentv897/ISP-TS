import os
from typing import List, Dict, Any, Optional, Tuple
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence.models import AnalyzeResult, AnalyzeDocumentRequest, DocumentAnalysisFeature
from config import Config

class LayoutParser:
    def __init__(self):
        Config.validate()
        self.client = DocumentIntelligenceClient(
            endpoint=Config.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
            credential=AzureKeyCredential(Config.AZURE_DOCUMENT_INTELLIGENCE_KEY)
        )
        
        # Define Query Fields for precise extraction (broader queries for better coverage)
        self.query_fields = [
            # Efficacy
            {"name": "overall_response_rate", "query": "What is the overall response rate (ORR) percentage?"},
            {"name": "complete_response_rate", "query": "What is the complete response (CR) rate percentage?"},
            {"name": "median_pfs", "query": "What is the median progression-free survival (PFS) or time to progression in months?"},
            {"name": "median_os", "query": "What is the median overall survival (OS) in months?"},
            
            # PK - IMPROVED QUERIES
            {"name": "elimination_half_life", "query": "What is the elimination half-life or t1/2?"},
            {"name": "plasma_protein_binding", "query": "What is the plasma protein binding percentage?"},
            {"name": "clearance", "query": "What is the total clearance (CL)?"},
            {"name": "volume_distribution", "query": "What is the volume of distribution (Vd, Vss, or Vz)?"},
            {"name": "metabolism_pathway", "query": "What is the primary metabolism pathway or enzyme (UGT, CYP)?"},
            
            # Hepatic Safety - IMPROVED QUERIES
            {"name": "hepatic_exclusion_bilirubin", "query": "What are the exclusion criteria for bilirubin, ALT, AST, or hepatic impairment?"},
            {"name": "lft_monitoring", "query": "What are the liver function test monitoring requirements?"},
            
            # Safety Rates (Grade 3-4 specific)
            {"name": "grade_3_4_anemia", "query": "What is the Grade 3-4 Anemia rate?"},
            {"name": "grade_3_4_thrombocytopenia", "query": "What is the Grade 3-4 Thrombocytopenia rate?"},
            {"name": "grade_3_4_neutropenia", "query": "What is the Grade 3-4 Neutropenia rate?"},
        ]

    def analyze_document(self, file_path: str) -> Tuple[str, Dict[str, Any]]:
        """
        Extract document content as MARKDOWN + Query Field results.
        Returns: (markdown_string, query_results_dict)
        
        NOTE: Azure Document Intelligence queryFields requires identifiers
        matching ^[\\p{L}\\p{M}\\p{N}_]{1,64}$ — NOT natural language questions.
        We pass the short 'name' values (e.g. 'overall_response_rate') as field names.
        """
        try:
            # Azure DI queryFields must be alphanumeric+underscore identifiers (max 64 chars)
            query_list = [q["name"] for q in self.query_fields]
            
            with open(file_path, "rb") as f:
                poller = self.client.begin_analyze_document(
                    "prebuilt-layout", 
                    body=f,
                    content_type="application/pdf",
                    output_content_format="markdown",
                    features=[DocumentAnalysisFeature.QUERY_FIELDS],
                    query_fields=query_list
                )
            
            result: AnalyzeResult = poller.result()
            
            # Extract query field results
            query_results = {}
            if result.documents and len(result.documents) > 0:
                doc = result.documents[0]
                if hasattr(doc, 'fields') and doc.fields:
                    for field_name, field_data in doc.fields.items():
                        val = None
                        if hasattr(field_data, 'content') and field_data.content:
                            val = field_data.content
                        elif hasattr(field_data, 'value_string') and field_data.value_string:
                            val = field_data.value_string
                        elif hasattr(field_data, 'value') and field_data.value:
                            val = str(field_data.value)
                        
                        if val and val.lower() not in ["not found", "none", "null", "no", "n/a", "not specified"]:
                            query_results[field_name] = val
                            print(f"   -> [Query Match] {field_name}: {val}")
            
            print(f"   -> Total Query Fields Captured: {len(query_results)}")
            return str(result.content), query_results
            
        except Exception as e:
            print(f"Error in Azure Document Intelligence: {e}")
            # Fallback: attempt a cleaner call without features or return empty
            try:
                with open(file_path, "rb") as f:
                    poller = self.client.begin_analyze_document(
                        "prebuilt-layout", 
                        body=f,
                        content_type="application/pdf"
                    )
                fallback_result = poller.result()
                return getattr(fallback_result, "content", ""), {}
            except:
                return "", {}
