
# DSR Iteration Log – Cycle 1: Data Ingestion (JSON)

**Date:** [5th-June-2026]  
**Component Tested:** Chunking Documents
**Dataset:** Kaggle [Precinct 6-Cybersecurity Logs: [Hugging-Face]('https://huggingface.co/datasets/witfoo/precinct6-cybersecurity')] & Kaggle [Incident Response Playbook Dataset: [Kaggle]('https://www.kaggle.com/datasets/cyberprince/incident-response-playbook-dataset?resource=download')]

---

## 1. What am I about to do?
I will load the datasets into a new notebook, and chunking them to see the various chunks for each dataset.

## 2. What do I expect to happen?

I expect to get an output of the chunk size and chunk overlaps 
---

## 3. What did I actually do?

### Attempt 1

i tested the chunking strategy on a sample of the log dataset to see what it looks like

### Attempt 2 

Also attempted to test the chunking strategy on a sample of the log dataset.

### Attempt 3
At this point, i have loaded the main dataset and have tried to split the dataset using the `RecursiveCharacterTextSplitter` because it handles any data format efficiently. 

---

## 4. What were the results?

### Attempt 1
the output was an error, specifically pointed to the log documents not been defined in the new notebook

### Attempt 2

it was successful, due to the presence of the dataset in the new notebook. the output produced a chunk size of 493 from 100 documents based on a specified chunk_size of 500 during the use of the recursivecharactertextsplitter. similarly, other outputs includes 252 chunks from 100 documents for a chunk size of 1000, and 176 chunks from 100 documents for a chunk size of 1500.

### Attempt 3
it wasn't a succesful attempt as it returned an error. A syntax error, as i tried to use metadata function call on a dataset with multiple list documents which wouldnt be handled well as it isnt a single list. There was equally a syntax error `meta_data`, which is a wrong way of calling the `metadata` function. 
---

## 5. Did it pass or fail?

### Attempt 1
FAIL (Log not defined)

### Attempt 2
PASSED 
---
### Attempt 3

FaIL(No module named `meta_data`)

## 6. Why did it pass or fail?

### Attempt 1
The log dataset wasnt present in the current notebook, as jupyter doesn't save the actions performed in a previous notebook in memory. 

### Attempt 2

the sample worked because of the presence of the new notebook 

### Attempt 3

it failed becaused i did slice the list documents to view its content, and i used a wrong function call syntax. 
---

## 7. What did I learn from this?

### Attempt 1
I have to save my notebook and import it into another notebook to continue using it. 

### Attempt 2

I have learnt that for a sample size, the chunk size reduces based on the specified chunk_size provided the the recurisvecharactertextsplitter function. I also expect a similar result with the main dataset used. 

### Attempt 3

I need to know that metadata function isnt called with an underscore, and i also need to remember that the `log_documents` dataset contains alot of list documents. 
---

## 8. What will I change for the next cycle?
### Attempt 1
I would save the notebook as a `pkl` file and import it into the new notebook.

### Attempt 2
I would ensure that use a similar chunk_size proportion for the main dataset. 

### Attempt 3
i would ensure to use the right function call and then also use the right function syntax.
---



