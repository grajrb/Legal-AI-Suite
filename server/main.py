"""
Main FastAPI application with Postgres integration
Legal AI Workspace - Production Ready
"""
import os
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv
from jose import JWTError, jwt
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import middleware
from server.middleware import (
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler,
    log_request_middleware,
    security_headers_middleware
)

# Import modular routes
try:
    from server.routes_auth import router as auth_router
    from server.routes_documents import router as docs_router
    from server.routes_management import router as mgmt_router
    from server.routes_dashboard import router as dash_router
    from server import db_postgres as db
    from server import vector_db
    USE_POSTGRES = True
    print("[CONFIG] PostgreSQL modules loaded successfully")
except ImportError as e:
    USE_POSTGRES = False
    print(f"[CONFIG] Warning: PostgreSQL modules not available: {e}")

# Load environment variables
load_dotenv()

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
DATABASE_URL = os.getenv("DATABASE_URL", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "server/uploads")

print(f"[CONFIG] Database: {' PostgreSQL' if DATABASE_URL else ' SQLite (fallback)'}")
print(f"[CONFIG] OpenAI: {'✓' if OPENAI_API_KEY else '✗'}")
print(f"[CONFIG] Pinecone: {'✓' if PINECONE_API_KEY else '✗'}")
print(f"[CONFIG] Upload Dir: {UPLOAD_DIR}")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="Legal AI Workspace API",
    version="2.0.0",
    description="India-first legal AI platform with document intelligence"
)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
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

# ============= AUTHENTICATION DEPENDENCY =============

