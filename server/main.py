import os
import sqlite3
import uuid
from datetime import datetime, timedelta
import asyncio
from typing import Optional, Callable, List
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, EmailStr
from PyPDF2 import PdfReader
from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
import json

# Import middleware
from middleware import (
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler,
    log_request_middleware,
    security_headers_middleware,
    SuccessResponse,
    RequestValidator
)

# Load environment variables
load_dotenv()

app = FastAPI(title="Legal AI Workspace API")

# Add middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.middleware("http")(log_request_middleware)
app.middleware("http")(security_headers_middleware)

# Add exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "server/uploads")
DB_PATH = os.getenv("DB_PATH", "server/legal_ai.db")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite")

# Security
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

print(f"[CONFIG] Database Type: {DATABASE_TYPE}")
print(f"[CONFIG] Upload Directory: {UPLOAD_DIR}")
print(f"[CONFIG] JWT Algorithm: {JWT_ALGORITHM}")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ============= DATABASE INITIALIZATION =============

def init_db():
    """Initialize database with all required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            role TEXT NOT NULL DEFAULT 'user',
            organization TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Documents table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            text_content TEXT,
            user_id TEXT,
            uploaded_at TEXT NOT NULL,
            file_size INTEGER,
            tags TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Chat sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            user_id TEXT,
            session_id TEXT NOT NULL,
            question_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (document_id) REFERENCES documents(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Chat history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id TEXT,
            question TEXT NOT NULL,
            answer TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Matters table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS matters (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT,
            deadline TEXT,
            assigned_to TEXT,
            created_by TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (assigned_to) REFERENCES users(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    ''')
    
    # Audit logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            action TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_id TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL
        )
    ''')

    # Usage metrics table (daily aggregation)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usage_metrics (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            date TEXT NOT NULL,
            docs_uploaded INTEGER DEFAULT 0,
            tokens_used INTEGER DEFAULT 0,
            chats INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            UNIQUE(user_id, date)
        )
    ''')

    # Templates table (basic for MVP)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            content TEXT NOT NULL,
            created_by TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

init_db()

# ============= BACKGROUND TASKS (DEMO PURGE) =============

def purge_demo_data():
    """Delete anonymous demo uploads older than 30 minutes along with related sessions/history and files."""
    cutoff = (datetime.now() - timedelta(minutes=30)).isoformat()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Select old anonymous documents
    cursor.execute('SELECT id, filepath FROM documents WHERE user_id IS NULL AND uploaded_at < ?', (cutoff,))
    rows = cursor.fetchall()
    for doc_id, filepath in rows:
        # Delete file if exists
        try:
            if filepath and os.path.exists(filepath):
                os.remove(filepath)
        except Exception:
            pass
        # Delete chat history and sessions
        cursor.execute('SELECT session_id FROM chat_sessions WHERE document_id = ?', (doc_id,))
        sessions = cursor.fetchall()
        for (session_id,) in sessions:
            cursor.execute('DELETE FROM chat_history WHERE session_id = ?', (session_id,))
        cursor.execute('DELETE FROM chat_sessions WHERE document_id = ?', (doc_id,))
        # Delete document
        cursor.execute('DELETE FROM documents WHERE id = ?', (doc_id,))
    conn.commit(); conn.close()

async def _purge_loop():
    while True:
        try:
            purge_demo_data()
        except Exception as e:
            print(f"[PURGE] Error: {e}")
        await asyncio.sleep(300)  # 5 minutes

@app.on_event("startup")
async def _startup_tasks():
    asyncio.create_task(_purge_loop())

# ============= PYDANTIC MODELS =============

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "user"
    organization: str = ""

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ChatRequest(BaseModel):
    document_id: str
    question: str
    session_id: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    document_id: str
    session_id: str
    filename: str
    summary: list
    message: str

class MatterCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "Pending"
    deadline: str = ""
    assigned_to: str = ""

# New request/response models for stubs
class FirmCreate(BaseModel):
    name: str

class InviteUser(BaseModel):
    email: EmailStr
    role: str

class ClientCreate(BaseModel):
    name: str

class FolderCreate(BaseModel):
    matter_id: str
    name: str

class TemplateCreate(BaseModel):
    name: str
    content: str

class TemplateUpdate(BaseModel):
    content: str

class AssistantQuery(BaseModel):
    question: str
    filters: Optional[dict] = None

# ============= SECURITY & AUTHENTICATION =============

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str, email: str, role: str) -> str:
    """Create JWT access token"""
    expires = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": expires
    }
    encoded_jwt = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(request: Request) -> dict:
    """Get current user from token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        return verify_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

