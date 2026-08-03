# DSR Iteration Log – Cycle 4: Creating the FAISS Vector Store

**Date:** [27th-July-2026]  
FAISS Vector Store
**Dataset:** playbook_chunks- 174 vectors

---

## 1. What am I about to do?
I am about to load the FAISS Vector Store to save the embeddings for the playbook_chunks, and use the FAISS to check retrieval and similarity score. 

## 2. What do I expect to happen?
I expect the FAISS Vector Store to handle the storage of the playbook_chunks and perform a good retrieval of relevant chunks as well as having a good similarity score. 

---

## 3. What did I actually do?

### Attempt 1
I attempted to load the FAISS store by providing the necessary parameters such as the FAISS_index and the embedding model "Sentence_Transformer".

### Attempt 2 
I created the file_path and ensured all parameters are accurately provided. 

### Attempt 3
Tested the FAISS Similarity with a simple query "How do i contain a ransomware?" using:

#### Code Snipett
``Python 
query = "How do I contain a ransomware attack?"
results = playbook_vectorstore.similarity_search(query, k=10)
print(results)

---

## 4. What were the results?

### Attempt 1
The execution resulted in an error which occured due to the provision of the wrong file path while loading the FAISS Index as shown in the code snipett below. the runtime error, 
Error: 'f' failed: could not open faiss_index\index.faiss for reading: No such file or directory indicates the error output. 

#### Code Snippet 
`` Python 
load_playbook_store = FAISS.load_local(
    "faiss_index",
    embedding_model,
    allow_dangerous_deserialization = True
)

print(f"loaded playbook vector stroe contains {load_playbook_store.index.ntotal} vectors")

### Attempt 2 
The execution was success, and 174 vectors were loaded. 

### Attempt 3
The query executed successfuly and returned top-10 relevant embeddings, this not only included the similar embeddings but its source as well. for example: for the query `how do i contain ransomware attack?` an embedding returnd was the source: IR-2025-0141, and its content included phase identification, containment, eradication, and recovery which aligns to the incident response cycle.  

---

## 5. Did it pass or fail?

### Attempt 1
FAIL

### Attempt 2
PASSED

### Attempt 3
PASSED

---

## 6. Why did it pass or fail?
### Attempt 1
the attempt failed because of the provision of incorrect directory/file path 

### Attempt 2
it passed because all parameters including the file path were correctly stated.

### Attempt 3
It passed because all parameters were correctly specified which enabled the FAISS store to be able to retrieve embeddings to answer the prompt. 



---

## 7. What did I learn from this?

### Attempt 1
I need to be careful when specifying the file path, as well as providing every other correct parameter to ensure the FAISS vector store is instantiated properly. 

### Attempt 2 
I need to ensure all parameters are properly stated in the future execution. 

### Attempt 3
I have learnt that the FAISS store is capable of performing retrieval and similarity scores and remains powerful at this task. 

---

## 8. What will I change for the next cycle?
I would ensure all parameters are properly placed and test the similarity score and relevancy of retrieved context. 

For the next cycle, i will try to implement the Open-Source LLM (Ollama), and perform query trial to see how good the model performs. 

---