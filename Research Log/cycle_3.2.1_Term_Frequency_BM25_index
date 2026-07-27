
# DSR Iteration Log – Cycle 3.2.1: BM25 Retrieval on Log Texts.

**Date:** [25th-July-2026]  
BM25 Keyword-Based Retrieval  
**Dataset:** Log Chunks – 11,016 chunks

---

## 1. What am I about to do?

I am about to test the retieval functions on the Log dataset for cosine similarity based on the BM25 Keyword Scoring.
I will run test queries to see if the top results are relevant.



---

## 2. What do I expect to happen?
For the Log_chunks, when a query such as `"10.184.211.180"` (an IP address) is passed, the BM25 retriever should return log entries containing IP addresses.
Since BM25 is based on exact term matching, IP addresses and error codes should score highly.

---

## 3. What did I actually do?

### Attempt 1
I implemented the BM25 search function using the `rank_bm25` library. I tokenized the log texts using `.lower().split()` to preserve IP addresses and ports. I then tested the function with the query: `"10.184.211.180 failed authentication"`.

---

## 4. What were the results?

### Attempt 1
The function executed successfully for the query trial `Query_log= 10.184.211.180 failed authentication", top 10 relevant log entries were result with the highest similarity score of 0.87

---

## 5. Did it pass or fail?

### Attempt 1
PASSED 

---

## 6. Why did it pass or fail?
The function passed because all variables were properly named this time, and the query was tokenized appropraitely as well as the scores embedded with the retrieved log entries. 
---

## 7. What did I learn from this?

### Attempt 1
I learnt to ensure all variables are defined adequately which made the function run smoothly without errors. 
---

## 8. What will I change for the next cycle?
The next step will be to create the Vector Store using `Faiss` and ensure all embeddings are stored adequately before testing for retrieval and reranking to improve the semantic retrieval of the sentence transformer model used. 

---



# DSR Iteration Log – Cycle 3.2.1: BM25 Retrieval on Log Texts

**Date:** 20th July 2026  
**Component Tested:** BM25 Keyword-Based Retrieval  
**Dataset:** Log Chunks – 11,016 chunks

---

## 1. What am I about to do?

Test the BM25 retrieval function on the log dataset using keyword-based scoring. I will run test queries to check if the top results are relevant to the search terms.

---

## 2. What do I expect to happen?

When a query such as `"10.184.211.180"` (an IP address) is passed, the BM25 retriever should return log entries that contain that IP address. Since BM25 is based on exact term matching, IP addresses and error codes should score highly.

---

## 3. What did I actually do?

### Attempt 1
I implemented the BM25 search function using the `rank_bm25` library. I tokenized the log texts using `.lower().split()` to preserve IP addresses and ports. I then tested the function with the query: `"10.184.211.180 failed authentication"`.

**Code snippet:**
```python
from rank_bm25 import BM25Okapi

# Tokenize logs
tokenized_logs = [text.lower().split() for text in log_texts]
bm25 = BM25Okapi(tokenized_logs)

def bm25_search(query: str, top_k: int = 5):
    tokenized_query = query.lower().split()
    scores = bm25.get_scores(tokenized_query)
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
    results = []
    for idx in top_indices:
        results.append({
            'score': scores[idx],
            'text': log_texts[idx]
        })
    return results