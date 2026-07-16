
# DSR Iteration Log – Cycle 3: Vector Embeddings

**Date:** [13th-July-2026]  
**Component Tested:** Embedding Documents
**Dataset:** 
 - Incident Response Playbook_chunks – 174 Chunks
---

## 1. What am I about to do?
I will utilize sentence transformers to embed my playbook_chunks. this is expected to convert the raw text into numerical values to be stored in the vector database for similarity search. 

## 2. What do I expect to happen?

I expect to get my embeddings with the 381 dimensions for the sentence transformer on the playbook chunks, and get an equal match of embeddings to the total frequency of unique words from the log chunks. 

---

## 3. What did I actually do?

### Attempt 1

I embedded the playbook chunks efficiently using Sentence Transformers from HuggingFace. 

---

## 4. What were the results?

### Attempt 1
successfully embedded chunks and had 174 embeddings.


---

## 5. Did it pass or fail?

### Attempt 1
PASS

## 6. Why did it pass or fail?

It passed because the playbook chunks are quite small and efficient for my laptop to handle and using Sentence Transformer with the 384 dimensions make it fast  

---

## 7. What did I learn from this?

### Attempt 1
Using smaller chunks on CPU is faster to embed. 
---

## 8. What will I change for the next cycle?
### Attempt 1
I will utilize the saved embeddings for creating and storing in the vector database.
---



