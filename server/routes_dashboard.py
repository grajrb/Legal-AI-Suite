"""
Dashboard and admin endpoints
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

try:
    from server import db_postgres as db
    USE_POSTGRES = True
except:
    USE_POSTGRES = False

router = APIRouter(tags=["dashboard"])

class AssistantQuery(BaseModel):
    question: str
    filters: Optional[dict] = None

# ============= DASHBOARD STATS =============

@router.get("/api/stats")
async def get_stats(
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test", "role": "admin"})
):
    """Get dashboard statistics"""
    
    firm_id = current_user['firm_id']
    
    # Users count
    users_query = "SELECT COUNT(*) as count FROM user_firm WHERE firm_id = %s"
    users_count = db.execute_query(users_query, (firm_id,), fetch_one=True)['count']
    
    # Documents count
    docs_query = "SELECT COUNT(*) as count FROM documents WHERE firm_id = %s"
    docs_count = db.execute_query(docs_query, (firm_id,), fetch_one=True)['count']
    
    # Matters count
    matters_query = "SELECT COUNT(*) as count FROM matters WHERE firm_id = %s"
    matters_count = db.execute_query(matters_query, (firm_id,), fetch_one=True)['count']
    
    # Risky clauses count (high risk)
    risky_query = """
        SELECT COUNT(*) as count FROM clauses c
        JOIN documents d ON c.document_id = d.id
        WHERE d.firm_id = %s AND c.risk_level = 'high'
    """
    risky_count = db.execute_query(risky_query, (firm_id,), fetch_one=True)['count']
    
    # Documents reviewed today
    reviewed_query = """
        SELECT COUNT(*) as count FROM documents
        WHERE firm_id = %s AND status = 'completed'
        AND DATE(updated_at) = CURRENT_DATE
    """
    reviewed_today = db.execute_query(reviewed_query, (firm_id,), fetch_one=True)['count']
    
    # Pending documents
    pending_query = """
        SELECT COUNT(*) as count FROM documents
        WHERE firm_id = %s AND status IN ('pending', 'processing', 'queued')
    """
    pending_count = db.execute_query(pending_query, (firm_id,), fetch_one=True)['count']
    
    # Audit logs count
    audit_query = "SELECT COUNT(*) as count FROM audit_logs WHERE firm_id = %s"
    audit_count = db.execute_query(audit_query, (firm_id,), fetch_one=True)['count']
    
    # Activity data (last 7 days)
    activity_query = """
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM documents
        WHERE firm_id = %s AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
    """
    activity_data = db.execute_query(activity_query, (firm_id,), fetch_all=True)
    
    # Recent activity
    recent_query = """
        SELECT a.*, u.full_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.firm_id = %s
        ORDER BY a.created_at DESC
        LIMIT 10
    """
    recent_activity = db.execute_query(recent_query, (firm_id,), fetch_all=True)
    
    return {
        "users_count": users_count,
        "documents_count": docs_count,
        "matters_count": matters_count,
        "risky_clauses_count": risky_count,
        "reviewed_today": reviewed_today,
        "pending_count": pending_count,
        "audit_events_count": audit_count,
        "activity_chart": activity_data or [],
        "recent_activity": recent_activity or []
    }

# ============= PARALEGAL TASKS =============

@router.get("/api/paralegal-tasks")
async def get_paralegal_tasks(
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test", "role": "paralegal"})
):
    """Get paralegal task queue"""
    
    firm_id = current_user['firm_id']
    
    # Upload queue (pending/processing)
    queue_query = """
        SELECT d.*, u.full_name as uploaded_by_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.firm_id = %s AND d.status IN ('pending', 'processing', 'queued')
        ORDER BY d.created_at ASC
    """
    upload_queue = db.execute_query(queue_query, (firm_id,), fetch_all=True)
    
    # Failed OCR/processing
    failed_query = """
        SELECT d.*, u.full_name as uploaded_by_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.firm_id = %s AND d.status = 'failed'
        ORDER BY d.updated_at DESC
    """
    ocr_failures = db.execute_query(failed_query, (firm_id,), fetch_all=True)
    
    return {
        "upload_queue": upload_queue or [],
        "ocr_failures": ocr_failures or []
    }

# ============= AUDIT LOGS =============

@router.get("/api/audit")
async def get_audit_logs(
    limit: int = 100,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test", "role": "admin"})
):
    """Get audit logs (admin only)"""
    
    if current_user['role'] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    logs = db.get_audit_logs(current_user['firm_id'], limit)
    return {"logs": logs}

# ============= ADMIN ASSISTANT =============

@router.post("/api/assistant/query")
async def admin_assistant(
    query: AssistantQuery,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test", "role": "admin"})
):
    """Structured analytics queries (admin only)"""
    
    if current_user['role'] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    firm_id = current_user['firm_id']
    question = query.question.lower()
    
    # Pattern matching for common queries
    if "high risk" in question or "risky" in question:
        # High-risk matters/documents
        result_query = """
            SELECT m.title as matter, COUNT(c.id) as high_risk_clauses
            FROM matters m
            JOIN documents d ON d.matter_id = m.id
            JOIN clauses c ON c.document_id = d.id
            WHERE m.firm_id = %s AND c.risk_level = 'high'
            GROUP BY m.id, m.title
            ORDER BY high_risk_clauses DESC
            LIMIT 10
        """
        results = db.execute_query(result_query, (firm_id,), fetch_all=True)
        return {"answer": f"Found {len(results)} matters with high-risk clauses", "data": results}
    
    elif "failed" in question or "errors" in question:
        # Failed processing
        result_query = """
            SELECT filename, updated_at, file_path
            FROM documents
            WHERE firm_id = %s AND status = 'failed'
            ORDER BY updated_at DESC
            LIMIT 20
        """
        results = db.execute_query(result_query, (firm_id,), fetch_all=True)
        return {"answer": f"Found {len(results)} failed documents", "data": results}
    
    elif "clause" in question and "count" in question:
        # Clause statistics
        result_query = """
            SELECT clause_type, COUNT(*) as count, 
                   SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk
            FROM clauses c
            JOIN documents d ON c.document_id = d.id
            WHERE d.firm_id = %s
            GROUP BY clause_type
            ORDER BY count DESC
        """
        results = db.execute_query(result_query, (firm_id,), fetch_all=True)
        return {"answer": f"Clause type breakdown", "data": results}
    
    elif "active" in question and "matter" in question:
        # Active matters
        result_query = """
            SELECT m.title, m.status, m.deadline, c.name as client_name,
                   COUNT(d.id) as document_count
            FROM matters m
            LEFT JOIN clients c ON m.client_id = c.id
            LEFT JOIN documents d ON d.matter_id = m.id
            WHERE m.firm_id = %s AND m.status = 'active'
            GROUP BY m.id, m.title, m.status, m.deadline, c.name
            ORDER BY m.deadline ASC
        """
        results = db.execute_query(result_query, (firm_id,), fetch_all=True)
        return {"answer": f"Found {len(results)} active matters", "data": results}
    
    elif "usage" in question or "tokens" in question:
        # Usage metrics
        result_query = """
            SELECT metric_name, SUM(metric_value) as total
            FROM usage_metrics
            WHERE firm_id = %s
            GROUP BY metric_name
        """
        results = db.execute_query(result_query, (firm_id,), fetch_all=True)
        return {"answer": "Usage statistics", "data": results}
    
    else:
        # Default: recent activity summary
        result_query = """
            SELECT action, resource_type, COUNT(*) as count
            FROM audit_logs
            WHERE firm_id = %s AND created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY action, resource_type
            ORDER BY count DESC
            LIMIT 10
        """
        results = db.execute_query(result_query, (firm_id,), fetch_all=True)
        return {"answer": "Recent activity summary (last 30 days)", "data": results}

# ============= TEMPLATES =============

@router.get("/api/templates")
async def list_templates(
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """List templates"""
    
    templates = db.get_templates_by_firm(current_user['firm_id'])
    return {"templates": templates}

@router.post("/api/templates")
async def create_template(
    template_data: dict,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test", "role": "admin"})
):
    """Create template (admin only)"""
    
    if current_user['role'] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    template_id = db.create_template(
        firm_id=current_user['firm_id'],
        name=template_data['name'],
        content=template_data.get('content', ''),
        template_type=template_data.get('type', 'general'),
        created_by=current_user['user_id']
    )
    
    db.log_audit("create_template", "template", template_id, current_user['user_id'], current_user['firm_id'])
    
    return {"template_id": template_id, "name": template_data['name']}

@router.put("/api/templates/{template_id}")
async def update_template(
    template_id: str,
    template_data: dict,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test", "role": "admin"})
):
    """Update template with versioning"""
    
    if current_user['role'] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get current template
    query = "SELECT * FROM templates WHERE id = %s AND firm_id = %s"
    template = db.execute_query(query, (template_id, current_user['firm_id']), fetch_one=True)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Increment version
    new_version = template['version'] + 1
    
    # Update template
    update_query = """
        UPDATE templates
        SET content = %s, version = %s, updated_at = NOW()
        WHERE id = %s
    """
    db.execute_query(update_query, (template_data.get('content', template['content']), new_version, template_id))
    
    db.log_audit("update_template", "template", template_id, current_user['user_id'], current_user['firm_id'],
                 {"old_version": template['version'], "new_version": new_version})
    
    return {"message": "Template updated", "version": new_version}
