"""
Background task processor using Celery
"""
import os
from celery import Celery
from typing import Dict
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Initialize Celery
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery('legal_ai_tasks', broker=redis_url, backend=redis_url)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
)

@celery_app.task(name='process_document')
def process_document_task(doc_id: str, firm_id: str, file_path: str, user_id: str):
    """Process document asynchronously: OCR, chunking, embeddings, AI extraction"""
    from server.db_postgres import (update_document_status, execute_query, 
                                    log_audit, bump_usage, generate_uuid)
    from server.ai_service import (generate_summary, extract_clauses, 
                                   extract_facts, chunk_text, generate_embeddings)
    from server.vector_db import upsert_document_vectors
    from PyPDF2 import PdfReader
    
    try:
        # Update status to processing
        update_document_status(doc_id, 'processing')
        
        # Extract text from PDF
        text_content = ""
        try:
            with open(file_path, 'rb') as file:
                pdf = PdfReader(file)
                for page in pdf.pages:
                    text_content += page.extract_text() or ""
        except Exception as e:
            update_document_status(doc_id, 'failed')
            return {"success": False, "error": f"PDF extraction failed: {e}"}
        
        if not text_content.strip():
            update_document_status(doc_id, 'failed')
            return {"success": False, "error": "No text extracted from PDF"}
        
        # Update document with text content
        update_document_status(doc_id, 'processing', text_content)
        
        # Generate summary
        summary_result = generate_summary(text_content)
        if summary_result["success"]:
            summary_id = generate_uuid()
            query = """
                INSERT INTO summaries (id, document_id, summary_text, summary_json, 
                                     tokens_used, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
            """
            import json
            summary_json = json.dumps(summary_result["summary"])
            summary_text = summary_result["summary"].get("summary", "")
            execute_query(query, (summary_id, doc_id, summary_text, summary_json, 
                                 summary_result["tokens_used"]))
            bump_usage(user_id, firm_id, "ai_tokens", summary_result["tokens_used"])
        
        # Extract clauses
        clauses_result = extract_clauses(text_content)
        if clauses_result["success"]:
            for clause_data in clauses_result["clauses"]:
                clause_id = generate_uuid()
                query = """
                    INSERT INTO clauses (id, document_id, clause_type, clause_text, 
                                       risk_level, explanation, page_reference, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                """
                execute_query(query, (
                    clause_id, doc_id, clause_data.get("type"), 
                    clause_data.get("text"), clause_data.get("risk_level"),
                    clause_data.get("explanation"), clause_data.get("page_ref")
                ))
            bump_usage(user_id, firm_id, "ai_tokens", clauses_result["tokens_used"])
        
        # Extract facts
        facts_result = extract_facts(text_content)
        if facts_result["success"]:
            fact_id = generate_uuid()
            query = """
                INSERT INTO facts (id, document_id, facts_json, created_at)
                VALUES (%s, %s, %s, NOW())
            """
            import json
            facts_json = json.dumps(facts_result["facts"])
            execute_query(query, (fact_id, doc_id, facts_json))
            bump_usage(user_id, firm_id, "ai_tokens", facts_result["tokens_used"])
        
        # Chunk and embed
        chunks = chunk_text(text_content, chunk_size=500, overlap=50)
        embeddings = []
        for chunk in chunks:
            embedding = generate_embeddings(chunk)
            if embedding:
                embeddings.append(embedding)
        
        if embeddings:
            # Store chunks in database
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_id = generate_uuid()
                query = """
                    INSERT INTO chunks (id, document_id, chunk_index, chunk_text, 
                                      token_count, created_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """
                execute_query(query, (chunk_id, doc_id, i, chunk, len(chunk.split())))
                
                # Store embedding reference
                embedding_id = generate_uuid()
                vector_id = f"{doc_id}_chunk_{i}"
                query = """
                    INSERT INTO embeddings (id, chunk_id, external_vector_id, created_at)
                    VALUES (%s, %s, %s, NOW())
                """
                execute_query(query, (embedding_id, chunk_id, vector_id))
            
            # Upsert to vector DB
            upsert_document_vectors(doc_id, firm_id, chunks, embeddings)
        
        # Update final status
        update_document_status(doc_id, 'completed')
        
        # Log audit
        log_audit('document_processed', 'document', doc_id, user_id, firm_id)
        
        return {
            "success": True,
            "doc_id": doc_id,
            "chunks_count": len(chunks),
            "embeddings_count": len(embeddings)
        }
        
    except Exception as e:
        update_document_status(doc_id, 'failed')
        return {"success": False, "error": str(e)}

@celery_app.task(name='regenerate_embeddings')
def regenerate_embeddings_task(doc_id: str):
    """Regenerate embeddings for a document"""
    from server.db_postgres import get_document_by_id, execute_query
    from server.ai_service import chunk_text, generate_embeddings
    from server.vector_db import delete_document_vectors, upsert_document_vectors
    
    try:
        doc = get_document_by_id(doc_id)
        if not doc or not doc.get('text_content'):
            return {"success": False, "error": "Document not found or no text content"}
        
        # Delete old vectors
        delete_document_vectors(doc_id)
        
        # Delete old chunks and embeddings
        execute_query("DELETE FROM embeddings WHERE chunk_id IN (SELECT id FROM chunks WHERE document_id = %s)", (doc_id,))
        execute_query("DELETE FROM chunks WHERE document_id = %s", (doc_id,))
        
        # Rechunk and embed
        text_content = doc['text_content']
        chunks = chunk_text(text_content)
        embeddings = [generate_embeddings(chunk) for chunk in chunks]
        
        # Store new chunks and embeddings
        from server.db_postgres import generate_uuid
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            if embedding:
                chunk_id = generate_uuid()
                query = """
                    INSERT INTO chunks (id, document_id, chunk_index, chunk_text, 
                                      token_count, created_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """
                execute_query(query, (chunk_id, doc_id, i, chunk, len(chunk.split())))
                
                embedding_id = generate_uuid()
                vector_id = f"{doc_id}_chunk_{i}"
                query = """
                    INSERT INTO embeddings (id, chunk_id, external_vector_id, created_at)
                    VALUES (%s, %s, %s, NOW())
                """
                execute_query(query, (embedding_id, chunk_id, vector_id))
        
        # Upsert to Pinecone
        upsert_document_vectors(doc_id, doc['firm_id'], chunks, embeddings)
        
        return {"success": True, "chunks_count": len(chunks)}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == '__main__':
    celery_app.start()
