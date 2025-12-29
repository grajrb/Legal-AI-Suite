"""
Document management endpoints with AI processing
"""
from typing import Optional, List
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel
import os
import shutil
from pathlib import Path

try:
    from server import db_postgres as db
    from server import ai_service
    from server.tasks import process_document_task
    USE_POSTGRES = True
except:
    USE_POSTGRES = False

router = APIRouter(prefix="/api/documents", tags=["documents"])
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "server/uploads")

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    status: str
    message: str

class ChatRequest(BaseModel):
    document_id: str
    question: str
    session_id: Optional[str] = None

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    matter_id: Optional[str] = None,
    folder_id: Optional[str] = None,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """Upload and process document"""
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Save file
    file_path = Path(UPLOAD_DIR) / f"{db.generate_uuid()}_{file.filename}"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = file_path.stat().st_size
    
    # Create document record
    doc_id = db.create_document(
        firm_id=current_user['firm_id'],
        matter_id=matter_id or '',
        folder_id=folder_id or '',
        filename=file.filename,
        file_path=str(file_path),
        file_size=file_size,
        user_id=current_user['user_id']
    )
    
    # Queue background processing
    try:
        process_document_task.delay(
            doc_id=doc_id,
            firm_id=current_user['firm_id'],
            file_path=str(file_path),
            user_id=current_user['user_id']
        )
        status = "queued"
        message = "Document queued for processing"
    except Exception as e:
        print(f"[UPLOAD] Could not queue task: {e}")
        status = "pending"
        message = "Document uploaded, processing will begin shortly"
    
    # Audit & usage
    db.log_audit("upload", "document", doc_id, current_user['user_id'], current_user['firm_id'])
    db.bump_usage(current_user['user_id'], current_user['firm_id'], "docs_uploaded", 1)
    
    return DocumentUploadResponse(
        document_id=doc_id,
        filename=file.filename,
        status=status,
        message=message
    )

@router.get("/{doc_id}")
async def get_document(
    doc_id: str,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """Get document details"""
    
    doc = db.get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check firm access
    if doc['firm_id'] != current_user['firm_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return doc

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test", "role": "admin"})
):
    """Delete document (admin only)"""
    
    if current_user['role'] not in ['admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doc = db.get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc['firm_id'] != current_user['firm_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete file
    try:
        os.remove(doc['file_path'])
    except:
        pass
    
    # Delete from database
    db.execute_query("DELETE FROM documents WHERE id = %s", (doc_id,))
    
    # Delete vectors
    from server.vector_db import delete_document_vectors
    delete_document_vectors(doc_id)
    
    db.log_audit("delete", "document", doc_id, current_user['user_id'], current_user['firm_id'])
    
    return {"message": "Document deleted successfully"}

@router.get("/{doc_id}/summary")
async def get_summary(
    doc_id: str,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """Get document summary"""
    
    doc = db.get_document_by_id(doc_id)
    if not doc or doc['firm_id'] != current_user['firm_id']:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get summary from database
    query = "SELECT * FROM summaries WHERE document_id = %s ORDER BY created_at DESC LIMIT 1"
    summary = db.execute_query(query, (doc_id,), fetch_one=True)
    
    if not summary:
        return {"summary": None, "status": doc['status']}
    
    import json
    return {
        "summary": json.loads(summary['summary_json']) if summary['summary_json'] else {},
        "summary_text": summary['summary_text'],
        "created_at": summary['created_at']
    }

@router.get("/{doc_id}/clauses")
async def get_clauses(
    doc_id: str,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """Get extracted clauses"""
    
    doc = db.get_document_by_id(doc_id)
    if not doc or doc['firm_id'] != current_user['firm_id']:
        raise HTTPException(status_code=404, detail="Document not found")
    
    query = "SELECT * FROM clauses WHERE document_id = %s ORDER BY created_at"
    clauses = db.execute_query(query, (doc_id,), fetch_all=True)
    
    return {"clauses": clauses or []}

@router.get("/{doc_id}/facts")
async def get_facts(
    doc_id: str,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """Get extracted facts"""
    
    doc = db.get_document_by_id(doc_id)
    if not doc or doc['firm_id'] != current_user['firm_id']:
        raise HTTPException(status_code=404, detail="Document not found")
    
    query = "SELECT * FROM facts WHERE document_id = %s ORDER BY created_at DESC LIMIT 1"
    facts = db.execute_query(query, (doc_id,), fetch_one=True)
    
    if not facts:
        return {"facts": None}
    
    import json
    return {"facts": json.loads(facts['facts_json']) if facts['facts_json'] else {}}

@router.post("/chat")
async def chat_with_document(
    request: ChatRequest,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """Chat with document using RAG"""
    
    doc = db.get_document_by_id(request.document_id)
    if not doc or doc['firm_id'] != current_user['firm_id']:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Generate query embedding
    query_embedding = ai_service.generate_embeddings(request.question)
    
    # Search similar chunks
    from server.vector_db import search_similar_chunks
    similar_chunks = search_similar_chunks(
        query_embedding=query_embedding,
        firm_id=current_user['firm_id'],
        doc_id=request.document_id,
        top_k=5
    )
    
    # Build context from chunks
    context = "\n\n".join([chunk['text'] for chunk in similar_chunks])
    
    # Get chat answer
    response = ai_service.chat_with_context(
        question=request.question,
        context=context
    )
    
    if not response['success']:
        raise HTTPException(status_code=500, detail=response['error'])
    
    # Save to chat history
    session_id = request.session_id or db.generate_uuid()
    message_id = db.generate_uuid()
    
    query = """
        INSERT INTO chat_messages (id, session_id, message_type, content, tokens_used, created_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
    """
    db.execute_query(query, (message_id, session_id, 'question', request.question, 0))
    
    answer_id = db.generate_uuid()
    db.execute_query(query, (answer_id, session_id, 'answer', response['answer'], response['tokens_used']))
    
    # Update usage
    db.bump_usage(current_user['user_id'], current_user['firm_id'], "ai_tokens", response['tokens_used'])
    db.bump_usage(current_user['user_id'], current_user['firm_id'], "chats", 1)
    
    return {
        "answer": response['answer'],
        "session_id": session_id,
        "sources": similar_chunks,
        "tokens_used": response['tokens_used']
    }

@router.post("/{doc_id}/regenerate")
async def regenerate_analysis(
    doc_id: str,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test", "role": "admin"})
):
    """Regenerate document analysis"""
    
    if current_user['role'] not in ['admin', 'lawyer']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    doc = db.get_document_by_id(doc_id)
    if not doc or doc['firm_id'] != current_user['firm_id']:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Queue reprocessing
    try:
        from server.tasks import regenerate_embeddings_task
        regenerate_embeddings_task.delay(doc_id)
        return {"message": "Document analysis queued for regeneration"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
