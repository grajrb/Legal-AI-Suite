"""
Authentication endpoints with Postgres support
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime
from passlib.context import CryptContext
from jose import jwt
import os

# Import database functions
try:
    from server import db_postgres as db
    USE_POSTGRES = True
except:
    USE_POSTGRES = False

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "lawyer"
    organization: str = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization: Optional[str] = ""

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str, email: str, role: str, firm_id: Optional[str] = None) -> str:
    from datetime import datetime, timedelta
    expires = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "firm_id": firm_id,
        "exp": expires
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    """Register new user and create default firm"""
    
    if not USE_POSTGRES:
        raise HTTPException(
            status_code=500, 
            detail="Database not configured. Please contact administrator."
        )
    
    try:
        # Validate input
        if not user_data.email or '@' not in user_data.email:
            raise HTTPException(
                status_code=400,
                detail="Invalid email address"
            )
        
        if not user_data.password or len(user_data.password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 6 characters long"
            )
        
        if not user_data.full_name or len(user_data.full_name.strip()) < 2:
            raise HTTPException(
                status_code=400,
                detail="Full name must be at least 2 characters long"
            )
        
        # Check if user exists
        existing = db.get_user_by_email(user_data.email)
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="This email is already registered. Please login or use a different email."
            )
        
        # Create user
        password_hash = hash_password(user_data.password)
        user_id = db.create_user(
            email=user_data.email,
            password_hash=password_hash,
            full_name=user_data.full_name.strip(),
            role=user_data.role
        )
        
        if not user_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to create user account. Please try again."
            )
        
        # Create default firm for this user
        firm_name = user_data.organization or f"{user_data.full_name}'s Firm"
        firm_id = db.create_firm(firm_name, plan="free")
        
        if not firm_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to create organization. Please try again."
            )
        
        # Add user to firm as admin
        db.add_user_to_firm(user_id, firm_id, "admin")
        
        # Create token
        access_token = create_token(user_id, user_data.email, user_data.role, firm_id)
        
        # Audit log
        try:
            db.log_audit("register", "user", user_id, user_id, firm_id, {"email": user_data.email})
        except:
            pass  # Don't fail registration if audit fails
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user_id,
                email=user_data.email,
                full_name=user_data.full_name,
                role=user_data.role,
                organization=firm_name
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[REGISTER ERROR] {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user"""
    
    if not USE_POSTGRES:
        raise HTTPException(
            status_code=500, 
            detail="Database not configured. Please contact administrator."
        )
    
    try:
        # Validate input
        if not credentials.email or '@' not in credentials.email:
            raise HTTPException(
                status_code=400,
                detail="Invalid email address"
            )
        
        if not credentials.password:
            raise HTTPException(
                status_code=400,
                detail="Password is required"
            )
        
        # Get user by email
        user = db.get_user_by_email(credentials.email)
        if not user:
            raise HTTPException(
                status_code=401, 
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(credentials.password, user['password_hash']):
            raise HTTPException(
                status_code=401, 
                detail="Invalid email or password"
            )
        
        # Get user's firms
        firms = db.get_user_firms(user['id'])
        firm_id = firms[0]['id'] if firms else None
        firm_name = firms[0]['name'] if firms else ""
        
        # Create token
        access_token = create_token(user['id'], user['email'], user['role'], firm_id)
        
        # Audit log
        try:
            db.log_audit("login", "user", user['id'], user['id'], firm_id)
        except:
            pass  # Don't fail login if audit fails
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=user['id'],
                email=user['email'],
                full_name=user['full_name'],
                role=user['role'],
                organization=firm_name
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[LOGIN ERROR] {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Login failed. Please try again."
        )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(lambda: {"user_id": "test"})):
    """Get current user info"""
    
    if USE_POSTGRES:
        user = db.get_user_by_id(current_user['user_id'])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        firms = db.get_user_firms(user['id'])
        firm_name = firms[0]['name'] if firms else ""
        
        return UserResponse(
            id=user['id'],
            email=user['email'],
            full_name=user['full_name'],
            role=user['role'],
            organization=firm_name
        )
    else:
        raise HTTPException(status_code=500, detail="Database not configured")
