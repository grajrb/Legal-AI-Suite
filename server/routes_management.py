"""
Management endpoints: firms, clients, matters, folders
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr

try:
    from server import db_postgres as db
    USE_POSTGRES = True
except:
    USE_POSTGRES = False

router = APIRouter(tags=["management"])

# Pydantic Models
class FirmCreate(BaseModel):
    name: str
    plan: str = "free"

class ClientCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class MatterCreate(BaseModel):
    client_id: str
    title: str
    description: Optional[str] = ""
    status: str = "active"
    deadline: Optional[str] = None

class FolderCreate(BaseModel):
    matter_id: str
    name: str
    parent_folder_id: Optional[str] = None

class InviteUser(BaseModel):
    email: EmailStr
    role: str

# ============= FIRMS =============

@router.post("/api/firms")
async def create_firm(
    firm_data: FirmCreate,
    current_user: dict = Depends(lambda: {"user_id": "test", "role": "admin"})
):
    """Create new firm (admin only)"""
    
    if current_user['role'] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    firm_id = db.create_firm(firm_data.name, firm_data.plan)
    
    # Add current user as admin
    db.add_user_to_firm(current_user['user_id'], firm_id, "admin")
    
    db.log_audit("create_firm", "firm", firm_id, current_user['user_id'], firm_id)
    
    return {
        "firm_id": firm_id,
        "name": firm_data.name,
        "plan": firm_data.plan
    }

@router.get("/api/firms")
async def list_firms(
    current_user: dict = Depends(lambda: {"user_id": "test"})
):
    """List user's firms"""
    
    firms = db.get_user_firms(current_user['user_id'])
    return {"firms": firms}

@router.post("/api/firms/{firm_id}/invite")
async def invite_user_to_firm(
    firm_id: str,
    invite: InviteUser,
    current_user: dict = Depends(lambda: {"user_id": "test", "role": "admin", "firm_id": "test"})
):
    """Invite user to firm (admin only)"""
    
    if current_user['role'] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if current_user['firm_id'] != firm_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if user exists
    user = db.get_user_by_email(invite.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found. They must register first.")
    
    # Add to firm
    db.add_user_to_firm(user['id'], firm_id, invite.role)
    
    db.log_audit("invite_user", "firm", firm_id, current_user['user_id'], firm_id, 
                 {"invited_user_id": user['id'], "role": invite.role})
    
    return {"message": "User invited successfully", "user_id": user['id']}

# ============= CLIENTS =============

@router.post("/api/clients")
async def create_client(
    client_data: ClientCreate,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test", "role": "lawyer"})
):
    """Create new client"""
    
    if current_user['role'] not in ["admin", "lawyer", "paralegal"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    client_id = db.create_client(
        firm_id=current_user['firm_id'],
        name=client_data.name,
        email=client_data.email,
        phone=client_data.phone
    )
    
    db.log_audit("create_client", "client", client_id, current_user['user_id'], current_user['firm_id'])
    
    return {
        "client_id": client_id,
        "name": client_data.name,
        "email": client_data.email,
        "phone": client_data.phone
    }

@router.get("/api/clients")
async def list_clients(
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """List firm's clients"""
    
    clients = db.get_clients_by_firm(current_user['firm_id'])
    return {"clients": clients}

@router.get("/api/clients/{client_id}")
async def get_client(
    client_id: str,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """Get client details"""
    
    query = "SELECT * FROM clients WHERE id = %s AND firm_id = %s"
    client = db.execute_query(query, (client_id, current_user['firm_id']), fetch_one=True)
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get matters for this client
    matters = db.get_matters_by_firm(current_user['firm_id'])
    client_matters = [m for m in matters if m['client_id'] == client_id]
    
    return {
        "client": client,
        "matters": client_matters
    }

# ============= MATTERS =============

@router.post("/api/matters")
async def create_matter(
    matter_data: MatterCreate,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test", "role": "lawyer"})
):
    """Create new matter"""
    
    if current_user['role'] not in ["admin", "lawyer"]:
        raise HTTPException(status_code=403, detail="Admin or lawyer access required")
    
    matter_id = db.create_matter(
        firm_id=current_user['firm_id'],
        client_id=matter_data.client_id,
        title=matter_data.title,
        description=matter_data.description,
        status=matter_data.status,
        deadline=matter_data.deadline
    )
    
    db.log_audit("create_matter", "matter", matter_id, current_user['user_id'], current_user['firm_id'])
    
    return {
        "matter_id": matter_id,
        "title": matter_data.title,
        "status": matter_data.status
    }

@router.get("/api/matters")
async def list_matters(
    status: Optional[str] = None,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """List firm's matters"""
    
    matters = db.get_matters_by_firm(current_user['firm_id'], status)
    return {"matters": matters}

@router.get("/api/matters/{matter_id}")
async def get_matter(
    matter_id: str,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """Get matter details with documents and folders"""
    
    query = "SELECT * FROM matters WHERE id = %s AND firm_id = %s"
    matter = db.execute_query(query, (matter_id, current_user['firm_id']), fetch_one=True)
    
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")
    
    # Get folders
    folders = db.get_folders_by_matter(matter_id)
    
    # Get documents
    doc_query = "SELECT * FROM documents WHERE matter_id = %s ORDER BY created_at DESC"
    documents = db.execute_query(doc_query, (matter_id,), fetch_all=True)
    
    return {
        "matter": matter,
        "folders": folders,
        "documents": documents or []
    }

# ============= FOLDERS =============

@router.post("/api/folders")
async def create_folder(
    folder_data: FolderCreate,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """Create new folder"""
    
    folder_id = db.create_folder(
        firm_id=current_user['firm_id'],
        matter_id=folder_data.matter_id,
        name=folder_data.name,
        parent_folder_id=folder_data.parent_folder_id
    )
    
    db.log_audit("create_folder", "folder", folder_id, current_user['user_id'], current_user['firm_id'])
    
    return {
        "folder_id": folder_id,
        "name": folder_data.name,
        "matter_id": folder_data.matter_id
    }

@router.get("/api/folders")
async def list_folders(
    matter_id: Optional[str] = None,
    current_user: dict = Depends(lambda: {"user_id": "test", "firm_id": "test"})
):
    """List folders"""
    
    if matter_id:
        folders = db.get_folders_by_matter(matter_id)
    else:
        query = "SELECT * FROM folders WHERE firm_id = %s ORDER BY name"
        folders = db.execute_query(query, (current_user['firm_id'],), fetch_all=True)
    
    return {"folders": folders or []}