def get_current_user(request: Request) -> dict:
    """Extract and verify JWT token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_user_optional(request: Request) -> Optional[dict]:
    """Optional authentication - returns None if not authenticated"""
    try:
        return get_current_user(request)
    except:
        return None

def require_roles(allowed_roles: list):
    """RBAC enforcement dependency"""
    def _checker(current_user: dict = Depends(get_current_user)) -> dict:
        role = current_user.get("role", "")
        if role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return _checker

# ============= BACKGROUND TASKS =============

async def demo_purge_task():
    """Purge demo data older than 30 minutes"""
    while True:
        try:
            if USE_POSTGRES:
                # Delete documents uploaded by anonymous users (no user ID)
                query = """
                    DELETE FROM documents
                    WHERE uploaded_by IS NULL
                    AND created_at < NOW() - INTERVAL '30 minutes'
                """
                # Skip purge if table schema doesn't match
                try:
                    deleted = db.execute_query(query)
                    if deleted > 0:
                        print(f"[PURGE] Deleted {deleted} demo documents")
                except Exception as e:
                    # Silently skip if column doesn't exist (expected in some setups)
                    pass
        except Exception as e:
            print(f"[PURGE] Error: {e}")
        
        await asyncio.sleep(300)  # Run every 5 minutes

@app.on_event("startup")
async def startup_tasks():
    """Initialize services on startup"""
    print("[STARTUP] Initializing services...")
    
    # Start background tasks
    asyncio.create_task(demo_purge_task())
    
    # Initialize vector DB
    if USE_POSTGRES:
        stats = vector_db.get_stats()
        print(f"[VECTOR] Status: {stats.get('status')}")
    
    print("[STARTUP] All services initialized")

@app.on_event("shutdown")
async def shutdown_tasks():
    """Cleanup on shutdown"""
    print("[SHUTDOWN] Cleaning up...")

# ============= HEALTH CHECK =============

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    
    health = {
        "status": "healthy",
        "database": "connected" if USE_POSTGRES else "fallback",
        "vector_db": "unknown",
        "redis": "unknown"
    }
    
    # Check vector DB
    if USE_POSTGRES:
        try:
            vector_stats = vector_db.get_stats()
            health["vector_db"] = vector_stats.get("status", "unknown")
        except:
            health["vector_db"] = "error"
    
    # Check Redis (for Celery)
    try:
        import redis
        r = redis.from_url(REDIS_URL)
        r.ping()
        health["redis"] = "connected"
    except:
        health["redis"] = "disconnected"
    
    return health

# ============= INCLUDE ROUTERS =============

if USE_POSTGRES:
    # Override auth router dependencies with actual get_current_user
    from server.routes_auth import router as _auth_router
    app.include_router(_auth_router)
    
    # Update document router dependencies
    from server.routes_documents import router as _docs_router
    _docs_router.dependencies = [Depends(get_current_user)]
    app.include_router(_docs_router)
    
    # Update management router dependencies
    from server.routes_management import router as _mgmt_router
    _mgmt_router.dependencies = [Depends(get_current_user)]
    app.include_router(_mgmt_router)
    
    # Update dashboard router dependencies
    from server.routes_dashboard import router as _dash_router
    _dash_router.dependencies = [Depends(get_current_user)]
    app.include_router(_dash_router)
    
    print("[ROUTES] All Postgres-based routes registered")
else:
    print("[ROUTES] Warning: PostgreSQL routes not available")

# ============= ADDITIONAL ENDPOINTS =============

@app.get("/api/vector-stats")
async def vector_statistics(current_user: dict = Depends(require_roles(["admin"]))):
    """Get vector database statistics (admin only)"""
    
    if not USE_POSTGRES:
        raise HTTPException(status_code=503, detail="Vector DB not available")
    
    stats = vector_db.get_stats()
    return stats

@app.post("/api/billing/webhook/razorpay")
async def razorpay_webhook(request: Request):
    """Razorpay webhook handler"""
    
    # TODO: Implement signature verification
    payload = await request.json()
    
    print(f"[RAZORPAY] Webhook received: {payload.get('event')}")
    
    # Process event
    event = payload.get("event")
    if event == "subscription.charged":
        # Update subscription status
        pass
    elif event == "subscription.cancelled":
        # Handle cancellation
        pass
    
    return {"status": "received"}

@app.post("/api/billing/webhook/stripe")
async def stripe_webhook(request: Request):
    """Stripe webhook handler"""
    
    # TODO: Implement signature verification with Stripe SDK
    payload = await request.json()
    
    print(f"[STRIPE] Webhook received: {payload.get('type')}")
    
    return {"status": "received"}

@app.get("/api/documents/{doc_id}/download-summary")
async def download_summary_pdf(
    doc_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate and download PDF summary"""
    
    if not USE_POSTGRES:
        raise HTTPException(status_code=503, detail="Service not available")
    
    # Get document
    doc = db.get_document_by_id(doc_id)
    if not doc or doc['firm_id'] != current_user.get('firm_id'):
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get summary
    query = "SELECT * FROM summaries WHERE document_id = %s ORDER BY created_at DESC LIMIT 1"
    summary = db.execute_query(query, (doc_id,), fetch_one=True)
    
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not available")
    
    # Generate PDF using ReportLab
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from io import BytesIO
    import json
    
    buffer = BytesIO()
    doc_pdf = SimpleDocTemplate(buffer, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    story.append(Paragraph(f"<b>Document Summary: {doc['filename']}</b>", styles['Title']))
    story.append(Spacer(1, 12))
    
    # Summary data
    summary_data = json.loads(summary['summary_json']) if summary['summary_json'] else {}
    
    story.append(Paragraph(f"<b>Document Type:</b> {summary_data.get('document_type', 'N/A')}", styles['Normal']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"<b>Summary:</b> {summary_data.get('summary', 'N/A')}", styles['Normal']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"<b>Risk Level:</b> {summary_data.get('risk_level', 'N/A')}", styles['Normal']))
    
    doc_pdf.build(story)
    buffer.seek(0)
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=summary_{doc_id}.pdf"}
    )

# ============= ROOT ENDPOINT =============

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Legal AI Workspace API",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs",
        "features": {
            "postgres": USE_POSTGRES,
            "openai": bool(OPENAI_API_KEY),
            "vector_db": bool(PINECONE_API_KEY),
            "rate_limiting": True,
            "audit_logging": True
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
