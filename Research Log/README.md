# AI_RAG - RAG Chatbot for Technical Playbooks & Logs

## System Overview

This repository contains the implementation of a **Retrieval-Augmented Generation (RAG)** chatbot designed to query technical playbooks and system logs. The system ingests structured and unstructured data, converts it into embeddings, and enables semantic search using a vector database.

This project is part of an **MSc Computer Science dissertation** following the **Design Science Research (DSR)** methodology. It implements iterative design cycles to build and evaluate a domain-specific RAG system.

---

##  Problem Statement

Technical teams often struggle to quickly retrieve relevant information from large collections of playbooks and log files. Traditional keyword-based search fails to capture semantic meaning. This chatbot enables users to ask natural language questions and receive context-aware answers grounded in the source documents.

---

## Key Features

- **Document Ingestion:** Load and process JSON, PDF, and text files.
- **Text Splitting:** RecursiveCharacterTextSplitter with configurable chunk size and overlap.
- **Embeddings:** Generate vector representations using OpenAI or open-source models.
- **Vector Store:** ChromaDB for efficient similarity search.
- **Retrieval:** Semantic search with context-aware responses.
- **DSR Logging:** Iterative design cycles documented for research transparency.

---

## Architecture



**Pipeline Components:**
1. **Data Ingestion:** Load JSON/PDF files.
2. **Chunking:** Split text into manageable chunks.
3. **Embedding:** Convert chunks to vectors.
4. **Vector Store:** Store and retrieve embeddings.
5. **Retrieval:** Semantic search over stored vectors.
6. **Generation:** Answer queries using an LLM.

---

##  Tech Stack

| Component | Technology |
|-----------|------------|
| Python | 3.12.13 |
| Package Manager | `uv` |
| Framework | LangChain |
| Vector Store | ChromaDB |
| Embeddings | OpenAI or sentence-transformers |
| LLM | OpenAI GPT or open-source model |
| Environment | `.venv` (virtual environment) |
| Research Log | Markdown files in `research_log/` |

---

## 📂 Project Structure
AI_RAG/
│
├── .venv/ # Virtual environment
├── data/
│ ├── raw/ # Raw Kaggle JSON/datasets
│ └── processed/ # Cleaned/transformed data
├── notebooks/
│ ├── 01_data_ingestion.ipynb # Load and explore data
│ ├── 02_text_splitting.ipynb # Chunking strategies
│ ├── 03_embeddings.ipynb # Embedding generation
│ └── 04_retrieval.ipynb # Query and retrieval
├── src/ # Reusable Python scripts (optional)
│ └── loaders.py
├── research_log/ # DSR iteration logs (EVIDENCE)
│ ├── cycle_1_data_ingestion.md
│ ├── cycle_2_chunking.md
│ └── ...
├── requirements.txt
├── pyproject.toml # uv project configuration
├── README.md # This file
└── .gitignore # Ignore .venv, .ipynb_checkpoints, etc.