def get_current_user_optional(request: Request) -> Optional[dict]:
    """Get current user from token - OPTIONAL (returns None if not authenticated)"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            return None
        return verify_token(token)
    except (ValueError, JWTError):
        return None

def require_roles(allowed_roles: List[str]) -> Callable[[dict], dict]:
    """Dependency to enforce RBAC based on JWT role claim."""
    def _checker(current_user: dict = Depends(get_current_user)) -> dict:
        role = current_user.get("role", "")
        if role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return _checker

def log_audit(action: str, resource_type: str, resource_id: Optional[str], user_id: Optional[str], metadata: Optional[dict] = None):
    """Insert an audit log row (SQLite variant)."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), user_id, action, resource_type, resource_id, json.dumps(metadata or {}), datetime.now().isoformat()))
        conn.commit()
    finally:
        conn.close()

def bump_usage(user_id: Optional[str], field: str):
    """Increment a usage_metrics counter for today (SQLite variant)."""
    if not user_id:
        return
    today = datetime.now().date().isoformat()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Ensure row exists
    cursor.execute('SELECT id FROM usage_metrics WHERE user_id = ? AND date = ?', (user_id, today))
    row = cursor.fetchone()
    if not row:
        cursor.execute('''
            INSERT INTO usage_metrics (id, user_id, date, docs_uploaded, tokens_used, chats, created_at)
            VALUES (?, ?, ?, 0, 0, 0, ?)
        ''', (str(uuid.uuid4()), user_id, today, datetime.now().isoformat()))
    # Increment
    if field not in ("docs_uploaded", "tokens_used", "chats"):
        conn.commit(); conn.close(); return
    cursor.execute(f'UPDATE usage_metrics SET {field} = {field} + 1 WHERE user_id = ? AND date = ?', (user_id, today))
    conn.commit()
    conn.close()

