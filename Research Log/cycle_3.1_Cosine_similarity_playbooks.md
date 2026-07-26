
# DSR Iteration Log – Cycle 3.1: Checking Cosine Similarity from Vector Embeddings.

**Date:** [20th-July-2026]  
**Component Tested:** Cosine Similarity
**Dataset:** 
 - Incident Response Playbook_embeddings- 174 embeddings
---

## 1. What am I about to do?

I am about to test the retieval functions on the playbook dataset similarity with dense embeddings for the playbook embeddings. 


---

## 2. What do I expect to happen?
For the playbook_embeddings, when a query such as `How do i contain a ransomware attack on windows server?"` is passed, chunks that contain details describing containment procedures should be returned. 


---

## 3. What did I actually do?

### Attempt 1

I implemented a function called `"Search playbooks"` which uses cosine similarity that is calculated based on the dot product of each embedding to attempt to return similar chunks from the playbook embeddings. 

### Attempt 2 
I have corrected the variable name by using `embedding_model` to instantiated the sentence transformer, then embed the query before normalizing it. I also integrated the searc into the same notebook where embeddings are stored. 

---

## 4. What were the results?

### Attempt 1
The function failed while testing the query because i used the same variable name "playbook_embeddings" to instantiate and i also tried to use it in the function for embedding the query. `error (query_emb used before assignment)`

### Attempt 2
The function executed successfully. for the first query test it returned the top 5 relevant playbook chunks with similarity score of (0.4987, 0.4987, 0.4987, 0.4887). the second query trial also returned top 5 relevant playbooks with similarity scores of (0.4987, 0.4987, 0.4987, 0.4987, 0.4887), and the metadata (Incident IDs) were accurately preserved. For instance, Result 1 had the incident ID of `ID-2025-0092`

```
def search_playbooks(query: str, top_k: int = 5):
    """
    Search the playbook chunks using cosine similarity between the query and each pre‑computed chunk embedding.
    """
    # Embedding the query 
    query_emb = np.array(playbook_embeddings.embed_query(query))  #Same name as the model and trying to embed the query 
``` 
---

## 5. Did it pass or fail?

### Attempt 1
FAIL(Embedding Mismatch)

### Attempt 2 
PASSED (After fixing the code)

---

## 6. Why did it pass or fail?

The function failed because the same variable name "playbook_embeddings" was used to instantiate the model which resulted in a conflict in my function. 

The function passed because i made sure the model `sentence_transformer` was instantiated with a different name from what was in the `query-emb` variable following this, the query was embedded first,then normalized before calculating the dot product. the pre-computed playbook_embeddings provided the correct refernce points for comparison. 
---

## 7. What did I learn from this?

### Attempt 1
I learned that i need to ensure that my variables should be defined properly to avoid mismatch. 

### Attempt 2 
I learned that retrieval testing is essential to validate the choice of algorithms such as the BM25 and Sentence_Transformer used in the research. I also confirmed that is quite reasonable to write simple, understandable code over complex optimization as fas as it works reasonably. I also confirmed that the Cosine Similarity function works correctly once the variables are defined in the right order. 

I also noticed that the top-5 cosine similarity scores for playbook retrieval was very close approximately 0.49. this indicates the query is broadly relevant to several chunks, which is acceptable for a semantic search. the generated graph shows a narrow range for the top results, but that is expected since thay are the highest scoring items. 

---

## 8. What will I change for the next cycle?
### Attempt 1
I would change the variable name in the section where i instantiated the model and utilize it for only saving the playbook embeddings which i will use in the `search_playbook` function for the next trial. 

### Attempt 2 

the next step will be to generate graphs that will depict the similarity scores retrieved from the executed query and test the BM25 with a log response pair for my dissertation appendix. 

### Attempt 3

I have observed from the graphs that if i need sharper differentiation, I can experiment with a larger embedding model or add cross-encoder reranking. for now, the results are reasonable for a prototype.


---



