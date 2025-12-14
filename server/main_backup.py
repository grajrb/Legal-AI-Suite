import os
import sqlite3
import uuid
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PyPDF2 import PdfReader
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Legal AI Workspace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "server/uploads")
DB_PATH = os.getenv("DB_PATH", "server/legal_ai.db")
USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"

# Supabase Configuration (for future use)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# OpenAI Configuration (for future use)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Database Type (sqlite or supabase)
DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite")

print(f"[CONFIG] Database Type: {DATABASE_TYPE}")
print(f"[CONFIG] Upload Directory: {UPLOAD_DIR}")
print(f"[CONFIG] Use Supabase: {USE_SUPABASE}")

os.makedirs(UPLOAD_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            text_content TEXT,
            uploaded_at TEXT NOT NULL,
            file_size INTEGER
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            question_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (document_id) REFERENCES documents(id)
        )
    ''')
    conn.commit()
    conn.close()

init_db()

class ChatRequest(BaseModel):
    document_id: str
    question: str
    session_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

def extract_text_from_pdf(filepath: str) -> str:
    try:
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        return f"Error extracting text: {str(e)}"

def generate_mock_summary(text: str) -> list:
    word_count = len(text.split())
    return [
        f"Document contains approximately {word_count} words",
        "This appears to be a legal document requiring professional review",
        "Key clauses have been identified for analysis",
        "Document structure follows standard legal formatting",
        "Recommended actions: Detailed clause-by-clause review"
    ]

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, safe_filename)
    
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    text_content = extract_text_from_pdf(filepath)
    summary = generate_mock_summary(text_content)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO documents (id, filename, filepath, text_content, uploaded_at, file_size)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (doc_id, file.filename, filepath, text_content, datetime.now().isoformat(), len(content)))
    
    session_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO chat_sessions (id, document_id, session_id, question_count, created_at)
        VALUES (?, ?, ?, 0, ?)
    ''', (str(uuid.uuid4()), doc_id, session_id, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
    return {
        "document_id": doc_id,
        "session_id": session_id,
        "filename": file.filename,
        "summary": summary,
        "message": "Document uploaded and processed successfully"
    }

@app.post("/api/chat")
async def chat(request: ChatRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT text_content, filename FROM documents WHERE id = ?', (request.document_id,))
    doc = cursor.fetchone()
    
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")
    
    text_content, filename = doc
    session_id = request.session_id or str(uuid.uuid4())
    
    cursor.execute('SELECT question_count FROM chat_sessions WHERE session_id = ?', (session_id,))
    session = cursor.fetchone()
    
    if session:
        question_count = session[0]
        if question_count >= 5:
            conn.close()
            raise HTTPException(
                status_code=429, 
                detail="You have reached the 5-question limit for the demo. Please sign up for unlimited access."
            )
        cursor.execute(
            'UPDATE chat_sessions SET question_count = question_count + 1 WHERE session_id = ?',
            (session_id,)
        )
        question_count += 1
    else:
        cursor.execute('''
            INSERT INTO chat_sessions (id, document_id, session_id, question_count, created_at)
            VALUES (?, ?, ?, 1, ?)
        ''', (str(uuid.uuid4()), request.document_id, session_id, datetime.now().isoformat()))
        question_count = 1
    
    conn.commit()
    conn.close()
    
    mock_response = f"""Based on my analysis of "{filename}", here's what I found regarding your question about "{request.question}":

This is a simulated AI response for demonstration purposes. In the full version, this would provide:
- Specific clause references from your document
- Legal interpretation based on Indian law
- Relevant case law citations
- Actionable recommendations

The document appears to contain relevant provisions that may address your query. For a comprehensive legal analysis, please consult with a qualified legal professional."""

    return {
        "answer": mock_response,
        "questions_remaining": 5 - question_count,
        "session_id": session_id
    }

@app.get("/api/stats")
def get_stats():
    return {
        "total_documents": 120,
        "total_users": 45,
        "active_matters": 28,
        "risky_clauses_detected": 15,
        "documents_reviewed_today": 8,
        "pending_reviews": 12,
        "ocr_failures": 3,
        "upload_queue": 5
    }

@app.post("/api/login")
async def login(request: LoginRequest):
    email = request.email.lower()
    
    if "admin" in email:
        role = "admin"
        dashboard = "/dashboard/admin"
    elif "lawyer" in email:
        role = "lawyer"
        dashboard = "/dashboard/lawyer"
    elif "para" in email:
        role = "paralegal"
        dashboard = "/dashboard/paralegal"
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials. Use email containing 'admin', 'lawyer', or 'para'")
    
    return {
        "success": True,
        "user": {
            "email": email,
            "role": role,
            "name": email.split("@")[0].title()
        },
        "redirect": dashboard
    }

@app.get("/api/matters")
def get_matters():
    return {
        "active_matters": [
            {"id": 1, "title": "Singh vs. Patel Property Dispute", "status": "In Progress", "deadline": "2024-01-15"},
            {"id": 2, "title": "ABC Corp Merger Agreement", "status": "Review", "deadline": "2024-01-20"},
            {"id": 3, "title": "Employment Contract - TechStart", "status": "Pending", "deadline": "2024-01-18"},
            {"id": 4, "title": "IP Licensing Agreement", "status": "In Progress", "deadline": "2024-01-25"},
        ],
        "recent_documents": [
            {"id": 1, "name": "Draft_Agreement_v2.pdf", "uploaded": "2024-01-10", "matter": "Singh vs. Patel"},
            {"id": 2, "name": "Merger_Terms.pdf", "uploaded": "2024-01-09", "matter": "ABC Corp Merger"},
            {"id": 3, "name": "Employment_Template.pdf", "uploaded": "2024-01-08", "matter": "TechStart"},
        ]
    }

@app.get("/api/paralegal-tasks")
def get_paralegal_tasks():
    return {
        "upload_queue": [
            {"id": 1, "filename": "Court_Filing_Jan2024.pdf", "status": "Pending OCR", "priority": "High"},
            {"id": 2, "filename": "Evidence_Bundle_A.pdf", "status": "Processing", "priority": "Medium"},
            {"id": 3, "filename": "Witness_Statements.pdf", "status": "Queued", "priority": "Low"},
        ],
        "ocr_failures": [
            {"id": 1, "filename": "Handwritten_Notes.pdf", "error": "Poor image quality", "date": "2024-01-09"},
            {"id": 2, "filename": "Scanned_Agreement.pdf", "error": "Corrupted file", "date": "2024-01-08"},
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
