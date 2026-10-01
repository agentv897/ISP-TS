import os
import json
import logging
from dotenv import load_dotenv

# Set logging
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

PROJECT_ID = os.getenv("SPANNER_PROJECT_ID", "life-sciences-ai-poc")
INSTANCE_ID = os.getenv("SPANNER_INSTANCE_ID", "demofactory")
DATABASE_ID = os.getenv("SPANNER_DATABASE_ID", "life_sciences_kg")

try:
    from google.cloud import spanner
except ImportError:
    logging.error("google-cloud-spanner is not installed. Please run `pip install google-cloud-spanner`")
    exit(1)

# Import the mock graph generation logic from our server
import flask_server

def build_mock_graph():
    logging.info("Generating graph data from local definitions...")
    
    # We will use flask server's get_graph() method slightly modified or we can extract the local graph_data object
    # For robust extraction without Flask app context, let's assemble it exactly as flask_server does internally
    graph_data = {
        "nodes": [
            {
                "id": "Fentanyl", "label": "Fentanyl", "type": "Drug", "color": "#002970",
                "properties": {
                    "Class": {"value": "Synthetic Opioid", "details": "Potent μ-opioid receptor agonist used for pain management and anesthesia."},
                    "Potency": {"value": "High", "details": "Approximately 50-100 times more potent than morphine."},
                    "Onset": {"value": "Rapid", "details": "Immediate action makes it useful in acute pain settings."}
                }
            },
            {
                "id": "Esketamine", "label": "Esketamine", "type": "Drug", "color": "#002970",
                "properties": {
                    "Class": {"value": "NMDA Receptor Antagonist", "details": "Used as a general anesthetic and for treatment-resistant depression."},
                    "Potency": {"value": "High", "details": "More potent S(+) enantiomer of ketamine."}
                }
            },
            {
                "id": "Ketamine", "label": "Ketamine", "type": "Drug", "color": "#002970",
                "properties": {
                    "Class": {"value": "Dissociative Anesthetic", "details": "Racemic mixture used for anesthesia and pain management."}
                }
            },
            {
                "id": "Arketamine", "label": "Arketamine", "type": "Drug", "color": "#002970",
                "properties": {
                    "Class": {"value": "NMDA Receptor Antagonist", "details": "The (R)-(-)-enantiomer of ketamine."}
                }
            },
            {
                "id": "Norketamine", "label": "Norketamine", "type": "Drug", "color": "#002970",
                "properties": {
                    "Class": {"value": "Primary Metabolite", "details": "Major active metabolite of ketamine formed mostly via CYP3A4."}
                }
            },
            {
                "id": "Tiletamine", "label": "Tiletamine", "type": "Drug", "color": "#002970",
                "properties": {
                    "Class": {"value": "Dissociative Anesthetic", "details": "Used primarily in veterinary medicine, often combined with zolazepam."}
                }
            },
            {
                "id": "Lofentanil", "label": "Lofentanil", "type": "Drug", "color": "#002970",
                "properties": {
                    "Potency": {"value": "Extremely High", "details": "Longest duration of action among fentanyl analogs."},
                    "Use": {"value": "Research", "details": "Primarily used in ligand binding studies."}
                }
            },
            {
                "id": "Alfentanil", "label": "Alfentanil", "type": "Drug", "color": "#002970",
                "properties": {
                    "Duration": {"value": "Short", "details": "Ultra short-acting analgesic, used for minor procedures."},
                    "CAS": {"value": "71195-58-9", "details": "Chemical Abstract Service Registry Number"}
                }
            },
            {
                "id": "Sufentanil", "label": "Sufentanil", "type": "Drug", "color": "#002970",
                "properties": {
                    "Potency": {"value": "Very High", "details": "5-10 times more potent than its parent drug, fentanyl."},
                    "Therapeutic_Index": {"value": "Favorable", "details": "Greater margin of safety compared to fentanyl."}
                }
            },
            {
                "id": "Carfentanil", "label": "Carfentanil", "type": "Drug", "color": "#002970",
                "properties": {
                    "Warning": {"value": "Extremely Toxic", "details": "Intended for veterinary use (large animal sedative)."},
                    "Potency": {"value": "Maximum", "details": "10,000 times more potent than morphine."}
                }
            },
            {
                "id": "Remifentanil", "label": "Remifentanil", "type": "Drug", "color": "#002970",
                "properties": {
                    "Metabolism": {"value": "Unique", "details": "Rapidly metabolised by non-specific blood and tissue esterases."},
                    "Recovery": {"value": "Immediate", "details": "Quick return of consciousness after infusion stops."}
                }
            },
            # Adverse Events
            {"id": "AE_Suf_1", "label": "Resp. Depression", "type": "AdverseEvent", "color": "#ef4444"},
            {"id": "AE_Suf_2", "label": "Bradycardia", "type": "AdverseEvent", "color": "#ef4444"},
            {"id": "AE_Alf_1", "label": "Sedation", "type": "AdverseEvent", "color": "#ef4444"},
            {"id": "AE_Alf_2", "label": "Miosis", "type": "AdverseEvent", "color": "#ef4444"},
            {"id": "AE_Alf_3", "label": "Nausea", "type": "AdverseEvent", "color": "#ef4444"},
            {"id": "AE_Alf_4", "label": "Dizziness", "type": "AdverseEvent", "color": "#ef4444"},
            {"id": "AE_Rem_1", "label": "Muscle Rigidity", "type": "AdverseEvent", "color": "#ef4444"},
            {"id": "AE_Rem_2", "label": "Hypotension", "type": "AdverseEvent", "color": "#ef4444"},
            {"id": "AE_Car_1", "label": "Sudden Apnea", "type": "AdverseEvent", "color": "#ef4444"},
            {"id": "AE_Lof_1", "label": "CNS Depression", "type": "AdverseEvent", "color": "#ef4444"},
            
            # Clinical Data Nodes
            {
                "id": "CD_Fen_Male", "label": "Male Clinical Study", "type": "Endpoint", "color": "#f59e0b",
                "properties": {"Drug": {"value": "Fentanyl", "details": ""}, "Population": {"value": "Healthy", "details": ""}, "Sex": {"value": "Male", "details": ""}, "Dose": {"value": "400 ug", "details": ""}, "Route": {"value": "Sublingual", "details": ""}, "Tmax": {"value": "45-60 min", "details": ""}, "Cmax": {"value": "1.2 ng/mL", "details": ""}, "AUC": {"value": "5.5 ng*h/mL", "details": ""}}
            },
            {
                "id": "CD_Fen_Fem", "label": "Female Clinical Study", "type": "Endpoint", "color": "#f59e0b",
                "properties": {"Drug": {"value": "Fentanyl", "details": ""}, "Population": {"value": "Healthy", "details": ""}, "Sex": {"value": "Female", "details": ""}, "Dose": {"value": "400 ug", "details": ""}, "Route": {"value": "Sublingual", "details": ""}, "Tmax": {"value": "45-60 min", "details": ""}, "Cmax": {"value": "1.4 ng/mL", "details": ""}, "AUC": {"value": "6.1 ng*h/mL", "details": ""}}
            },
            
            # Preclinical Data
            {
                "id": "PC_Fen_Rat", "label": "Preclinical: Rat", "type": "Species", "color": "#22c55e",
                "properties": {"Drug": {"value": "Fentanyl", "details": ""}, "Species": {"value": "Rat", "details": ""}, "Sex": {"value": "M/F", "details": ""}, "Strain": {"value": "Sprague-D", "details": ""}, "Dose": {"value": "100 ug", "details": ""}, "ALT": {"value": "58 U/L", "details": ""}, "AST": {"value": "112 U/L", "details": ""}, "Source": {"value": "PubMed 1", "details": ""}, "Cmax": {"value": "2 - 3 ng/mL", "details": ""}, "AUC": {"value": "1.5 - 2 ng*h/mL", "details": ""}}
            },
        ],
        "links": []
    }

    # Generate Dynamic Data from Flask Arrays
    for cluster in flask_server.DRUG_CLUSTERS:
        main = cluster['main']
        graph_data['nodes'].append({
            "id": main, "label": main, "type": "Drug", "color": "#002970",
            "properties": {"Class": {"value": cluster['type'], "details": f"Primary indication for {cluster['type']} management."}}
        })
        for sim in cluster['sim']:
            graph_data['nodes'].append({
                "id": sim, "label": sim, "type": "Drug", "color": "#002970",
                "properties": {"Class": {"value": cluster['type'], "details": f"Chemically or functionally similar to {main}."}}
            })
            graph_data['links'].append({"source": main, "target": sim, "label": "SimilarTo"})
        
        # AE list
        ae_list = [f"AE_{main}_Nausea", f"AE_{main}_Drowsy", f"AE_{main}_Headache"]
        for ae_id in ae_list:
            graph_data['nodes'].append({
                "id": ae_id, "label": ae_id.split('_')[-1], "type": "AdverseEvent", "color": "#ef4444", "properties": {}
            })
            graph_data['links'].append({"source": main, "target": ae_id, "label": "AE"})

    hardcoded_links = [
        {"source": "Fentanyl", "target": "Lofentanil", "label": "SimilarTo"},
        {"source": "Fentanyl", "target": "Alfentanil", "label": "SimilarTo"},
        {"source": "Fentanyl", "target": "Sufentanil", "label": "SimilarTo"},
        {"source": "Fentanyl", "target": "Carfentanil", "label": "SimilarTo"},
        {"source": "Fentanyl", "target": "Remifentanil", "label": "SimilarTo"},
        {"source": "Esketamine", "target": "Ketamine", "label": "SimilarTo"},
        {"source": "Esketamine", "target": "Arketamine", "label": "SimilarTo"},
        {"source": "Esketamine", "target": "Norketamine", "label": "SimilarTo"},
        {"source": "Esketamine", "target": "Tiletamine", "label": "SimilarTo"},
        {"source": "Sufentanil", "target": "AE_Suf_1", "label": "AE"},
        {"source": "Fentanyl", "target": "CD_Fen_Male", "label": "Has Clinical Data"},
        {"source": "Fentanyl", "target": "CD_Fen_Fem", "label": "Has Clinical Data"},
        {"source": "Fentanyl", "target": "PC_Fen_Rat", "label": "Has Preclinical Data"},
    ]
    graph_data['links'].extend(hardcoded_links)

    # Dynamic JSON files loading
    for file_name, sheets in flask_server.DYNAMIC_DATA.items():
        drug_base = file_name.split("_")[0].split(" ")[0].capitalize()
        for sheet_name, rows in sheets.items():
            if not rows: continue
            
            type_tag = "Endpoint"
            color = "#f59e0b"
            if "PRECLI" in sheet_name.upper(): 
                type_tag = "Preclinical"
                color = "#f59e0b" 
            elif "TRANSCRIPT" in sheet_name.upper(): 
                type_tag = "Transcriptomics"
                color = "#14b8a6"
            elif "CLI" in sheet_name.upper() or "STUDY" in sheet_name.upper(): 
                type_tag = "Clinical"
                color = "#ef4444"
            if "Adverse" in sheet_name or "AE" in sheet_name:
                type_tag = "AdverseEvent"
                color = "#ef4444"
            
            for i, row in enumerate(rows):
                d_name_raw = row.get("Drug", row.get("Drug Name", row.get("Drug_Name", drug_base)))
                if not d_name_raw or str(d_name_raw) == "nan": d_name_raw = drug_base
                d_name = flask_server.normalize_drug_name(d_name_raw)
                
                special_id = ""
                if type_tag == "Transcriptomics":
                    conc = row.get("Concentration", row.get("dose", "unknown"))
                    special_id = f"_{flask_server.get_id_safe(str(conc))}"
                
                node_id = f"DYN_{flask_server.get_id_safe(d_name)}_{flask_server.get_id_safe(sheet_name)}{special_id}_{i}"
                label = f"{d_name}: {sheet_name} ({i+1})"
                
                props = {}
                for k, v in row.items():
                    if str(v) != "nan" and k not in ["Drug", "Drug Name", "Drug_Name"]:
                        props[k] = {"value": str(v), "details": ""}
                
                graph_data['nodes'].append({
                    "id": node_id, "label": label, "type": type_tag, "color": color, "properties": props
                })
                graph_data['links'].append({
                    "source": d_name, "target": node_id, "label": f"Has {type_tag} Data"
                })

    for cluster in flask_server.DRUG_CLUSTERS:
        main_drug = cluster['main']
        ext_aes = flask_server.fetch_external_ae(main_drug)
        for ae in ext_aes:
            ae_id = f"EXT_AE_{flask_server.get_id_safe(main_drug)}_{flask_server.get_id_safe(ae)}"
            graph_data['nodes'].append({
                "id": ae_id, "label": ae, "type": "AdverseEvent", "color": "#ef4444", "properties": {"Source": {"value": "FDA/PubChem", "details": ""}}
            })
            graph_data['links'].append({
                "source": main_drug, "target": ae_id, "label": "AE"
            })

    return graph_data

