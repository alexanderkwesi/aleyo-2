# app.py - Complete GCS Storage Integration with Database
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect, Depends, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, timedelta
from flask import views
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

# Import routers
from seed_integrations import router as integrations_router
import seed_integrations
from pricing import router as pricing_router

# Import database utilities
from database import get_db, init_db

# Import models
from models import (
    User, Project, CreditTransaction, Integration, 
    Design, Template, Component, AnalyticsEvent, Slug, project_designs,
    Tutorial, TutorialCompletion, UserTutorialProgress, 
    TutorialView, TutorialComment, TutorialLike, TutorialBookmark,
    TutorialCategory as TutorialCategoryModel, TutorialTag, TutorialTagMapping,
)

# ==================== Import Storage ====================
from storage import upload_file_to_gcs, delete_file_from_gcs, get_gcs_client

# ==================== App Initialization ====================

app = FastAPI(title="Aleyo AI Website Builder API")

# Setup logging
logger = logging.getLogger(__name__)

# ==================== Rate Limiting ====================

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Login attempts exceeded. Please try again later."})

# ==================== Security ====================

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# ==================== Anthropic Configuration ====================
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229")
anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
if not anthropic_client:
    logging.getLogger(__name__).warning(
        "ANTHROPIC_API_KEY is not set - /api/ai/voice-command will return 503 until it is configured."
    )

# ==================== CORS Configuration ====================

ALLOWED_ORIGINS = [
    "http://127.0.0.1:4000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://localhost:3001",
    "*",
]

_frontend_url = os.getenv("FRONTEND_URL", "")
if _frontend_url:
    ALLOWED_ORIGINS.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Include Routers ====================

app.include_router(integrations_router, prefix="/api")
app.include_router(pricing_router, prefix="/api")

# ==================== Startup Event ====================

@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("Application started successfully")

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

class DesignComponentModel(BaseModel):
    id: str
    type: str
    styles: Dict[str, Any]
    content: Dict[str, Any]

class DesignTemplateModel(BaseModel):
    id: str
    name: str
    category: str
    layout: Dict[str, Any]
    styles: Dict[str, Any]
    components: List[DesignComponentModel]

class WebsiteProject(BaseModel):
    id: str
    name: str
    designs: List[str]
    customizations: Dict[str, Any]
    html_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_id: str
    published_url: Optional[str] = None
    
class WebsitePublishRequest(BaseModel):
    id: str
    name: str
    slug: str
    components: List[Dict[str, Any]] = []
    textElements: List[Dict[str, Any]] = []
    imageElements: List[Dict[str, Any]] = []
    uploadedImages: List[Dict[str, Any]] = []
    styles: Dict[str, Any] = {}
    lastEdited: str
    type: str = "custom"
    status: str = "published"
    publishedAt: str
    publishedUrl: str

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

class IntegrationConnectRequest(BaseModel):
    project_id: str
    config_data: Dict[str, Any] = {}

class VoiceCommandRequest(BaseModel):
    command: str
    context: Optional[str] = "home"
    studio_state: Optional[Dict[str, Any]] = None

class VoiceCommandResponse(BaseModel):
    reply: str
    action: Optional[Dict[str, Any]] = None
    transform: Optional[Dict[str, Any]] = None
    
# ==================== Tutorial Models ====================

class TutorialCategory(str, Enum):
    BEGINNER = "beginner"
    DESIGN = "design"
    ADVANCED = "advanced"
    SEO = "seo"
    ECOMMERCE = "ecommerce"
    PERFORMANCE = "performance"
    AI = "ai"
    INTEGRATIONS = "integrations"
    MARKETING = "marketing"
    ANALYTICS = "analytics"

class TutorialLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    EXPERT = "Expert"

class TutorialStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class TutorialBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: TutorialCategory
    level: TutorialLevel = TutorialLevel.BEGINNER
    duration: Optional[str] = None
    duration_seconds: int = 0
    rating: float = 4.5
    views: int = 0
    likes: int = 0
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    video_embed_code: Optional[str] = None
    video_file_path: Optional[str] = None
    sections: List[Dict[str, Any]] = []
    icon: str = "PlayCircle"
    tags: List[str] = []
    prerequisites: List[str] = []
    is_premium: bool = False
    status: TutorialStatus = TutorialStatus.PUBLISHED
    created_by: Optional[str] = None

class TutorialCreate(TutorialBase):
    pass

class TutorialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TutorialCategory] = None
    level: Optional[TutorialLevel] = None
    duration: Optional[str] = None
    duration_seconds: Optional[int] = None
    rating: Optional[float] = None
    views: Optional[int] = None
    likes: Optional[int] = None
    thumbnail_url: Optional[str] = None
    video_url: Optional[str] = None
    video_embed_code: Optional[str] = None
    video_file_path: Optional[str] = None
    sections: Optional[List[Dict[str, Any]]] = None
    icon: Optional[str] = None
    tags: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    is_premium: Optional[bool] = None
    status: Optional[TutorialStatus] = None

