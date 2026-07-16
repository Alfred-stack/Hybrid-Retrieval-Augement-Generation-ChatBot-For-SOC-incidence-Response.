
# DSR Iteration Log – Cycle 3: Vector Embeddings

**Date:** [16th-July-2026]  
**Component Tested:** Embedding Documents
**Dataset:** 
- Precinct 6 Cybersecurity Logs (Parquet) (Log_chunks) – 11016 Chunks
---

## 1. What am I about to do?
Apply the BM25 Algorithm for dense retrieval, this will retrieve the most relevant log entries for a sample query 

## 2. What do I expect to happen?

I expect the BM25 retriever to provide the top 5 most relevant results based on the query provided. this should be done without 
improper indexing. 
---

## 3. What did I actually do?

### Attempt 1

I loaded the log_chunks with 50,000 sample records and unfortunately tried to embedd them using the sentence transformer. 

**Code:**
```python
embeddings = embeddings.embed_documents(playbook_texts)
print(f"playbook_text: {playbook_texts[0]}")
print(f" Embedding Length: {len(embeddings)}")
print(playbook_embeddings[:100])

this occured because i loaded the logchunks in the pickel code meant for playbooks 

**Code:**
```python
with open('../data/processed/log_chunks.pkl', 'rb') as f:
    playbook_chunks = pickle.load(f)


---

## 4. What were the results?

### Attempt 1
Memory exhaustion due to my CPU running 50,000 samples which was quite exhaustive. the code ran for 2 hours until i interrupted the execution. 

---

## 5. Did it pass or fail?

### Attempt 1
FAIL

## 6. Why did it pass or fail?

it failed because i was processing large chunks of 50,000 sample log records, trying to embed it with a 384 dimension sentence transformer model which explodes into a larger size therefore exhausting my RAM and attempting to utilize a virtual memory space and also draining my SSD. 

---

## 7. What did I learn from this?

### Attempt 1
I need to correct the code and replace the `playboo_chunks` with the correct file: `log_chuns` and also reduce the sample size of the log documents before chunking. 
---

## 8. What will I change for the next cycle?
### Attempt 1
Reduce the sample size to `~5,000 samples` and utilize the BM25 for retreival instead of embedding. 
---