def setup_database():
    logging.info(f"Connecting to Spanner Project: {PROJECT_ID}, Instance: {INSTANCE_ID}")
    
    # Check for placeholder default
    if "your-project-id" in PROJECT_ID:
        logging.error("ERROR: Project ID has a placeholder. Please configure .env variables.")
        return

    spanner_client = spanner.Client(project=PROJECT_ID)
    instance = spanner_client.instance(INSTANCE_ID)
    database = instance.database(DATABASE_ID)

    # Note: Depending on your database state, it might already exist. This script targets updating tables.
    if not instance.exists():
        logging.error(f"Instance '{INSTANCE_ID}' does not exist.")
        return

    # Check database
    if not database.exists():
        logging.info(f"Creating database '{DATABASE_ID}'...")
        database = instance.database(DATABASE_ID)
        op = database.create()
        op.result(120)  # Wait for db create

    logging.info("Running standard DDL to create Nodes, Edges, and the Property Graph...")
    ddl_statements = [
        "CREATE TABLE Nodes (id STRING(MAX) NOT NULL, label STRING(MAX), type STRING(MAX), color STRING(MAX), properties JSON) PRIMARY KEY (id)",
        "CREATE TABLE Edges (source_id STRING(MAX) NOT NULL, target_id STRING(MAX) NOT NULL, label STRING(MAX)) PRIMARY KEY (source_id, target_id, label)",
        """CREATE PROPERTY GRAPH LifeSciencesGraph
          NODE TABLES ( Nodes )
          EDGE TABLES (
            Edges
              SOURCE KEY (source_id) REFERENCES Nodes (id)
              DESTINATION KEY (target_id) REFERENCES Nodes (id)
          )"""
    ]

    try:
        op = database.update_ddl(ddl_statements)
        op.result(120)  # Wait for DDL
        logging.info("Successfully created Nodes, Edges, and LifeSciencesGraph.")
    except Exception as e:
        if "Duplicate name" in str(e) or "already exists" in str(e).lower():
            logging.info("Tables or graph already exist. Proceeding to insert data...")
        else:
            logging.error(f"DDL Update Error: {e}")
            return

    # Get graph data
    graph_data = build_mock_graph()
    
    # Deduplicate nodes and links cleanly
    node_map = {}
    for n in graph_data["nodes"]:
        node_map[n["id"]] = n
    
    links_seen = set()
    cleaned_links = []
    for l in graph_data["links"]:
        sid = l["source"]
        tid = l["target"]
        lbl = l["label"]
        key = f"{sid}_{tid}_{lbl}"
        if key not in links_seen:
            # Check foreign keys to ensure insertion doesn't fail
            if sid in node_map and tid in node_map:
                links_seen.add(key)
                cleaned_links.append((sid, tid, lbl))

    logging.info(f"Total Unique Nodes to Insert: {len(node_map)}")
    logging.info(f"Total Unique Edges to Insert: {len(cleaned_links)}")

    def insert_batch(transaction):
        nodes_batch = []
        for n in node_map.values():
            props = n.get("properties", {})
            nodes_batch.append((n["id"], n["label"], n["type"], n.get("color", ""), json.dumps(props)))
        
        # Batch nodes
        transaction.insert_or_update(
            table="Nodes",
            columns=("id", "label", "type", "color", "properties"),
            values=nodes_batch,
        )
        
        # Batch edges
        transaction.insert_or_update(
            table="Edges",
            columns=("source_id", "target_id", "label"),
            values=cleaned_links,
        )

    logging.info("Writing batch insertion to Spanner...")
    try:
        database.run_in_transaction(insert_batch)
        logging.info("SUCCESS! Data has been uploaded to Spanner.")
    except Exception as e:
        logging.error(f"Failed to insert data: {e}")

if __name__ == "__main__":
    setup_database()