class TutorialResponse(TutorialBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TutorialCompletionBase(BaseModel):
    tutorial_id: str
    user_id: str

class TutorialCompletionCreate(TutorialCompletionBase):
    pass

class TutorialCompletionResponse(TutorialCompletionBase):
    id: str
    completed_at: datetime
    
    class Config:
        from_attributes = True

class UserTutorialProgressBase(BaseModel):
    tutorial_id: str
    user_id: str
    current_section: int = 0
    completed_sections: List[int] = []
    progress_percentage: int = 0
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class UserTutorialProgressCreate(UserTutorialProgressBase):
    pass

class UserTutorialProgressUpdate(BaseModel):
    current_section: Optional[int] = None
    completed_sections: Optional[List[int]] = None
    progress_percentage: Optional[int] = None
    completed_at: Optional[datetime] = None

class TutorialProgressUpdate(BaseModel):
    current_section: int = 0
    completed_sections: List[int] = []
    progress_percentage: int = 0

class UserTutorialProgressResponse(UserTutorialProgressBase):
    id: str
    last_watched_at: datetime
    
    class Config:
        from_attributes = True

class TutorialViewBase(BaseModel):
    tutorial_id: str
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    duration_watched: int = 0

class TutorialViewCreate(TutorialViewBase):
    pass

class TutorialViewResponse(TutorialViewBase):
    id: str
    viewed_at: datetime
    
    class Config:
        from_attributes = True

class TutorialCommentBase(BaseModel):
    tutorial_id: str
    user_id: str
    content: str

class TutorialCommentCreate(TutorialCommentBase):
    pass

class TutorialCommentUpdate(BaseModel):
    content: str

class TutorialCommentResponse(TutorialCommentBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TutorialLikeBase(BaseModel):
    tutorial_id: str
    user_id: str
    liked: bool = True

class TutorialLikeCreate(TutorialLikeBase):
    pass

class TutorialLikeResponse(TutorialLikeBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TutorialBookmarkBase(BaseModel):
    tutorial_id: str
    user_id: str

class TutorialBookmarkCreate(TutorialBookmarkBase):
    pass

class TutorialBookmarkResponse(TutorialBookmarkBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TutorialCategoryModelBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    icon: str = "VideoLibrary"
    color: str = "#4F6EF7"
    sort_order: int = 0
    is_active: bool = True

class TutorialCategoryModelCreate(TutorialCategoryModelBase):
    pass

class TutorialCategoryModelUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class TutorialCategoryModelResponse(TutorialCategoryModelBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class TutorialTagBase(BaseModel):
    name: str
    slug: str

class TutorialTagCreate(TutorialTagBase):
    pass

class TutorialTagResponse(TutorialTagBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TutorialTagMappingBase(BaseModel):
    tutorial_id: str
    tag_id: str

class TutorialTagMappingCreate(TutorialTagMappingBase):
    pass

class TutorialTagMappingResponse(TutorialTagMappingBase):
    id: str
    
    class Config:
        from_attributes = True

# ==================== File Upload Models ====================

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

# ==================== Database File Tracking Model ====================

class UploadedFile(BaseModel):
    id: str
    user_id: str
    project_id: Optional[str] = None
    file_name: str
    file_url: str
    file_path: str
    file_size: int
    content_type: str
    created_at: datetime

# ==================== Helper Functions ====================

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
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

app.dependency_overrides[seed_integrations.get_current_user_placeholder] = get_current_user

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def deduct_credits(db: Session, user_id: str, amount: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.credits_balance >= amount:
        transaction = CreditTransaction(
            user_id=user_id,
            amount=-amount,
            type="usage",
            description="Website building usage"
        )
        db.add(transaction)
        db.commit()
        db.refresh(user)
        return True
    return False

def add_credits(db: Session, user_id: str, amount: int, description: str = "Credit purchase"):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        transaction = CreditTransaction(
            user_id=user_id,
            amount=amount,
            type="purchase",
            description=description
        )
        db.add(transaction)
        db.commit()
        db.refresh(user)
        return True
    return False

def generate_html_from_designs(designs: List[Dict], customizations: Dict, project_name: str) -> str:
    """Generate HTML from merged designs"""
    merged_styles = {}
    merged_components = []
    
    for design in designs:
        for key, value in design.get("styles", {}).items():
            merged_styles[key] = value
        merged_components.extend(design.get("components", []))
    
    if customizations and "styles" in customizations:
        merged_styles.update(customizations["styles"])
    
    components_html = ""
    for component in merged_components:
        components_html += generate_component_html(component, merged_styles)
    
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{project_name}</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: {merged_styles.get('font_family', 'Inter, sans-serif')};
                background: {merged_styles.get('background_color', '#0F172A')};
                color: {merged_styles.get('text_color', '#FFFFFF')};
            }}
            
            .container {{
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }}
            
            .hero {{
                background: linear-gradient(135deg, {merged_styles.get('primary_color', '#3B82F6')}, {merged_styles.get('secondary_color', '#10B981')});
                padding: 80px 20px;
                text-align: center;
                border-radius: {merged_styles.get('border_radius', '8px')};
            }}
            
            button {{
                background: {merged_styles.get('primary_color', '#3B82F6')};
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: {merged_styles.get('border_radius', '8px')};
                cursor: pointer;
                font-size: 16px;
            }}
            
            button:hover {{
                opacity: 0.9;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            {components_html}
        </div>
        <script>
            console.log('Website built with Aleyo AI Website Builder');
        </script>
    </body>
    </html>
    """

def generate_component_html(component: Dict, styles: Dict) -> str:
    comp_type = component.get("type", "")
    content = component.get("content", {})
    
    if comp_type == "hero":
        return f"""
        <div class="hero">
            <h1>{content.get('title', 'Welcome to Your Website')}</h1>
            <p>{content.get('subtitle', 'Create something amazing')}</p>
            <button>{content.get('buttonText', 'Get Started')}</button>
        </div>
        """
    
    return ""

def generate_integration_code(config: IntegrationConfig) -> str:
    if config.type == "forms":
        if config.provider == "formspree":
            return f"""
            <form action="https://formspree.io/f/{config.api_key}" method="POST">
                <input type="email" name="email" placeholder="Your email" required>
                <textarea name="message" placeholder="Your message" required></textarea>
                <button type="submit">Send Message</button>
            </form>
            """
    
    elif config.type == "payment":
        if config.provider == "stripe":
            return f"""
            <script src="https://js.stripe.com/v3/"></script>
            <div id="payment-element"></div>
            <button id="payment-button">Pay Now</button>
            <script>
                const stripe = Stripe('{config.api_key}');
            </script>
            """
    
    elif config.type == "email":
        if config.provider == "mailchimp":
            dc = config.settings.get('dc', 'usX')
            return f"""
            <div id="mc_embed_signup">
                <form action="https://{dc}.list-manage.com/subscribe/post" method="POST">
                    <input type="email" name="EMAIL" placeholder="Subscribe to newsletter" required>
                    <button type="submit">Subscribe</button>
                </form>
            </div>
            """
    
    elif config.type == "calendar":
        if config.provider == "calendly":
            username = config.settings.get('username', '')
            return f"""
            <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
            <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>
            <div class="calendly-inline-widget" data-url="https://calendly.com/{username}" style="min-width:320px;height:630px;"></div>
            """
    
    elif config.type == "ads":
        if config.provider == "google_ads":
            return f"""
            <script async src="https://www.googletagmanager.com/gtag/js?id={config.api_key}"></script>
            <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){{dataLayer.push(arguments);}}
                gtag('js', new Date());
                gtag('config', '{config.api_key}');
            </script>
            """
        elif config.provider == "meta_ads":
            return f"""
            <script>
                !function(f,b,e,v,n,t,s)
                {{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)}};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '{config.api_key}');
                fbq('track', 'PageView');
            </script>
            """
    
    return "<!-- Integration code not available -->"

# ==================== Authentication Endpoints ====================

@app.post("/api/auth/signup", response_model=Token)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

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
    return {"message": "Logged out successfully"}

@app.post("/api/auth/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    access_token = create_access_token(data={"sub": str(current_user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

# ==================== Credit Management Endpoints ====================

@app.get("/api/credits/balance")
async def get_credit_balance(current_user: User = Depends(get_current_user)):
    return {
        "credits": current_user.credits_balance,
        "subscription_tier": current_user.subscription_tier
    }

@app.get("/api/credits/transactions")
async def get_credit_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == current_user.id
    ).order_by(desc(CreditTransaction.created_at)).all()
    
    return [
        {
            "id": str(tx.id),
            "amount": tx.amount,
            "type": tx.type,
            "description": tx.description,
            "created_at": tx.created_at
        }
        for tx in transactions
    ]

@app.post("/api/credits/purchase")
async def purchase_credits(
    purchase: CreditPurchase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

# ==================== GCS File Upload Endpoints ====================

@app.post("/api/upload", response_model=FileUploadResponse)
@limiter.limit("20/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    folder: str = Form("uploads"),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file to Google Cloud Storage
    
    - **file**: The file to upload
    - **folder**: Optional folder path (default: "uploads")
    
    Returns the public URL of the uploaded file
    """
    try:
        # Validate file size (max 10MB)
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else f"{uuid.uuid4()}"
        
        # Build the full path
        blob_path = f"{folder}/{current_user.id}/{unique_filename}" if folder else f"{current_user.id}/{unique_filename}"
        
        # Upload to GCS
        public_url = upload_file_to_gcs(file, blob_path)
        
        # Save to database (if you have a File model, you can create it here)
        # file_record = File(
        #     id=str(uuid.uuid4()),
        #     user_id=current_user.id,
        #     file_name=file.filename,
        #     file_url=public_url,
        #     file_path=blob_path,
        #     file_size=file_size,
        #     content_type=file.content_type or "application/octet-stream"
        # )
        # db.add(file_record)
        # db.commit()
        
        return FileUploadResponse(
            success=True,
            file_url=public_url,
            file_name=file.filename,
            file_size=file_size,
            content_type=file.content_type or "application/octet-stream",
            message="File uploaded successfully"
        )
        
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
    """
    Upload a user avatar image to GCS
    
    - **file**: Image file (jpg, png, gif, webp)
    
    Returns the public URL of the uploaded avatar
    """
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
    
    if file_size > 5 * 1024 * 1024:  # 5MB
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
    """
    Upload multiple website assets to GCS for a project
    
    - **files**: List of files to upload
    - **project_id**: The project ID these assets belong to
    
    Returns a list of uploaded file URLs
    """
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
    """
    Delete a file from Google Cloud Storage
    
    - **file_path**: The full blob path (e.g., "uploads/user_id/filename.jpg")
    """
    try:
        # Security: Ensure the file belongs to the user (check path)
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
    """
    List all files uploaded by the current user in a specific folder
    
    - **folder**: The folder to list (default: "uploads")
    """
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
        
    except ValueError as e:
        logger.error(f"GCS configuration error: {str(e)}")
        raise HTTPException(status_code=503, detail="Storage service is not configured properly")
    except Exception as e:
        logger.error(f"List files error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

# ==================== Project Management Endpoints ====================

@app.post("/api/projects")
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    
    for design_id in project_data.designs:
        stmt = project_designs.insert().values(
            project_id=project.id,
            design_id=design_id,
            merged_order=0
        )
        db.execute(stmt)
    
    db.commit()
    
    result = db.execute(
        project_designs.select().where(project_designs.c.project_id == project.id)
    )
    design_ids = [row.design_id for row in result]
    
    return {
        "id": str(project.id),
        "name": project.name,
        "designs": design_ids,
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
    projects = db.query(Project).filter(
        Project.user_id == current_user.id
    ).order_by(desc(Project.updated_at)).all()
    
    result = []
    for project in projects:
        result_designs = db.execute(
            project_designs.select().where(project_designs.c.project_id == project.id)
        )
        design_ids = [row.design_id for row in result_designs]
        
        result.append({
            "id": str(project.id),
            "name": project.name,
            "designs": design_ids,
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
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if str(project.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = db.execute(
        project_designs.select().where(project_designs.c.project_id == project.id)
    )
    design_ids = [row.design_id for row in result]
    
    return {
        "id": str(project.id),
        "name": project.name,
        "designs": design_ids,
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
    
    result = db.execute(
        project_designs.select().where(project_designs.c.project_id == project.id)
    )
    design_ids = [row.design_id for row in result]
    
    return {
        "id": str(project.id),
        "name": project.name,
        "designs": design_ids,
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
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if str(project.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}

# ==================== Missing Helper Functions for AI Generation ====================

def generate_features_component() -> str:
    """Generate a features component for the website"""
    return '''import React from 'react';

const Features = () => {
  const features = [
    {
      icon: "🚀",
      title: "Fast Performance",
      description: "Optimized for speed and performance"
    },
    {
      icon: "🎨",
      title: "Beautiful Design",
      description: "Modern and responsive design"
    },
    {
      icon: "🔒",
      title: "Secure",
      description: "Built with security in mind"
    }
  ];

  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          <span className="gradient-text">Features</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-[#1A2332]/50 p-6 rounded-xl border border-white/5 hover:border-[#4F6EF7]/30 transition-all hover:transform hover:scale-105"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
'''

def generate_contact_component() -> str:
    """Generate a contact component for the website"""
    return '''import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <section id="contact" className="py-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          <span className="gradient-text">Get In Touch</span>
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1A2332] border border-white/10 rounded-lg focus:outline-none focus:border-[#4F6EF7] text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1A2332] border border-white/10 rounded-lg focus:outline-none focus:border-[#4F6EF7] text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1A2332] border border-white/10 rounded-lg focus:outline-none focus:border-[#4F6EF7] text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#4F6EF7] to-[#2DBCB6] text-white rounded-lg font-medium hover:opacity-90 transition-all"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
'''

# ==================== Run the app ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3001, log_level="info")
