# app.py - Complete GCS Storage Integration with Database
# Fully configured for Render deployment

from fastapi import FastAPI, HTTPException, Request, Depends, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, text
import asyncio
import json
import uuid
import secrets
from enum import Enum
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from fastapi import Query
import re
import logging
import bcrypt
import os
import anthropic

# ==================== Import Routers ====================
try:
    from seed_integrations import router as integrations_router
    import seed_integrations
except ImportError:
    integrations_router = None
    seed_integrations = None
    print("Warning: seed_integrations module not found")

try:
    from pricing import router as pricing_router
except ImportError:
    pricing_router = None
    print("Warning: pricing module not found")

# ==================== Import Database ====================
from database import get_db, init_db

# ==================== Import Models ====================
try:
    from models import (
        User, Project, CreditTransaction, Integration, 
        Design, Template, Component, AnalyticsEvent, Slug, project_designs,
        Tutorial, TutorialCompletion, UserTutorialProgress, 
        TutorialView, TutorialComment, TutorialLike, TutorialBookmark,
        TutorialCategory as TutorialCategoryModel, TutorialTag, TutorialTagMapping,
    )
except ImportError as e:
    print(f"Warning: Could not import models: {e}")
    # Create placeholder models
    from sqlalchemy import Column, String, Integer, DateTime, JSON, Text, Boolean, Float
    from database import Base
    
    class User(Base):
        __tablename__ = "users"
        id = Column(String, primary_key=True)
        name = Column(String)
        email = Column(String, unique=True)
        password_hash = Column(String)
        credits_balance = Column(Integer, default=50)
        subscription_tier = Column(String, default="free")
        avatar_url = Column(String, nullable=True)
        created_at = Column(DateTime, default=datetime.now(timezone.utc))
        last_login = Column(DateTime, nullable=True)
        password_reset_token = Column(String, nullable=True)
        password_reset_expires = Column(DateTime, nullable=True)
    
    class Project(Base):
        __tablename__ = "projects"
        id = Column(String, primary_key=True)
        name = Column(String)
        user_id = Column(String)
        global_styles = Column(JSON, default={})
        layout_config = Column(JSON, default={})
        html_code = Column(Text, nullable=True)
        published_url = Column(String, nullable=True)
        created_at = Column(DateTime, default=datetime.now(timezone.utc))
        updated_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    # ✅ FIXED: Renamed 'metadata' column to 'extra_data' (SQLAlchemy reserved)
    class CreditTransaction(Base):
        __tablename__ = "credit_transactions"
        id = Column(String, primary_key=True)
        user_id = Column(String)
        amount = Column(Integer)
        type = Column(String)
        description = Column(String)
        extra_data = Column(JSON, nullable=True)  # ← FIXED: renamed from 'metadata'
        created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    project_designs = None  # Placeholder

# ==================== Import Storage ====================
try:
    from storage import upload_file_to_gcs, delete_file_from_gcs, get_gcs_client
except ImportError:
    print("Warning: storage module not found. File upload features will be disabled.")
    def upload_file_to_gcs(file, blob_path):
        raise NotImplementedError("Storage module not configured")
    def delete_file_from_gcs(file_path):
        raise NotImplementedError("Storage module not configured")
    def get_gcs_client():
        raise NotImplementedError("Storage module not configured")

# ==================== App Initialization ====================

app = FastAPI(
    title="Aleyo AI Website Builder API",
    version="1.0.0",
    description="API for Aleyo Website Builder - Deployed on Render"
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== Rate Limiting ====================

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429, 
        content={"detail": "Rate limit exceeded. Please try again later."}
    )

# ==================== Security ====================

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# ==================== Anthropic Configuration ====================
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229")
anthropic_client = None

if ANTHROPIC_API_KEY:
    try:
        anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        logger.info("Anthropic client initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize Anthropic client: {e}")
else:
    logger.warning("ANTHROPIC_API_KEY is not set - AI features will be disabled")

# ==================== CORS Configuration ====================

# Get frontend URL from environment
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://aleyo-2-six.vercel.app",
    "https://aleyo-2-1.onrender.com", "*", "http://35.230.74.10:0"
]