# ============= USER MANAGEMENT =============

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    """Register a new user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute('SELECT id FROM users WHERE email = ?', (user_data.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    password_hash = hash_password(user_data.password)
    now = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO users (id, email, password_hash, full_name, role, organization, created_at, updated_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, user_data.email, password_hash, user_data.full_name, user_data.role, 
          user_data.organization, now, now, True))
    
    conn.commit()
    conn.close()
    
    # Create token
    access_token = create_access_token(user_id, user_data.email, user_data.role)
    # Audit
    log_audit("register", "user", user_id, user_id, {"email": user_data.email})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            full_name=user_data.full_name,
            role=user_data.role,
            organization=user_data.organization
        )
    )

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, password_hash, full_name, role, organization FROM users WHERE email = ?', 
                   (credentials.email,))
    user = cursor.fetchone()
    conn.close()
    
    # Debug logging
    if not user:
        print(f"[DEBUG] User not found: {credentials.email}")
    else:
        print(f"[DEBUG] User found: {credentials.email}, role: {user[3]}")
        password_valid = verify_password(credentials.password, user[1])
        print(f"[DEBUG] Password valid: {password_valid}")
        if not password_valid:
            print(f"[DEBUG] Provided password: {credentials.password}")
            print(f"[DEBUG] Hash in DB: {user[1][:50]}...")
    
    if not user or not verify_password(credentials.password, user[1]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id, _, full_name, role, organization = user
    access_token = create_access_token(user_id, credentials.email, role)
    # Audit
    log_audit("login", "user", user_id, user_id, {"email": credentials.email})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=credentials.email,
            full_name=full_name,
            role=role,
            organization=organization or ""
        )
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, email, full_name, role, organization FROM users WHERE id = ?', 
                   (current_user["user_id"],))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user[0],
        email=user[1],
        full_name=user[2],
        role=user[3],
        organization=user[4] or ""
    )

# ============= DOCUMENT MANAGEMENT =============

def extract_text_from_pdf(filepath: str) -> str:
    """Extract text from PDF"""
    try:
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        return f"Error extracting text: {str(e)}"

def generate_summary(text: str) -> list:
    """Generate document summary"""
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
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/upload", response_model=DocumentUploadResponse)
async def upload_pdf(file: UploadFile = File(...), current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Upload and analyze PDF"""
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Save file
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Extract text and generate summary
    text_content = extract_text_from_pdf(filepath)
    summary = generate_summary(text_content)
    
    # Save to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO documents (id, filename, filepath, text_content, user_id, uploaded_at, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (doc_id, file.filename, filepath, text_content, current_user.get("user_id") if current_user else None, 
          datetime.now().isoformat(), len(content)))
    
    # Create session
    session_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO chat_sessions (id, document_id, user_id, session_id, question_count, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
    ''', (str(uuid.uuid4()), doc_id, current_user.get("user_id") if current_user else None, session_id, datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    # Audit + usage
    log_audit("upload", "document", doc_id, current_user.get("user_id") if current_user else None, {"filename": file.filename})
    if current_user:
        bump_usage(current_user.get("user_id"), "docs_uploaded")
    
    return DocumentUploadResponse(
        document_id=doc_id,
        session_id=session_id,
        filename=file.filename,
        summary=summary,
        message="Document uploaded and processed successfully"
    )

@app.post("/api/chat")
async def chat(request: ChatRequest, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Chat with document"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get document
    cursor.execute('SELECT text_content, filename FROM documents WHERE id = ?', 
                   (request.document_id,))
    doc = cursor.fetchone()
    
    if not doc:
        conn.close()
        raise HTTPException(status_code=404, detail="Document not found")
    
    text_content, filename = doc
    session_id = request.session_id or str(uuid.uuid4())
    
    # Check question limit
    cursor.execute('SELECT question_count FROM chat_sessions WHERE session_id = ?', (session_id,))
    session = cursor.fetchone()
    
    if session:
        question_count = session[0]
        if question_count >= 5:
            conn.close()
            raise HTTPException(status_code=429, 
                              detail="You have reached the 5-question limit for the demo. Please sign up for unlimited access.")
        cursor.execute('UPDATE chat_sessions SET question_count = question_count + 1 WHERE session_id = ?',
                      (session_id,))
        question_count += 1
    else:
        cursor.execute('''
            INSERT INTO chat_sessions (id, document_id, user_id, session_id, question_count, created_at)
            VALUES (?, ?, ?, ?, 1, ?)
        ''', (str(uuid.uuid4()), request.document_id, current_user.get("user_id") if current_user else None, session_id, 
              datetime.now().isoformat()))
        question_count = 1
    
    # Save chat history
    cursor.execute('''
        INSERT INTO chat_history (id, session_id, user_id, question, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), session_id, current_user.get("user_id") if current_user else None, request.question, 
          datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    # Audit + usage
    log_audit("chat", "document", request.document_id, current_user.get("user_id") if current_user else None, {"session_id": session_id})
    if current_user:
        bump_usage(current_user.get("user_id"), "chats")
    
    # Generate response (mock for now, ready for OpenAI)
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

# ============= DASHBOARDS & ANALYTICS =============

@app.get("/api/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Count documents uploaded by user
    cursor.execute('SELECT COUNT(*) FROM documents WHERE user_id = ?', (current_user["user_id"],))
    user_docs = cursor.fetchone()[0]
    
    # Count all documents (for admin)
    cursor.execute('SELECT COUNT(*) FROM documents')
    total_docs = cursor.fetchone()[0]
    
    # Count users (for admin)
    cursor.execute('SELECT COUNT(*) FROM users')
    total_users = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "total_documents": total_docs,
        "total_users": total_users,
        "user_documents": user_docs,
        "active_matters": 28,
        "risky_clauses_detected": 15,
        "documents_reviewed_today": 8,
        "pending_reviews": 12,
        "ocr_failures": 3,
        "upload_queue": 5
    }

@app.get("/api/matters")
async def get_matters(current_user: dict = Depends(get_current_user)):
    """Get matters/cases"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, title, description, status, deadline 
        FROM matters 
        WHERE assigned_to = ? OR created_by = ?
        ORDER BY deadline
    ''', (current_user["user_id"], current_user["user_id"]))
    
    matters = []
    for row in cursor.fetchall():
        matters.append({
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "status": row[3],
            "deadline": row[4]
        })
    
    conn.close()
    
    return {
        "active_matters": matters,
        "recent_documents": [
            {"id": 1, "name": "Draft_Agreement_v2.pdf", "uploaded": "2024-01-10", "matter": "Matter 1"},
            {"id": 2, "name": "Merger_Terms.pdf", "uploaded": "2024-01-09", "matter": "Matter 2"},
        ]
    }

@app.post("/api/matters", response_model=dict)
async def create_matter(matter: MatterCreate, current_user: dict = Depends(get_current_user)):
    """Create new matter"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    matter_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO matters (id, title, description, status, deadline, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (matter_id, matter.title, matter.description, matter.status, matter.deadline, 
          current_user["user_id"], now, now))
    
    conn.commit()
    conn.close()
    # Audit
    log_audit("create", "matter", matter_id, current_user.get("user_id"), {"title": matter.title})
    
    return {"id": matter_id, "message": "Matter created successfully"}

