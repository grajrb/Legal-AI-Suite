"""
Backend Middleware for Request Validation and Error Handling
Provides comprehensive error handling, request validation, and response standardization
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from typing import Callable, Dict, Any, Optional
import logging
import traceback
import time
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= STANDARDIZED ERROR RESPONSES =============

class ErrorResponse:
    """Standardized error response format"""
    
    @staticmethod
    def format_error(
        message: str,
        code: str,
        status_code: int,
        details: Optional[Dict[str, Any]] = None,
        field_errors: Optional[Dict[str, str]] = None
    ) -> JSONResponse:
        """Format error response"""
        error_data = {
            "success": False,
            "error": {
                "message": message,
                "code": code,
                "timestamp": datetime.utcnow().isoformat(),
            }
        }
        
        if details:
            error_data["error"]["details"] = details
        
        if field_errors:
            error_data["error"]["field_errors"] = field_errors
        
        return JSONResponse(
            status_code=status_code,
            content=error_data
        )

# ============= ERROR HANDLERS =============

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors"""
    field_errors = {}
    
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        field_errors[field] = error["msg"]
    
    logger.warning(f"Validation error on {request.url.path}: {field_errors}")
    
    return ErrorResponse.format_error(
        message="Validation error",
        code="VALIDATION_ERROR",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        field_errors=field_errors
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.warning(f"HTTP {exc.status_code} on {request.url.path}: {exc.detail}")
    
    return ErrorResponse.format_error(
        message=exc.detail if isinstance(exc.detail, str) else str(exc.detail),
        code=f"HTTP_{exc.status_code}",
        status_code=exc.status_code
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}")
    logger.error(traceback.format_exc())
    
    return ErrorResponse.format_error(
        message="Internal server error",
        code="INTERNAL_SERVER_ERROR",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        details={"error": str(exc)} if logger.level == logging.DEBUG else None
    )

# ============= REQUEST LOGGING MIDDLEWARE =============

async def log_request_middleware(request: Request, call_next: Callable):
    """Log all requests with timing"""
    start_time = time.time()
    
    # Log request
    logger.info(f"{request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Log response with timing
    duration = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({duration:.2f}s)")
    
    return response

# ============= STANDARDIZED SUCCESS RESPONSES =============

class SuccessResponse:
    """Standardized success response format"""
    
    @staticmethod
    def format_success(
        data: Any,
        message: str = "Success",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Format success response"""
        response = {
            "success": True,
            "data": data,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if metadata:
            response["metadata"] = metadata
        
        return response

# ============= REQUEST VALIDATORS =============

class RequestValidator:
    """Request validation utilities"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """Validate password strength"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        
        if not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
        
        if not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"
        
        if not any(c.isdigit() for c in password):
            return False, "Password must contain at least one number"
        
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            return False, "Password must contain at least one special character"
        
        return True, "Password is strong"
    
    @staticmethod
    def validate_file_type(filename: str, allowed_types: list[str]) -> bool:
        """Validate file type"""
        return any(filename.lower().endswith(ext) for ext in allowed_types)
    
    @staticmethod
    def validate_file_size(file_size: int, max_size_mb: int) -> bool:
        """Validate file size"""
        max_bytes = max_size_mb * 1024 * 1024
        return file_size <= max_bytes

# ============= RATE LIMITING =============

class RateLimiter:
    """Simple rate limiter for API endpoints"""
    
    def __init__(self):
        self.requests: Dict[str, list] = {}
    
    def is_allowed(
        self,
        identifier: str,
        max_requests: int = 100,
        window_seconds: int = 60
    ) -> tuple[bool, Optional[int]]:
        """Check if request is allowed"""
        now = time.time()
        
        # Initialize or clean old requests
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        # Remove old requests outside the window
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if now - req_time < window_seconds
        ]
        
        # Check if limit exceeded
        if len(self.requests[identifier]) >= max_requests:
            retry_after = int(window_seconds - (now - self.requests[identifier][0]))
            return False, retry_after
        
        # Add current request
        self.requests[identifier].append(now)
        return True, None

# Global rate limiter instance
rate_limiter = RateLimiter()

# ============= SECURITY MIDDLEWARE =============

async def security_headers_middleware(request: Request, call_next: Callable):
    """Add security headers to responses"""
    response = await call_next(request)
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response

# ============= DATABASE ERROR HANDLERS =============

class DatabaseError(Exception):
    """Custom database error"""
    pass

def handle_database_error(error: Exception) -> HTTPException:
    """Handle database errors"""
    logger.error(f"Database error: {str(error)}")
    
    if "UNIQUE constraint failed" in str(error):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Resource already exists"
        )
    
    if "FOREIGN KEY constraint failed" in str(error):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reference to related resource"
        )
    
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Database operation failed"
    )