# Add FRONTEND_URL if set
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

# Remove duplicates and empty strings
ALLOWED_ORIGINS = list(set([origin for origin in ALLOWED_ORIGINS if origin]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Include Routers ====================

if integrations_router:
    try:
        app.include_router(integrations_router, prefix="/api")
        logger.info("Integrations router included")
    except Exception as e:
        logger.warning(f"Could not include integrations router: {e}")

if pricing_router:
    try:
        app.include_router(pricing_router, prefix="/api")
        logger.info("Pricing router included")
    except Exception as e:
        logger.warning(f"Could not include pricing router: {e}")

# ==================== ROOT ENDPOINTS ====================

@app.get("/")
async def root():
    """Root endpoint - displays API info"""
    return {
        "message": "Aleyo AI Website Builder API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "environment": "production" if os.getenv("RENDER") else "development",
        "endpoints": {
            "auth": "/api/auth/...",
            "projects": "/api/projects/...",
            "credits": "/api/credits/...",
            "upload": "/api/upload/..."
        }
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for Render"""
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "environment": "production" if os.getenv("RENDER") else "development",
        "render": os.getenv("RENDER", "false"),
        "port": os.getenv("PORT", "not set"),
        "service": "aleyo-backend"
    }

# ==================== Startup Event ====================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    
    logger.info(f"Application started on Render: {os.getenv('RENDER', 'False')}")
    logger.info(f"Port: {os.getenv('PORT', 'Not set')}")
    logger.info(f"Environment: {'production' if os.getenv('RENDER') else 'development'}")

# ==================== Pydantic Models ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    credits: int
    created_at: datetime
    subscription_tier: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    status: str
    access_token: str
    token_type: str
    user: UserResponse
    redirect: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ProjectCreate(BaseModel):
    name: str
    designs: List[str] = []
    customizations: Dict[str, Any] = {}

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    customizations: Optional[Dict[str, Any]] = None
    html_code: Optional[str] = None

class IntegrationConfig(BaseModel):
    type: str
    provider: str
    api_key: Optional[str] = None
    settings: Dict[str, Any] = {}

class CreditPurchase(BaseModel):
    amount: int
    payment_method: str

class FileUploadResponse(BaseModel):
    success: bool
    file_url: str
    file_name: str
    file_size: int
    content_type: str
    message: str

class FileDeleteResponse(BaseModel):
    success: bool
    message: str

# ==================== Helper Functions ====================

def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user

# Override dependency for seed_integrations if available
try:
    if seed_integrations and hasattr(seed_integrations, 'get_current_user_placeholder'):
        app.dependency_overrides[seed_integrations.get_current_user_placeholder] = get_current_user
except:
    pass

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def deduct_credits(db: Session, user_id: str, amount: int) -> bool:
    """Deduct credits from user"""
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.credits_balance >= amount:
        try:
            # Try to create transaction record
            transaction = CreditTransaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                amount=-amount,
                type="usage",
                description="Website building usage"
            )
            db.add(transaction)
            user.credits_balance -= amount
            db.commit()
            db.refresh(user)
            return True
        except:
            # Fallback: just deduct credits
            user.credits_balance -= amount
            db.commit()
            return True
    return False

def add_credits(db: Session, user_id: str, amount: int, description: str = "Credit purchase"):
    """Add credits to user"""
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        try:
            transaction = CreditTransaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                amount=amount,
                type="purchase",
                description=description
            )
            db.add(transaction)
            user.credits_balance += amount
            db.commit()
            db.refresh(user)
            return True
        except:
            user.credits_balance += amount
            db.commit()
            return True
    return False

# ==================== Authentication Endpoints ====================

@app.post("/api/auth/signup", response_model=Token)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """User registration"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user = User(
        id=str(uuid.uuid4()),
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        credits_balance=50,
        subscription_tier="free",
        avatar_url=None
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "status": "success",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "credits": user.credits_balance,
            "created_at": user.created_at,
            "subscription_tier": user.subscription_tier,
            "avatar_url": user.avatar_url
        }
    }

@app.post("/api/auth/login", response_model=Token)
@limiter.limit("5 per minute")
async def login(request: Request, login_data: UserLogin, db: Session = Depends(get_db)):
    """User login with rate limiting"""
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.password_hash):
        logger.warning(f"Failed login attempt for email: {login_data.email}")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "status": "success",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "credits": user.credits_balance,
            "created_at": user.created_at.isoformat(),
            "subscription_tier": user.subscription_tier,
            "avatar_url": user.avatar_url
        },
        "redirect": "/dashboard"
    }