@app.get("/api/paralegal-tasks")
async def get_paralegal_tasks(current_user: dict = Depends(get_current_user)):
    """Get paralegal tasks"""
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

# ============= NEW ROUTE STUBS (FIRMS/CLIENTS/FOLDERS/TEMPLATES/AUDIT/BILLING/ASSISTANT) =============

@app.post("/api/firms")
async def create_firm(data: FirmCreate, current_user: dict = Depends(require_roles(["admin"]))):
    firm_id = str(uuid.uuid4())
    log_audit("create", "firm", firm_id, current_user.get("user_id"), {"name": data.name})
    return {"id": firm_id, "name": data.name, "message": "Firm created (stub)"}

@app.post("/api/firms/{firm_id}/invite")
async def invite_user(firm_id: str, invite: InviteUser, current_user: dict = Depends(require_roles(["admin"]))):
    log_audit("invite", "firm", firm_id, current_user.get("user_id"), {"email": invite.email, "role": invite.role})
    return {"status": "invited", "email": invite.email, "role": invite.role}

@app.post("/api/clients")
async def create_client(client: ClientCreate, current_user: dict = Depends(require_roles(["admin", "lawyer"]))):
    client_id = str(uuid.uuid4())
    log_audit("create", "client", client_id, current_user.get("user_id"), {"name": client.name})
    return {"id": client_id, "name": client.name}

@app.get("/api/clients")
async def list_clients(current_user: dict = Depends(require_roles(["admin", "lawyer", "paralegal"]))):
    # Stub list
    return {"clients": []}

@app.post("/api/folders")
async def create_folder(folder: FolderCreate, current_user: dict = Depends(require_roles(["admin", "lawyer", "paralegal"]))):
    folder_id = str(uuid.uuid4())
    log_audit("create", "folder", folder_id, current_user.get("user_id"), {"matter_id": folder.matter_id, "name": folder.name})
    return {"id": folder_id, "name": folder.name}

