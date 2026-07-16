# DSR Iteration Log – Cycle 1: Data Ingestion (JSON)

**Date:** [30th-June-2026]  
**Component Tested:** JSON Loading and Exploration  
**Datasets:** Kaggle [Incident Response Playbook Dataset: [Kaggle]('https://www.kaggle.com/datasets/cyberprince/incident-response-playbook-dataset?resource=download')]
---

## 1. What am I about to do?

I will load the Json datasets including the playbook and the logs and extract the contents. First i will load the Kaggle Incident Response Playbook JSON file using Python's `json` module. the goal is to:
- Understand the dataset structure (keys, nested fields, data types).
- Identify which fields contain the **text content** needed for RAG.
- Extract relevant fields and convert them into LangChain `Document` objects for later chunking and embedding.

**Specific tasks:**
- Load the JSON file into a Python list of dictionaries.
- Print the total number of records.
- Inspect the keys of the first record.
- Extract the `playbook_text` field (or equivalent) and store it as `page_content`.
- Store other relevant fields (e.g., `playbook_id`, `category`) as `metadata`.

---

## 2. What do I expect to happen?

Based on the Kaggle dataset description and the file structure:
- The JSON file should load without errors.
- The dataset should contain approximately **500–1000 records** (based on Kaggle description).
- Each record should contain a `playbook_text` field with the full textual playbook content.
- I expect to successfully convert at least **50 records** into LangChain `Document` objects.
- The `page_content` should contain readable text, and the `metadata` should include identifiers like `id` and `category`.

---

## 3. What did I actually do?

### Attempt 1
I loaded the JSON file by specifyig the path, and using Jq schema to laod the entire file. i also specified the length of the document, and tried to view the first 500 characters as well as the metakeys and the complete playbook.


### Attempt 2
I tried to import JsonLinesLoader from langchain_community.document_loaders 

### Attempt 3
I tried to load the dataset using JsonLoader


### Attempt 4
I tried to load the JSONL file using json.loads(). Received JSONDecodeError: Expecting ':' delimiter at character 296. Inspected the line to identify the malformed JSON.


### Attempt 5
I identified the malformed JSON line. The error was {"tactic","Impact"} instead of {"tactic":"Impact}. So i used a regex replacement to fix the pattern and saved a cleaned version of the file as `cleaned_incident_response_playbook_dataset.jsonl`

---

## 4. What were the results?
the output was an invalid SyntaxError: "specifically incorrect filepath," and "missing comma after file_path parameter."

### Attempt 2

Failed with ImportError: cannot import name 'JSONLinesLoader'.


### Attempt 3

Failed with JSONDecodeError: Extra data

### Attemp 4

Failure: JSONDecodeError at char 296. Line contains invalid JSON syntax.

### Attempt 5
Successfully cleaned the file. Validated that all lines now load correctly.
---

## 5. Did it pass or fail?

### Attempt 1
FAIL (Syntax error)

### Attempt 2
FAIL (ImportError)

### Attempt 3

Fail (JsonLoaderError)

### Attempt 4
FAIL

### Attempt 5

PASSED

---

## 6. Why did it pass or fail?

### Attempt 1
Incorrect filepath used: "./data/incident_response_playbook_dataset.jsonl, Python requires a comma between keyword arguments. I forgot the comma after file_path=....

### Attempt 2
JSONLinesLoader is not available in the Python version of LangChain. The correct Python class is JSONLoader.

### Attempt 3
The JSON Line files are all objects on seperate lines, and JSONLoader expect a single JSON array

### Attempt 4
The dataset contains malformed JSON (likely a trailing comma or unescaped quote). Real-world datasets often have formatting issues.

### Attempt 5
The regex fix corrected the missing colon, and the cleaned file now contains valid JSON Lines format.

---

## 7. What did I learn from this?

### Attempt 1
I will ensure the file path is set accurately moving forward, and always double-check Python syntax for function arguments. Missing commas are a common mistake.

### Attempt 2
Always verify that the documentation you're reading matches your programming language (Python vs JavaScript). Python uses JSONLoader for both JSON and JSONL files.

### Attempt 3
I need to try the manual line method instead of using the JSONLoader method to load th file. 


### Attempt 4
First, JSON lines can contain errors, Second, Always validate/clean data before loading, and Third I can use a cleaning script to fix common issues.

### Attempt 5
Real-world datasets often have formatting errors. Automated cleaning (using regex) is an efficient way to fix common issues without manual editing.

---

## 8. What will I change for the next cycle?
### Attempt 1
Add the missing comma, correct the file path and rerun
### Attempt 2
I will continue using JSONLoader with jq_schema='.' or the line‑by‑line json.loads method for JSONL files.
### Attempt 3
I will try using the manual method to load the JSONLINE file. 
### Attempt 4
I will inspect the line causing the syntax error, fix it and either manually correct it or write a cleaning script to correct it. then attempt loading again. 
### Attempt 5
I will use the cleaned file for all future steps (splitting, embeddings, retrieval).

---