@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request password reset"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    reset_token = secrets.token_urlsafe(32)
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()
    
    logger.info(f"Password reset token for {user.email}: {reset_token}")
    
    return {"message": "Password reset email sent"}

@app.post("/api/auth/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password with token"""
    user = db.query(User).filter(
        User.password_reset_token == request.token,
        User.password_reset_expires > datetime.now(timezone.utc)
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    user.password_hash = hash_password(request.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    
    return {"message": "Password reset successfully"}

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "credits": current_user.credits_balance,
        "created_at": current_user.created_at,
        "subscription_tier": current_user.subscription_tier,
        "avatar_url": current_user.avatar_url
    }

@app.post("/api/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user"""
    return {"message": "Logged out successfully"}

@app.post("/api/auth/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh JWT token"""
    access_token = create_access_token(data={"sub": str(current_user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

# ==================== Credit Management Endpoints ====================

@app.get("/api/credits/balance")
async def get_credit_balance(current_user: User = Depends(get_current_user)):
    """Get user's credit balance"""
    return {
        "credits": current_user.credits_balance,
        "subscription_tier": current_user.subscription_tier
    }

@app.get("/api/credits/transactions")
async def get_credit_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's credit transaction history"""
    try:
        transactions = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == current_user.id
        ).order_by(desc(CreditTransaction.created_at)).all()
        
        # ✅ FIXED: Removed 'metadata' reference (was renamed to extra_data)
        return [
            {
                "id": str(tx.id),
                "amount": tx.amount,
                "type": tx.type,
                "description": tx.description,
                "created_at": tx.created_at
                # 'extra_data' is available but not returned here
            }
            for tx in transactions
        ]
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        return []

@app.post("/api/credits/purchase")
async def purchase_credits(
    purchase: CreditPurchase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Purchase credits"""
    credit_prices = {
        50: 2.99,
        100: 4.99,
        500: 19.99,
        1000: 34.99,
        5000: 149.99
    }
    
    package_price = None
    for credits, price in credit_prices.items():
        if purchase.amount <= credits:
            package_price = price
            break
    
    if not package_price:
        package_price = 299.99
    
    add_credits(db, str(current_user.id), purchase.amount, f"Purchase of {purchase.amount} credits")
    db.refresh(current_user)
    
    return {
        "success": True,
        "credits_added": purchase.amount,
        "total_credits": current_user.credits_balance,
        "amount_charged": package_price,
        "payment_method": purchase.payment_method
    }

# ==================== Project Management Endpoints ====================

@app.post("/api/projects")
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project"""
    if not deduct_credits(db, str(current_user.id), 1):
        raise HTTPException(status_code=402, detail="Insufficient credits")
    
    global_styles = project_data.customizations.get("styles", {}) if project_data.customizations else {}
    layout_config = project_data.customizations.get("layout", {}) if project_data.customizations else {}
    
    project = Project(
        id=str(uuid.uuid4()),
        name=project_data.name,
        user_id=current_user.id,
        global_styles=global_styles,
        layout_config=layout_config
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return {
        "id": str(project.id),
        "name": project.name,
        "designs": [],
        "customizations": {
            "styles": project.global_styles,
            "layout": project.layout_config
        },
        "html_code": project.html_code,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "user_id": str(project.user_id),
        "published_url": project.published_url
    }

@app.get("/api/projects")
async def get_user_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all projects for current user"""
    projects = db.query(Project).filter(
        Project.user_id == current_user.id
    ).order_by(desc(Project.updated_at)).all()
    
    result = []
    for project in projects:
        result.append({
            "id": str(project.id),
            "name": project.name,
            "designs": [],
            "customizations": {
                "styles": project.global_styles,
                "layout": project.layout_config
            },
            "html_code": project.html_code,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "user_id": str(project.user_id),
            "published_url": project.published_url
        })
    
    return result

@app.get("/api/projects/{project_id}")
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if str(project.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "id": str(project.id),
        "name": project.name,
        "designs": [],
        "customizations": {
            "styles": project.global_styles,
            "layout": project.layout_config
        },
        "html_code": project.html_code,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "user_id": str(project.user_id),
        "published_url": project.published_url
    }

@app.put("/api/projects/{project_id}")
async def update_project(
    project_id: str,
    updates: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if str(project.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if updates.name:
        project.name = updates.name
    if updates.customizations:
        project.global_styles = updates.customizations.get("styles", project.global_styles)
        project.layout_config = updates.customizations.get("layout", project.layout_config)
    if updates.html_code:
        project.html_code = updates.html_code
    
    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(project)
    
    return {
        "id": str(project.id),
        "name": project.name,
        "designs": [],
        "customizations": {
            "styles": project.global_styles,
            "layout": project.layout_config
        },
        "html_code": project.html_code,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "user_id": str(project.user_id),
        "published_url": project.published_url
    }

@app.delete("/api/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if str(project.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}

# ==================== GCS File Upload Endpoints ====================

@app.post("/api/upload", response_model=FileUploadResponse)
@limiter.limit("20/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    folder: str = Form("uploads"),
    current_user: User = Depends(get_current_user)
):
    """Upload a file to Google Cloud Storage"""
    try:
        # Validate file size (max 10MB)
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else f"{uuid.uuid4()}"
        
        # Build the full path
        blob_path = f"{folder}/{current_user.id}/{unique_filename}" if folder else f"{current_user.id}/{unique_filename}"
        
        # Upload to GCS
        public_url = upload_file_to_gcs(file, blob_path)
        
        return FileUploadResponse(
            success=True,
            file_url=public_url,
            file_name=file.filename,
            file_size=file_size,
            content_type=file.content_type or "application/octet-stream",
            message="File uploaded successfully"
        )
        
    except NotImplementedError as e:
        logger.error(f"Storage not configured: {str(e)}")
        raise HTTPException(status_code=503, detail="Storage service is not configured")
    except ValueError as e:
        logger.error(f"GCS configuration error: {str(e)}")
        raise HTTPException(status_code=503, detail="Storage service is not configured properly")
    except Exception as e:
        logger.error(f"File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@app.post("/api/upload/avatar")
@limiter.limit("10/minute")
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a user avatar image to GCS"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed"
        )
    
    # Validate file size (max 5MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Avatar too large. Maximum size is 5MB")
    
    try:
        # Generate filename for avatar
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"avatar_{current_user.id}.{file_extension}"
        
        # Store in a dedicated avatars folder
        blob_path = f"avatars/{current_user.id}/{unique_filename}"
        
        # Upload to GCS
        public_url = upload_file_to_gcs(file, blob_path)
        
        # Update user's avatar URL in database
        current_user.avatar_url = public_url
        db.commit()
        
        return {
            "success": True,
            "avatar_url": public_url,
            "message": "Avatar uploaded successfully"
        }
        
    except NotImplementedError as e:
        logger.error(f"Storage not configured: {str(e)}")
        raise HTTPException(status_code=503, detail="Storage service is not configured")
    except ValueError as e:
        logger.error(f"GCS configuration error: {str(e)}")
        raise HTTPException(status_code=503, detail="Storage service is not configured properly")
    except Exception as e:
        logger.error(f"Avatar upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")

@app.post("/api/upload/website-assets")
@limiter.limit("30/minute")
async def upload_website_assets(
    request: Request,
    files: List[UploadFile] = File(...),
    project_id: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload multiple website assets to GCS for a project"""
    # Verify project belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    uploaded_files = []
    errors = []
    
    for file in files:
        try:
            # Validate file size (max 10MB per file)
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)
            
            if file_size > 10 * 1024 * 1024:
                errors.append(f"{file.filename}: File too large (max 10MB)")
                continue
            
            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
            unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else f"{uuid.uuid4()}"
            
            # Store in project-specific folder
            blob_path = f"projects/{project_id}/assets/{unique_filename}"
            
            # Upload to GCS
            public_url = upload_file_to_gcs(file, blob_path)
            
            uploaded_files.append({
                "original_name": file.filename,
                "url": public_url,
                "size": file_size,
                "content_type": file.content_type,
                "path": blob_path
            })
            
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
    
    return {
        "success": True,
        "uploaded": uploaded_files,
        "errors": errors if errors else None,
        "total": len(files),
        "uploaded_count": len(uploaded_files)
    }

@app.delete("/api/upload/{file_path:path}")
async def delete_uploaded_file(
    file_path: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file from Google Cloud Storage"""
    try:
        # Security: Ensure the file belongs to the user
        if not file_path.startswith(f"uploads/{current_user.id}/") and \
           not file_path.startswith(f"avatars/{current_user.id}/") and \
           not file_path.startswith(f"projects/"):
            raise HTTPException(status_code=403, detail="You don't have permission to delete this file")
        
        # If it's a project file, verify project ownership
        if file_path.startswith("projects/"):
            parts = file_path.split('/')
            if len(parts) >= 3:
                project_id = parts[1]
                project = db.query(Project).filter(
                    Project.id == project_id,
                    Project.user_id == current_user.id
                ).first()
                if not project:
                    raise HTTPException(status_code=403, detail="You don't have permission to delete this file")
        
        # Delete from GCS
        delete_file_from_gcs(file_path)
        
        return FileDeleteResponse(
            success=True,
            message="File deleted successfully"
        )
        
    except NotImplementedError as e:
        logger.error(f"Storage not configured: {str(e)}")
        raise HTTPException(status_code=503, detail="Storage service is not configured")
    except ValueError as e:
        logger.error(f"GCS configuration error: {str(e)}")
        raise HTTPException(status_code=503, detail="Storage service is not configured properly")
    except Exception as e:
        logger.error(f"File delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@app.get("/api/upload/list")
async def list_user_files(
    folder: str = Query("uploads", description="Folder to list files from"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files uploaded by the current user"""
    try:
        from google.cloud import storage
        
        client = get_gcs_client()
        bucket_name = os.getenv("GCP_BUCKET_NAME")
        
        if not bucket_name:
            raise HTTPException(status_code=503, detail="Storage bucket not configured")
        
        bucket = client.bucket(bucket_name)
        
        # List blobs in the user's folder
        prefix = f"{folder}/{current_user.id}/"
        blobs = bucket.list_blobs(prefix=prefix)
        
        files = []
        for blob in blobs:
            files.append({
                "name": blob.name.split('/')[-1],
                "path": blob.name,
                "size": blob.size,
                "updated": blob.updated.isoformat() if blob.updated else None,
                "url": f"https://storage.googleapis.com/{bucket_name}/{blob.name}",
                "content_type": blob.content_type
            })
        
        return {
            "success": True,
            "folder": folder,
            "files": files,
            "count": len(files)
        }
        
    except NotImplementedError as e:
        logger.error(f"Storage not configured: {str(e)}")
        raise HTTPException(status_code=503, detail="Storage service is not configured")
    except ValueError as e:
        logger.error(f"GCS configuration error: {str(e)}")
        raise HTTPException(status_code=503, detail="Storage service is not configured properly")
    except Exception as e:
        logger.error(f"List files error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

# ==================== Run the app ====================

if __name__ == "__main__":
    import uvicorn
    #http://35.230.74.10:0
    # Get Render's PORT (or fallback for local development)
    port = int(os.getenv("PORT", "0"))
    host = os.getenv("HOST", "35.230.74.10")
    
    # Check if running on Render
    is_render = os.getenv("RENDER", "false").lower() == "true"
    
    logger.info(f"Starting server on {host}:{port}")
    logger.info(f"Running on Render: {is_render}")
    logger.info(f"Environment: {'production' if is_render else 'development'}")
    
    # Run with Uvicorn - configured for Render
    uvicorn.run(
        "app:app",  # Must use string format for Render compatibility
        host=host,
        port=port,
        log_level="info",
        reload=not is_render,  # Only reload in development
        access_log=True
    )