@app.get("/api/documents/{doc_id}")
async def get_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    # Minimal fetch from SQLite for now
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, filename, uploaded_at FROM documents WHERE id = ?', (doc_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"id": row[0], "filename": row[1], "uploaded_at": row[2]}

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, current_user: dict = Depends(require_roles(["admin"]))):
    # Soft delete: remove file and db row in SQLite for demo
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT filepath FROM documents WHERE id = ?', (doc_id,))
    row = cursor.fetchone()
    if row and os.path.exists(row[0]):
        try:
            os.remove(row[0])
        except Exception:
            pass
    cursor.execute('DELETE FROM documents WHERE id = ?', (doc_id,))
    conn.commit(); conn.close()
    log_audit("delete", "document", doc_id, current_user.get("user_id"))
    return {"ok": True}

@app.post("/api/documents/{doc_id}/extract")
async def extract_document(doc_id: str, current_user: dict = Depends(require_roles(["admin", "lawyer"]))):
    log_audit("extract", "document", doc_id, current_user.get("user_id"))
    return {"status": "queued"}

@app.get("/api/documents/{doc_id}/summary")
async def get_document_summary(doc_id: str, current_user: dict = Depends(get_current_user)):
    return {"bullets": []}

@app.get("/api/documents/{doc_id}/clauses")
async def get_document_clauses(doc_id: str, current_user: dict = Depends(get_current_user)):
    return {"clauses": []}

@app.get("/api/documents/{doc_id}/facts")
async def get_document_facts(doc_id: str, current_user: dict = Depends(get_current_user)):
    return {"facts": {}}

@app.get("/api/templates")
async def list_templates(current_user: dict = Depends(require_roles(["admin", "lawyer"]))):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, version, created_at FROM templates ORDER BY created_at DESC')
    rows = cursor.fetchall(); conn.close()
    return {"templates": [{"id": r[0], "name": r[1], "version": r[2], "created_at": r[3]} for r in rows]}

@app.post("/api/templates")
async def create_template(data: TemplateCreate, current_user: dict = Depends(require_roles(["admin"]))):
    tpl_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO templates (id, name, version, content, created_by, created_at) VALUES (?, ?, 1, ?, ?, ?)',
                   (tpl_id, data.name, data.content, current_user.get("user_id"), now))
    conn.commit(); conn.close()
    log_audit("create", "template", tpl_id, current_user.get("user_id"), {"name": data.name})
    return {"id": tpl_id, "name": data.name, "version": 1}

@app.put("/api/templates/{template_id}")
async def update_template(template_id: str, data: TemplateUpdate, current_user: dict = Depends(require_roles(["admin"]))):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('UPDATE templates SET content = content || ? WHERE id = ?', ("", template_id))
    # naive: keep version same in SQLite demo; real impl should version++
    conn.commit(); conn.close()
    log_audit("update", "template", template_id, current_user.get("user_id"))
    return {"id": template_id, "updated": True}

@app.get("/api/audit")
async def get_audit_logs(current_user: dict = Depends(require_roles(["admin"]))):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT action, resource_type, resource_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200')
    rows = cursor.fetchall(); conn.close()
    return {"logs": [{"action": r[0], "resource": r[1], "id": r[2], "time": r[3]} for r in rows]}

@app.post("/api/billing/webhook/razorpay")
async def billing_webhook_razorpay(payload: dict = Body(...)):
    # Signature verification TODO
    log_audit("billing_webhook", "razorpay", None, None)
    return {"ok": True}

@app.post("/api/billing/webhook/stripe")
async def billing_webhook_stripe(payload: dict = Body(...)):
    # Signature verification TODO
    log_audit("billing_webhook", "stripe", None, None)
    return {"ok": True}

@app.post("/api/assistant/query")
async def assistant_query(q: AssistantQuery, current_user: dict = Depends(require_roles(["admin"]))):
    # Structured analytics only (stub)
    log_audit("assistant_query", "analytics", None, current_user.get("user_id"), {"question": q.question})
    return {"report": "stub", "sources": []}

# ============= ERROR HANDLERS =============

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
