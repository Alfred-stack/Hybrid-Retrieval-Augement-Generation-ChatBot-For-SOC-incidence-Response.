# DEPLOYMENT INSTRUCTIONS

## Files Changed/Fixed:

### 1. **app.py** (CRITICAL FIX)
   - ❌ OLD: `from langchain_classic.retrievers import EnsembleRetriever`
   - ✅ NEW: `from langchain.retrievers import EnsembleRetriever`
   - ✅ ADDED: CORS middleware for FastAPI
   - ✅ ADDED: Better error handling and logging
   - ✅ ADDED: Graceful fallback if BM25 files missing

### 2. **Backend/.env** (CRITICAL FIX)
   - ❌ OLD: `...mongodb.net/?appName=AL-RAG-Cluster?authSource=admin`
   - ✅ NEW: `...mongodb.net/?appName=AL-RAG-Cluster&authSource=admin`
   - Fixed: Double `?` in MongoDB URI (should be `?` then `&`)

### 3. **Created Startup Scripts**
   - `START_ALL.bat` - Starts all 3 services at once
   - `start_python_service.bat` - Python RAG only
   - `start_backend.bat` - Node.js backend only
   - `start_frontend.bat` - React frontend only

---

## How to Deploy Locally:

### Option 1: Start Everything at Once (RECOMMENDED)
1. Double-click `START_ALL.bat`
2. Wait for all 3 windows to open
3. Check each window for errors

### Option 2: Start Services Manually
Open 3 separate terminals:

**Terminal 1 - Python RAG Service:**
```bash
cd c:\Users\DELL\Downloads\AI_RAG_Project
python app.py
```

**Terminal 2 - Node.js Backend:**
```bash
cd c:\Users\DELL\Downloads\AI_RAG_Project\Backend
node server.js
```

**Terminal 3 - React Frontend:**
```bash
cd c:\Users\DELL\Downloads\AI_RAG_Project\frontend
npm run dev
```

---

## Verify Everything is Running:

1. **Python RAG Service**: http://localhost:8000/health
   - Should return: `{"status":"ok","service":"RAG Assistant",...}`

2. **Node Backend**: http://localhost:5002/api/health
   - Should return: `{"status":"ok","message":"Backend is running",...}`

3. **React Frontend**: http://localhost:5173 (or port shown in Vite output)
   - Should show the chat interface

---

## Testing the Full Flow:

1. Open the frontend in your browser
2. Type a question like: "How do I contain ransomware?"
3. Watch the terminal windows:
   - Frontend sends request to Backend (port 5002)
   - Backend forwards to Python RAG (port 8000)
   - Python RAG retrieves context and generates answer
   - Answer flows back through Backend to Frontend

---

## Troubleshooting:

### If Python service fails:
- Check Ollama is running: `ollama list`
- Check if model exists: `ollama pull llama3.2:1b`
- Check MongoDB connection string in Backend/.env

### If Backend fails:
- Check MongoDB URI is correct
- Verify RAG_SERVICE_URL=http://localhost:8000

### If Frontend fails:
- Check VITE_API_URL in frontend/.env
- Run `npm install` in frontend folder

---

## Summary of Changes:

| File | Change | Reason |
|------|--------|--------|
| `app.py` | Fixed import statement | `langchain_classic` doesn't exist |
| `app.py` | Added CORS middleware | Allow frontend to connect |
| `app.py` | Added error handling | Graceful fallback if BM25 missing |
| `Backend/.env` | Fixed MongoDB URI | Double `?` is invalid syntax |
| `START_ALL.bat` | Created | Easy one-click startup |

---

## Next Steps:

1. Replace the content of `app.py` with the fixed version provided
2. Replace the content of `Backend/.env` with the fixed version provided
3. Run `START_ALL.bat`
4. Test the chatbot!

