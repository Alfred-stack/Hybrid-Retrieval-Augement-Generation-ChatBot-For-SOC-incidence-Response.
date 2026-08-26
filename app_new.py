import os
import pickle
from typing import List, Dict, Any

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from langchain_groq import ChatGroq

from rank_bm25 import BM25Okapi
from langchain_classic.retrievers import EnsembleRetriever

from langchain_core.runnables import RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder
)
from langchain_core.runnables.history import RunnableWithMessageHistory


# CONFIGURATION – Paths relative to this file


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

FAISS_INDEX_PATH = os.path.join(DATA_DIR, "faiss_index", "playbooks")
LOG_TEXTS_PATH = os.path.join(
    DATA_DIR,
    "processed",
    "embeddings_and_tokenized_logs",
    "log_texts.pkl"
)
TOKENIZED_LOGS_PATH = os.path.join(
    DATA_DIR,
    "processed",
    "embeddings_and_tokenized_logs",
    "tokenized_logs.pkl"
)



# ENVIRONMENT VARIABLES 
MONGO_URI = os.getenv("MONGODB_URI")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not MONGO_URI:
    raise RuntimeError("MONGODB_URI is not set. Add it to your Render Environment Variables.")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set. Add it to your Render Environment Variables.")

DB_NAME = "rag_chatbot"
COLLECTION_NAME = "chat_history"

print("Starting API RAG Service (No Cross-Encoder) with Source Verification")
print("=" * 60)



# EMBEDDING MODEL
print("Loading embedding model...")
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
print("Embedding model loaded.")



# FAISS VECTOR STORE
print("Loading FAISS vector store...")
if not os.path.exists(FAISS_INDEX_PATH):
    raise RuntimeError(f"FAISS index directory not found: {FAISS_INDEX_PATH}")

vector_store = FAISS.load_local(
    FAISS_INDEX_PATH,
    embedding_model,
    allow_dangerous_deserialization=True
)

# Fetch 20 documents for better recall (no reranker)
dense_retriever = vector_store.as_retriever(search_kwargs={"k": 20})
print("FAISS retriever ready.")



# BM25 LOG RETRIEVER
print("Loading BM25 data...")
log_texts = []
tokenized_logs = []

if (not os.path.exists(LOG_TEXTS_PATH) or not os.path.exists(TOKENIZED_LOGS_PATH)):
    print("WARNING: BM25 pickle files not found.")
else:
    with open(LOG_TEXTS_PATH, "rb") as f:
        log_texts = pickle.load(f)
    with open(TOKENIZED_LOGS_PATH, "rb") as f:
        tokenized_logs = pickle.load(f)
    print(f"Loaded {len(log_texts)} log texts.")

if tokenized_logs:
    bm25_index = BM25Okapi(tokenized_logs)
    print("BM25 index created successfully.")
else:
    bm25_index = None
    print("WARNING: BM25 index unavailable.")



# BM25 RETRIEVER CLASS
class BM25Retriever(BaseRetriever):
    bm25: object
    log_texts: List[str]
    top_k: int = 20  # Increased from 10

    def _get_relevant_documents(self, query: str, **kwargs) -> List[Document]:
        if self.bm25 is None or not self.log_texts:
            return []

        scores = self.bm25.get_scores(query.lower().split())
        top_indices = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True
        )[:self.top_k]

        documents = []
        for idx in top_indices:
            doc = Document(
                page_content=self.log_texts[idx],
                metadata={
                    "source": "bm25_log",
                    "log_index": idx,
                    "bm25_score": float(scores[idx])
                }
            )
            documents.append(doc)
        return documents



# HYBRID RETRIEVER 
if bm25_index is not None:
    bm25_retriever = BM25Retriever(
        bm25=bm25_index,
        log_texts=log_texts,
        top_k=20
    )
    ensemble_retriever = EnsembleRetriever(
        retrievers=[dense_retriever, bm25_retriever],
        weights=[0.6, 0.4]
    )
    print("Hybrid retriever created: FAISS + BM25")
else:
    ensemble_retriever = dense_retriever
    print("Using FAISS retriever only.")

# Use the ensemble directly (no reranker)
hybrid_retriever = ensemble_retriever
print("Hybrid retriever ready (FAISS + BM25, no reranker).")



# GROQ LLM
print("Initializing remote Groq LLM...")
llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model="qwen/qwen3.6-27b",
    temperature=0.7,
    max_tokens=400,
    reasoning_effort="none"
)
print("Groq LLM ready.")



