"""
PostgreSQL database utilities and connection management
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor, execute_batch
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager
from typing import Optional, List, Dict, Any
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Root@localhost:5432/legal_ai")

# Connection pool
_pool: Optional[SimpleConnectionPool] = None

def get_pool():
    """Get or create connection pool"""
    global _pool
    if _pool is None:
        _pool = SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=DATABASE_URL
        )
    return _pool

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    pool = get_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        pool.putconn(conn)

@contextmanager
def get_db_cursor(commit=True):
    """Context manager for database cursor with dict results"""
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()

def execute_query(query: str, params: tuple = None, fetch_one=False, fetch_all=False):
    """Execute a query and return results"""
    with get_db_cursor() as cursor:
        cursor.execute(query, params or ())
        
        if fetch_one:
            return cursor.fetchone()
        elif fetch_all:
            return cursor.fetchall()
        else:
            return cursor.rowcount

def execute_many(query: str, params_list: List[tuple]):
    """Execute batch insert/update"""
    with get_db_cursor() as cursor:
        execute_batch(cursor, query, params_list)
        return cursor.rowcount

def generate_uuid() -> str:
    """Generate UUID string"""
    return str(uuid.uuid4())

# Utility functions for common queries
def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    query = "SELECT * FROM users WHERE id = %s"
    return execute_query(query, (user_id,), fetch_one=True)

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    query = "SELECT * FROM users WHERE email = %s"
    return execute_query(query, (email,), fetch_one=True)

def create_user(email: str, password_hash: str, full_name: str, role: str) -> str:
    """Create new user"""
    user_id = generate_uuid()
    query = """
        INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        RETURNING id
    """
    result = execute_query(query, (user_id, email, password_hash, full_name, role), fetch_one=True)
    return result['id'] if result else user_id

def get_firm_by_id(firm_id: str) -> Optional[Dict[str, Any]]:
    """Get firm by ID"""
    query = "SELECT * FROM firms WHERE id = %s"
    return execute_query(query, (firm_id,), fetch_one=True)

def create_firm(name: str, plan: str = "free") -> str:
    """Create new firm"""
    firm_id = generate_uuid()
    query = """
        INSERT INTO firms (id, name, plan, created_at, updated_at)
        VALUES (%s, %s, %s, NOW(), NOW())
        RETURNING id
    """
    result = execute_query(query, (firm_id, name, plan), fetch_one=True)
    return result['id'] if result else firm_id

def add_user_to_firm(user_id: str, firm_id: str, role: str):
    """Add user to firm with role"""
    query = """
        INSERT INTO user_firm (user_id, firm_id, role, joined_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (user_id, firm_id) DO UPDATE SET role = EXCLUDED.role
    """
    execute_query(query, (user_id, firm_id, role))

def get_user_firms(user_id: str) -> List[Dict[str, Any]]:
    """Get all firms for a user"""
    query = """
        SELECT f.*, uf.role as user_role, uf.joined_at
        FROM firms f
        JOIN user_firm uf ON f.id = uf.firm_id
        WHERE uf.user_id = %s
    """
    return execute_query(query, (user_id,), fetch_all=True) or []

def create_client(firm_id: str, name: str, email: str = None, phone: str = None) -> str:
    """Create new client"""
    client_id = generate_uuid()
    query = """
        INSERT INTO clients (id, firm_id, name, email, phone, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        RETURNING id
    """
    result = execute_query(query, (client_id, firm_id, name, email, phone), fetch_one=True)
    return result['id'] if result else client_id

def get_clients_by_firm(firm_id: str) -> List[Dict[str, Any]]:
    """Get all clients for a firm"""
    query = "SELECT * FROM clients WHERE firm_id = %s ORDER BY created_at DESC"
    return execute_query(query, (firm_id,), fetch_all=True) or []

def create_matter(firm_id: str, client_id: str, title: str, description: str = None, 
                  status: str = "active", deadline: str = None) -> str:
    """Create new matter"""
    matter_id = generate_uuid()
    query = """
        INSERT INTO matters (id, firm_id, client_id, title, description, status, deadline, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        RETURNING id
    """
    result = execute_query(query, (matter_id, firm_id, client_id, title, description, status, deadline), fetch_one=True)
    return result['id'] if result else matter_id

def get_matters_by_firm(firm_id: str, status: str = None) -> List[Dict[str, Any]]:
    """Get all matters for a firm"""
    if status:
        query = "SELECT m.*, c.name as client_name FROM matters m LEFT JOIN clients c ON m.client_id = c.id WHERE m.firm_id = %s AND m.status = %s ORDER BY m.created_at DESC"
        return execute_query(query, (firm_id, status), fetch_all=True) or []
    else:
        query = "SELECT m.*, c.name as client_name FROM matters m LEFT JOIN clients c ON m.client_id = c.id WHERE m.firm_id = %s ORDER BY m.created_at DESC"
        return execute_query(query, (firm_id,), fetch_all=True) or []

def create_folder(firm_id: str, matter_id: str, name: str, parent_folder_id: str = None) -> str:
    """Create new folder"""
    folder_id = generate_uuid()
    query = """
        INSERT INTO folders (id, firm_id, matter_id, parent_folder_id, name, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        RETURNING id
    """
    result = execute_query(query, (folder_id, firm_id, matter_id, parent_folder_id, name), fetch_one=True)
    return result['id'] if result else folder_id

def get_folders_by_matter(matter_id: str) -> List[Dict[str, Any]]:
    """Get all folders for a matter"""
    query = "SELECT * FROM folders WHERE matter_id = %s ORDER BY name"
    return execute_query(query, (matter_id,), fetch_all=True) or []

def create_document(firm_id: str, matter_id: str, folder_id: str, filename: str, 
                   file_path: str, file_size: int, user_id: str) -> str:
    """Create new document"""
    doc_id = generate_uuid()
    query = """
        INSERT INTO documents (id, firm_id, matter_id, folder_id, filename, file_path, 
                             file_size, uploaded_by, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', NOW(), NOW())
        RETURNING id
    """
    result = execute_query(query, (doc_id, firm_id, matter_id, folder_id, filename, 
                                   file_path, file_size, user_id), fetch_one=True)
    return result['id'] if result else doc_id

def get_document_by_id(doc_id: str) -> Optional[Dict[str, Any]]:
    """Get document by ID"""
    query = "SELECT * FROM documents WHERE id = %s"
    return execute_query(query, (doc_id,), fetch_one=True)

def update_document_status(doc_id: str, status: str, text_content: str = None):
    """Update document processing status"""
    if text_content:
        query = "UPDATE documents SET status = %s, text_content = %s, updated_at = NOW() WHERE id = %s"
        execute_query(query, (status, text_content, doc_id))
    else:
        query = "UPDATE documents SET status = %s, updated_at = NOW() WHERE id = %s"
        execute_query(query, (status, doc_id))

def create_template(firm_id: str, name: str, content: str, template_type: str, 
                   created_by: str, version: int = 1) -> str:
    """Create new template"""
    template_id = generate_uuid()
    query = """
        INSERT INTO templates (id, firm_id, name, content, template_type, version, 
                             created_by, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        RETURNING id
    """
    result = execute_query(query, (template_id, firm_id, name, content, template_type, 
                                   version, created_by), fetch_one=True)
    return result['id'] if result else template_id

def get_templates_by_firm(firm_id: str) -> List[Dict[str, Any]]:
    """Get all templates for a firm"""
    query = "SELECT * FROM templates WHERE firm_id = %s ORDER BY name"
    return execute_query(query, (firm_id,), fetch_all=True) or []

def log_audit(action: str, resource_type: str, resource_id: str, user_id: str, 
             firm_id: str = None, metadata: dict = None):
    """Log audit event"""
    audit_id = generate_uuid()
    metadata_json = json.dumps(metadata) if metadata else None
    query = """
        INSERT INTO audit_logs (id, user_id, firm_id, action, resource_type, resource_id, 
                               metadata, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
    """
    execute_query(query, (audit_id, user_id, firm_id, action, resource_type, resource_id, metadata_json))

def get_audit_logs(firm_id: str = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Get audit logs"""
    if firm_id:
        query = "SELECT * FROM audit_logs WHERE firm_id = %s ORDER BY created_at DESC LIMIT %s"
        return execute_query(query, (firm_id, limit), fetch_all=True) or []
    else:
        query = "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT %s"
        return execute_query(query, (limit,), fetch_all=True) or []

def bump_usage(user_id: str, firm_id: str, metric: str, value: int = 1):
    """Increment usage metric"""
    query = """
        INSERT INTO usage_metrics (id, user_id, firm_id, metric_name, metric_value, recorded_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
    """
    execute_query(query, (generate_uuid(), user_id, firm_id, metric, value))