# PROMPT TEMPLATE (Forces Source Citation)
PROMPT_TEMPLATE = """
You are a Senior SOC Analyst Assistant.

Your role is to provide clear, professional, and actionable
guidance to incident responders based strictly on the
provided playbook and log context.

Your response should:

1. Acknowledge the user's incident or question.
2. Provide the core answer.
3. Give actionable details.
4. Include relevant best-practice guidance from the context.
5. Cite the available source information.

**CRITICAL RULES:**

- Use ONLY the provided context.
- Do not invent information.
- Do not rely on outside knowledge.
- If the context does not contain the answer, state:

"I don't have information about that in the provided
playbooks. Please check other sources or escalate to
the lead analyst."

- **ALWAYS END YOUR RESPONSE WITH A "Source:" SECTION**
  that includes the incident ID, playbook type, or source name.

Keep the response professional, direct, and actionable.

Context:

{context}
"""

conversational_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", PROMPT_TEMPLATE),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{question}")
    ]
)



# CONTEXT RETRIEVAL & FORMATTING WITH SOURCE EXTRACTION
def extract_sources(docs: List[Document]) -> List[Dict[str, Any]]:
    """Extract source metadata from retrieved documents."""
    sources = []
    for doc in docs[:5]:  # Only top 5 for response
        metadata = doc.metadata
        source_info = {
            "source": metadata.get("source", "Unknown"),
            "incident_id": metadata.get("incident_id"),
            "playbook_type": metadata.get("playbook_type"),
            "log_index": metadata.get("log_index"),
            "source_type": "playbook" if "playbook" in metadata.get("source", "").lower() else "log"
        }
        # Remove None values
        source_info = {k: v for k, v in source_info.items() if v is not None}
        sources.append(source_info)
    return sources


def format_context(docs: List[Document]) -> str:
    """Format documents into a single context string for the LLM."""
    if not docs:
        return "No relevant documents found."

    # Take top 5 only
    docs = docs[:5]

    parts = []
    for doc in docs:
        src = doc.metadata.get("source", "Playbook")
        content = doc.page_content[:800]  # Trim for prompt size
        parts.append(f"[Source: {src}]\n{content}")

    return "\n\n---\n\n".join(parts)


def retrieve_and_format(question: str):
    """Retrieve documents, return context string and sources."""
    docs = hybrid_retriever.invoke(question)
    print(f"[RETRIEVAL] Retrieved {len(docs)} documents.")
    sources = extract_sources(docs)
    context = format_context(docs)
    return context, sources


def get_context(input_dict):
    """Runnable-compatible function that returns only the context string."""
    context, _ = retrieve_and_format(input_dict["question"])
    return context



# RAG CHAIN
multiturn_chain = (
    {
        "context": RunnableLambda(get_context),
        "question": RunnableLambda(lambda x: x["question"]),
        "chat_history": RunnableLambda(lambda x: x.get("chat_history", []))
    }
    | conversational_prompt
    | llm
    | StrOutputParser()
)



# MONGODB CONVERSATION HISTORY
def get_session_history(session_id: str):
    return MongoDBChatMessageHistory(
        session_id=session_id,
        connection_string=MONGO_URI,
        database_name=DB_NAME,
        collection_name=COLLECTION_NAME
    )


conversational_chain = RunnableWithMessageHistory(
    multiturn_chain,
    get_session_history,
    input_messages_key="question",
    history_messages_key="chat_history"
)

print("Conversational chain ready.")



# FASTAPI APP
app = FastAPI(
    title="SOC IR RAG Assistant",
    version="2.0 (No Cross-Encoder) with Source Verification"
)



# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict to the frontend URL later
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)



# REQUEST / RESPONSE MODELS
class ChatRequest(BaseModel):
    question: str
    session_id: str = "default"


class ChatResponse(BaseModel):
    answer: str
    session_id: str
    sources: List[Dict[str, Any]]  # Source verification


# CHAT ENDPOINT (With Source Extraction)
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        print(f"\n[CHAT] Question: {request.question[:100]}...")
        print(f"[CHAT] Session: {request.session_id}")

        # Retrieve documents and extract sources
        context, sources = retrieve_and_format(request.question)

        # Invoke the conversational chain
        answer = conversational_chain.invoke(
            {"question": request.question},
            config={"configurable": {"session_id": request.session_id}}
        )

        # Return answer with sources
        return {
            "answer": answer,
            "session_id": request.session_id,
            "sources": sources
        }

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Unable to process request."
        )



# HEALTH CHECK
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "RAG Assistant",
        "model": "qwen/qwen3.6-27b",
        "retrieval": (
            "FAISS + BM25 (no reranker)"
            if bm25_index is not None
            else "FAISS only"
        ),
        "conversation_history": "MongoDB Atlas",
        "faiss_loaded": True,
        "bm25_loaded": bm25_index is not None
    }



# LOCAL DEVELOPMENT STARTUP
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    print(f"Starting RAG service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)