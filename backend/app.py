# app.py - Updated with GCS Storage Integration
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

# Import routers - FIXED: Only import the router from seed_integrations
from seed_integrations import router as integrations_router

import seed_integrations


from pricing import router as pricing_router

# Import database utilities
# app.py - At the top, after all imports
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


GCP_SERVICE_ACCOUNT_KEY="{
  "type": "service_account",
  "project_id": "aleyo-501110",
  "private_key_id": "e820ce748733453fbe6dfa172136e4be7d2d9b8d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDY5Eobcdk9SSDJ\nxIrFKGjbqZvknaiHmhqDRAISErPNJbno3zgKm7QVlHuOobW7ZqIg9X5tk2RuhEkl\nAeDqY06g9s0at0udNLIXCDp9Ht5KPqU4D4kWOkjFEDG+fbjrBvrPim+gBMzJZ3qm\nhWyGXVYTztVua8CL3DEriGbZREv0nBPciCreTF5VahOKs1JoGBxUVcok+yq7VQtq\nz7ca8SNEUHKtfmw/1kigIXUZCfs/JabBztZuez7x6mUWTVMl23YJTBKsu/EpFUrr\nm2xZ8lWKQCBR1/v6kzarjazUORFJb/urKYZXJbxIim+R6U14cvC/8phNhubOAM94\nA9zvA3UVAgMBAAECggEABASYpdus/KsT5ID+WXWB7x3RgZb1G2FSCpVSMipZXTHM\nzkus/Vn8kvtvnYkRNYygG3BeJvgDH96rVI2YGyd7T6qQH/r+IjEAIpftrh80sCyV\nwXfc4DCfY/0vOrpCrcybjV2LwKu4wntnBNo1vuMlmCjYVdsWU6ZLh+UB6MD7Oj0N\njEBtIZEjfqVf71aSSMKBGIQVuZTPTuHM6P+PFCVejq95/sgCMdVNX6kGwnkgL+9Q\nvgkprcIpsAtFUzqaIjEENwAJy340LS+7YsqJwW5uZF2ZikBp945CRYQyfUQK/AGx\nC33DIynmeS5t36XCNkUycTbgZmxSMi7KBd9pLZotGQKBgQD6jD769YG8mQ0A3dhl\nxnEJZDI2i49qdYJt7WNjnrwo1EoBE3v8QS6VsAC+iuyxNUXURuId9YsyMTeAEacb\nYuPCTB/7KeHHIukLBXtPLhpXV0j+H3FNQMdELcej4/DabdB+VJnumWvTdRMT8bfX\nNzLx3LehiqI3LbqfCoyctVVK/QKBgQDdnI1IuMgopJTl9qMFX2ZV7yJrM9CZl6pr\njxJO8ZQM281MUCfMt9MlG7nvtysMj3zkYb9AvSYTfeIIEs9LQb/3occLv8pm4UY5\nAYkYGXoptsV2C2bmZhvCLohOCaqLb9rM4ZMz80bAcmvoQJf4CERcfg5uV8P+0fy7\nWW4+V6cp+QKBgQCBSzaFE4Sr6t+G/vTZMJrMmeQ/ua185r80MzkDA7td5o96Fq/4\n8To1DOqVaePTXwZ2EU5G35vBfxyA/psZyuJ2Ngqa9nYI6b8RbPbBWa1GPUjxuxAh\nKbirOmS38r0sO1dImigFtS6rpNL/i9GvQlEL9zbcKkqj5vlTcYI2rG0jkQKBgQCY\n4hOmA7QyNbhzHT9ByZqz1hGMm2ZhT3xGT6F1zLsyU8DB0NpkJL0JcKNJeLe+Jo8m\njzh91P+bmtCAeVmAtY9VqsnClUFw0CC92w1VDt50QJ7g3OTUNcUYpTlrfMenAjeT\n+FqxEDfTNBy1UTqF5k4i8OPLw8h21y7foMapQ5cTIQKBgQDHygovIgSUWtL/tdML\nA0nQ7VCcCeWm3TtuTwKXr1+DouLh4++7zcAnC/GWn/UChdseo58dmHYNasgSmKEf\nBexgvXo5Yjw8rXrEKqVWeOiBcdaH1gC3tGtXaPReqRV0wKPRrv82LwIh72De0O5a\nf8/k3pJF3MqSW3NeOdjdTMbzjg==\n-----END PRIVATE KEY-----\n",
  "client_email": "render-backend-service@aleyo-501110.iam.gserviceaccount.com",
  "client_id": "115258360679518454694",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/render-backend-service%40aleyo-501110.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
"
GCP_BUCKET_NAME="aleyo_bucket"

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
import os

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229")  # ✅ Correct
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
    "http://localhost:3001","*",
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

app.include_router(pricing_router, prefix="/api")  # ✅ Corrected prefix for pricing routes

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

# Enums as Python Enums
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

# Base Pydantic Models
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

# Tutorial Completion Models
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

# User Progress Models
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

# ADD THIS MISSING MODEL - The tutorial endpoints expect this
class TutorialProgressUpdate(BaseModel):
    current_section: int = 0
    completed_sections: List[int] = []
    progress_percentage: int = 0

class UserTutorialProgressResponse(UserTutorialProgressBase):
    id: str
    last_watched_at: datetime
    
    class Config:
        from_attributes = True

# Tutorial View Models
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

# Comment Models
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

# Like Models
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

# Bookmark Models
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

# Category Models
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

# Tag Models
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

# Tag Mapping Models
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

# Wire up real auth for the integrations router now that get_current_user is defined.
# seed_integrations.py uses a placeholder dependency (get_current_user_placeholder) on its
# routes precisely because it's imported before get_current_user exists; dependency_overrides
# swaps it in per-request, correctly resolving get_current_user's own sub-dependencies
# (security, get_db) without needing a circular import.
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
        subscription_tier="free"
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
            "subscription_tier": user.subscription_tier
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
            "subscription_tier": user.subscription_tier
        },
        "redirect": "/dashboard"
    }

# app.py - Modify the forgot_password endpoint (line ~410)
@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    reset_token = secrets.token_urlsafe(32)
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()
    
    # In production, send this via email
    # For development, log it
    logger.info(f"Password reset token for {user.email}: {reset_token}")
    
    # ⚠️ REMOVE the reset_token from the response
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
        "subscription_tier": current_user.subscription_tier
    }

@app.post("/api/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}

@app.post("/api/auth/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Re-issue an access token for an already-authenticated user, extending
    their session. Requires the still-valid (not-yet-expired) current token
    as a Bearer credential, since get_current_user is what identifies the user."""
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

# ==================== File Upload Endpoints ====================

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
    Upload a user avatar image
    
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
    Upload multiple website assets (images, CSS, JS) for a project
    
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
                "content_type": file.content_type
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

@app.post("/api/projects/{project_id}/publish")
async def publish_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if str(project.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not deduct_credits(db, str(current_user.id), 5):
        raise HTTPException(status_code=402, detail="Insufficient credits to publish")
    
    slug = re.sub(r'[^a-z0-9-]', '', project.name.lower().replace(' ', '-'))
    if not slug:
        slug = f"project-{project.id[:8]}"
    
    base_slug = slug
    counter = 1
    while True:
        existing_slug = db.query(Slug).filter(Slug.slug == slug).first()
        if existing_slug:
            slug = f"{base_slug}-{counter}"
            counter += 1
            continue
        
        existing_project = db.query(Project).filter(
            Project.published_url.like(f"%/p/{slug}%")
        ).first()
        if existing_project and existing_project.id != project.id:
            slug = f"{base_slug}-{counter}"
            counter += 1
            continue
        
        break
    
    publish_url = f"{os.getenv('FRONTEND_URL', 'https://aleyo.app')}/p/{slug}"
    project.published_url = publish_url
    project.published_at = datetime.now(timezone.utc)
    project.updated_at = datetime.now(timezone.utc)
    
    slug_entry = db.query(Slug).filter(Slug.project_id == project.id).first()
    if slug_entry:
        slug_entry.slug = slug
    else:
        slug_entry = Slug(slug=slug, project_id=project.id)
        db.add(slug_entry)
    
    db.commit()
    
    return {
        "success": True,
        "published_url": publish_url,
        "slug": slug,
        "message": "Website published successfully"
    }

@app.post("/api/projects/{project_id}/generate")
async def generate_website_code(
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
    
    designs = []
    for design_id in design_ids:
        design = db.query(Design).filter(Design.id == design_id).first()
        if design:
            components = db.query(Component).filter(
                Component.design_id == design.id
            ).order_by(Component.order).all()
            
            designs.append({
                "id": design.id,
                "name": design.name,
                "category": design.category,
                "layout": design.layout,
                "styles": design.styles,
                "components": [
                    {
                        "id": comp.id,
                        "type": comp.type,
                        "styles": comp.styles,
                        "content": comp.content
                    }
                    for comp in components
                ]
            })
    
    customizations = {
        "styles": project.global_styles or {},
        "layout": project.layout_config or {}
    }
    
    html_code = generate_html_from_designs(designs, customizations, project.name)
    project.html_code = html_code
    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"html_code": html_code}

@app.post("/api/websites/publish")
async def publish_website(
    website_data: WebsitePublishRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        project = db.query(Project).filter(Project.id == website_data.id).first()
        
        customizations = {
            "components": website_data.components,
            "textElements": website_data.textElements,
            "imageElements": website_data.imageElements,
            "uploadedImages": website_data.uploadedImages,
            "styles": website_data.styles,
            "publishedAt": website_data.publishedAt,
        }
        
        if project:
            project.name = website_data.name
            project.global_styles = website_data.styles
            project.html_code = generate_html_from_designs([], customizations, website_data.name)
            project.published_url = website_data.publishedUrl
            project.published_at = datetime.now(timezone.utc)
            project.updated_at = datetime.now(timezone.utc)
        else:
            project = Project(
                id=website_data.id,
                name=website_data.name,
                user_id=current_user.id,
                global_styles=website_data.styles,
                html_code=generate_html_from_designs([], customizations, website_data.name),
                published_url=website_data.publishedUrl,
                published_at=datetime.now(timezone.utc)
            )
            db.add(project)
        
        slug = website_data.slug
        if not slug:
            slug = re.sub(r'[^a-z0-9-]', '', website_data.name.lower().replace(' ', '-'))
        
        base_slug = slug
        counter = 1
        while True:
            existing_slug = db.query(Slug).filter(Slug.slug == slug).first()
            if existing_slug and existing_slug.project_id != project.id:
                slug = f"{base_slug}-{counter}"
                counter += 1
                continue
            break
        
        slug_entry = db.query(Slug).filter(Slug.project_id == project.id).first()
        if slug_entry:
            slug_entry.slug = slug
        else:
            slug_entry = Slug(slug=slug, project_id=project.id)
            db.add(slug_entry)
        
        db.commit()
        db.refresh(project)
        
        return {
            "success": True,
            "project_id": str(project.id),
            "published_url": project.published_url,
            "message": "Website published successfully"
        }
        
    except Exception as e:
        logger.error(f"Error publishing website: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/websites/check-slug")
async def check_slug_uniqueness(
    slug: str = Query(..., min_length=3, max_length=50, regex="^[a-z0-9-]+$"),
    exclude_id: Optional[str] = Query(None, description="Project ID to exclude from check"),
    db: Session = Depends(get_db)
):
    if not re.match(r'^[a-z0-9-]+$', slug):
        return {"isUnique": False, "message": "Slug can only contain lowercase letters, numbers, and hyphens"}
    
    if len(slug) < 3 or len(slug) > 50:
        return {"isUnique": False, "message": "Slug must be between 3 and 50 characters"}
    
    slugs_query = db.query(Slug).filter(Slug.slug == slug)
    if exclude_id:
        slugs_query = slugs_query.filter(Slug.project_id != exclude_id)
    
    if slugs_query.first():
        return {
            "isUnique": False, 
            "message": f"The URL path '/{slug}' is already taken. Please choose another one."
        }
    
    projects_query = db.query(Project)
    if exclude_id:
        projects_query = projects_query.filter(Project.id != exclude_id)
    
    projects = projects_query.all()
    
    for project in projects:
        if project.published_url:
            url_parts = project.published_url.rstrip('/').split('/')
            if url_parts and url_parts[-1] == slug:
                return {
                    "isUnique": False, 
                    "message": f"The URL path '/{slug}' is already taken. Please choose another one."
                }
            
            if f"/p/{slug}" in project.published_url or f"/{slug}" in project.published_url:
                return {
                    "isUnique": False, 
                    "message": f"The URL path '/{slug}' is already taken. Please choose another one."
                }
    
    return {"isUnique": True, "message": "Slug is available!"}

# ==================== Integration Endpoints ====================

@app.post("/api/integrations/{project_id}")
async def add_integration(
    project_id: str,
    config: IntegrationConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if str(project.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    integration = Integration(
        id=str(uuid.uuid4()),
        project_id=project.id,
        type=config.type,
        provider=config.provider,
        api_key=config.api_key,
        settings=config.settings
    )
    
    db.add(integration)
    db.commit()
    db.refresh(integration)
    
    integration_code = generate_integration_code(config)
    
    return {
        "success": True,
        "integration_id": str(integration.id),
        "integration_code": integration_code
    }

@app.get("/api/integrations")
async def get_user_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all integrations for the current user's projects"""
    user_projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    project_ids = [p.id for p in user_projects]
    
    if not project_ids:
        return []
    
    integrations = db.query(Integration).filter(
        Integration.project_id.in_(project_ids)
    ).all()
    
    return [
        {
            "id": str(i.id),
            "project_id": str(i.project_id),
            "type": i.type,
            "provider": i.provider,
            "api_key": i.api_key,
            "settings": i.settings,
            "is_active": i.is_active,
            "created_at": i.created_at,
            "updated_at": i.updated_at
        }
        for i in integrations
    ]

@app.get("/api/integrations/{project_id}")
async def get_project_integrations(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if str(project.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    integrations = db.query(Integration).filter(
        Integration.project_id == project.id
    ).all()
    
    return [
        {
            "id": str(i.id),
            "project_id": str(i.project_id),
            "type": i.type,
            "provider": i.provider,
            "api_key": i.api_key,
            "settings": i.settings,
            "created_at": i.created_at
        }
        for i in integrations
    ]

@app.post("/api/integrations/{integration_id}/connect")
async def connect_integration(
    integration_id: str,
    request: IntegrationConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect an integration to a project"""
    project = db.query(Project).filter(
        Project.id == request.project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if integration already exists for this project
    existing = db.query(Integration).filter(
        Integration.project_id == request.project_id,
        Integration.provider == integration_id
    ).first()
    
    if existing:
        # Update existing integration
        existing.api_key = request.config_data.get("api_key")
        existing.settings = {**existing.settings, **request.config_data.get("settings", {})}
        existing.is_active = request.config_data.get("is_active", True)
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return {
            "success": True,
            "message": "Integration updated successfully",
            "integration_id": str(existing.id)
        }
    
    # Get the system integration to copy settings
    system_integration = db.query(Integration).filter(
        Integration.provider == integration_id,
        Integration.project_id == "system"
    ).first()
    
    if not system_integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Create new integration for the user's project
    integration = Integration(
        id=str(uuid.uuid4()),
        project_id=request.project_id,
        type=system_integration.type,
        provider=integration_id,
        api_key=request.config_data.get("api_key"),
        settings={
            **system_integration.settings,
            **request.config_data.get("settings", {})
        },
        is_active=request.config_data.get("is_active", True)
    )
    
    db.add(integration)
    db.commit()
    db.refresh(integration)
    
    return {
        "success": True,
        "message": "Integration connected successfully",
        "integration_id": str(integration.id)
    }

@app.delete("/api/integrations/{integration_id}")
async def disconnect_integration(
    integration_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect an integration"""
    integration = db.query(Integration).join(
        Project, Integration.project_id == Project.id
    ).filter(
        Integration.id == integration_id,
        Project.user_id == current_user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    db.delete(integration)
    db.commit()
    
    return {
        "success": True,
        "message": "Integration disconnected successfully"
    }

@app.delete("/api/integrations/{project_id}/{integration_id}")
async def delete_integration(
    project_id: str,
    integration_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if str(project.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.project_id == project.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    db.delete(integration)
    db.commit()
    
    return {"message": "Integration removed successfully"}

@app.post("/api/integrations/seed")
async def seed_integrations_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Seed integrations (admin only)"""
    if current_user.email != "admin@aleyo.app":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from seed_integrations import seed_integrations as seed
    success = seed(db)
    return {"success": success, "message": "Integrations seeded successfully"}

# ==================== Design Endpoints ====================

@app.get("/api/designs")
async def get_designs(db: Session = Depends(get_db)):
    designs = db.query(Design).all()
    result = []
    
    for design in designs:
        components = db.query(Component).filter(
            Component.design_id == design.id
        ).order_by(Component.order).all()
        
        result.append({
            "id": design.id,
            "name": design.name,
            "category": design.category,
            "layout": design.layout,
            "styles": design.styles,
            "components": [
                {
                    "id": comp.id,
                    "type": comp.type,
                    "styles": comp.styles,
                    "content": comp.content
                }
                for comp in components
            ]
        })
    
    return result

@app.get("/api/designs/all")
async def get_all_designs_for_frontend(db: Session = Depends(get_db)):
    designs = db.query(Design).all()
    
    if not designs:
        return []
    
    result = []
    for design in designs:
        components = db.query(Component).filter(
            Component.design_id == design.id
        ).order_by(Component.order).all()
        
        styles = design.styles or {}
        
        template = {
            "id": str(design.id),
            "name": design.name,
            "category": design.category or "business",
            "description": getattr(design, 'description', None) or f"{design.name} - Professional template",
            "image": getattr(design, 'image_url', None) or f"https://placehold.co/600x400/{styles.get('primaryColor', '4F6EF7')[1:] if styles.get('primaryColor') else '4F6EF7'}/FFFFFF?text={design.name.replace(' ', '+')}",
            "rating": getattr(design, 'rating', 4.5),
            "reviews": getattr(design, 'reviews', 0),
            "features": getattr(design, 'features', ["Responsive Design", "Modern Layout", "Easy Customization"]),
            "popular": getattr(design, 'popular', False),
            "icon": getattr(design, 'icon', "DesignServices"),
            "color": styles.get("primaryColor", "#4F6EF7") if styles else "#4F6EF7",
            "colors": {
                "primaryColor": styles.get("primaryColor", "#4F6EF7") if styles else "#4F6EF7",
                "secondaryColor": styles.get("secondaryColor", "#2DBCB6") if styles else "#2DBCB6",
                "accentColor": styles.get("accentColor", "#3ED67C") if styles else "#3ED67C",
                "backgroundColor": styles.get("backgroundColor", "#FAF9F7") if styles else "#FAF9F7",
                "textColor": styles.get("textColor", "#2C2C2C") if styles else "#2C2C2C",
                "headingColor": styles.get("headingColor", "#1A1A1A") if styles else "#1A1A1A",
                "heroTitle": styles.get("heroTitle", design.name) if styles else design.name,
                "heroSubtitle": styles.get("heroSubtitle", "Create something amazing") if styles else "Create something amazing",
            },
            "components": [
                {
                    "id": str(comp.id),
                    "type": comp.type,
                    "styles": comp.styles,
                    "content": comp.content
                }
                for comp in components
            ]
        }
        result.append(template)
    
    return result

@app.get("/api/designs/{design_id}")
async def get_design(design_id: str, db: Session = Depends(get_db)):
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    components = db.query(Component).filter(
        Component.design_id == design.id
    ).order_by(Component.order).all()
    
    return {
        "id": design.id,
        "name": design.name,
        "category": design.category,
        "description": getattr(design, 'description', None),
        "image_url": getattr(design, 'image_url', None),
        "rating": getattr(design, 'rating', None),
        "reviews": getattr(design, 'reviews', None),
        "features": getattr(design, 'features', None),
        "popular": getattr(design, 'popular', None),
        "icon": getattr(design, 'icon', None),
        "layout": design.layout,
        "styles": design.styles,
        "components": [
            {
                "id": comp.id,
                "type": comp.type,
                "styles": comp.styles,
                "content": comp.content
            }
            for comp in components
        ]
    }

@app.post("/api/designs")
async def create_design(
    design_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    design = Design(
        id=str(uuid.uuid4()),
        name=design_data.get("name"),
        category=design_data.get("category", "business"),
        description=design_data.get("description"),
        image_url=design_data.get("image_url"),
        rating=design_data.get("rating", 4.5),
        reviews=design_data.get("reviews", 0),
        features=design_data.get("features", ["Responsive", "Modern"]),
        popular=design_data.get("popular", False),
        icon=design_data.get("icon", "DesignServices"),
        styles=design_data.get("styles", {}),
        layout=design_data.get("layout", {}),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    db.add(design)
    db.commit()
    db.refresh(design)
    
    return {"message": "Design created successfully", "id": design.id}

@app.put("/api/designs/{design_id}")
async def update_design(
    design_id: str,
    design_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    for key, value in design_data.items():
        if hasattr(design, key) and key not in ["id", "created_at", "updated_at"]:
            setattr(design, key, value)
    
    design.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(design)
    
    return {"message": "Design updated successfully"}

@app.delete("/api/designs/{design_id}")
async def delete_design(
    design_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    db.delete(design)
    db.commit()
    
    return {"message": "Design deleted successfully"}

@app.post("/api/designs/{design_id}/components")
async def add_component_to_design(
    design_id: str,
    component_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    max_order = db.query(func.max(Component.order)).filter(
        Component.design_id == design_id
    ).scalar() or 0
    
    component = Component(
        id=str(uuid.uuid4()),
        design_id=design_id,
        type=component_data.get("type", "section"),
        styles=component_data.get("styles", {}),
        content=component_data.get("content", {}),
        order=max_order + 1
    )
    
    db.add(component)
    db.commit()
    db.refresh(component)
    
    return {"message": "Component added successfully", "id": component.id}

@app.put("/api/designs/{design_id}/components/{component_id}")
async def update_component(
    design_id: str,
    component_id: str,
    component_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    component = db.query(Component).filter(
        Component.id == component_id,
        Component.design_id == design_id
    ).first()
    
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    if "type" in component_data:
        component.type = component_data["type"]
    if "styles" in component_data:
        component.styles = component_data["styles"]
    if "content" in component_data:
        component.content = component_data["content"]
    if "order" in component_data:
        component.order = component_data["order"]
    
    db.commit()
    db.refresh(component)
    
    return {"message": "Component updated successfully"}

@app.delete("/api/designs/{design_id}/components/{component_id}")
async def delete_component(
    design_id: str,
    component_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    component = db.query(Component).filter(
        Component.id == component_id,
        Component.design_id == design_id
    ).first()
    
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    db.delete(component)
    db.commit()
    
    return {"message": "Component deleted successfully"}

@app.post("/api/preview")
async def preview_website(design_ids: List[str], db: Session = Depends(get_db)):
    merged = {
        "layout": {},
        "styles": {},
        "components": []
    }
    
    for design_id in design_ids:
        design = db.query(Design).filter(Design.id == design_id).first()
        if design:
            if design.layout:
                merged["layout"].update(design.layout)
            
            if design.styles:
                for key, value in design.styles.items():
                    merged["styles"][key] = value
            
            components = db.query(Component).filter(
                Component.design_id == design.id
            ).order_by(Component.order).all()
            
            for comp in components:
                merged["components"].append({
                    "id": comp.id,
                    "type": comp.type,
                    "styles": comp.styles,
                    "content": comp.content
                })
    
    seen = set()
    unique_components = []
    for comp in merged["components"]:
        if comp["id"] not in seen:
            seen.add(comp["id"])
            unique_components.append(comp)
    merged["components"] = unique_components
    
    return merged

# ==================== AI Voice Assistant (Anthropic) ====================

VOICE_ASSISTANT_SYSTEM_PROMPT = """You are Nova, the voice/text command interpreter for the Aleyo AI Website Builder.

Given the user's command, the current page context, and the current studio state, respond with ONLY a single raw JSON object (no markdown code fences, no extra commentary) with this exact shape:

{
  "reply": "<short, friendly, specific confirmation message, under 200 characters, emoji ok>",
  "action": {"type": "<action type>", ...other fields...} | null,
  "transform": { ... } | null
}

Valid "action.type" values and their fields:
- "createTemplate": {"template": "business" | "portfolio" | "ecommerce" | "modern"}
- "addComponent": {"component": "hero" | "features" | "gallery" | "contact" | "pricing", plus optional: "animated": true, "columns": 3, "withMap": true, "plans": 3, "layout": "masonry"}
- "changeTheme": {"theme": "dark" | "light" | "blue" | "purple" | "vibrant"}
- "makeResponsive": {}
- "enableAnimations": {"value": true}
- "enhanceDesign": {}
- "undo": {}
- "preview": {}
- "publish": {}
- "mergeDesigns": {}
- "addIntegration": {"provider": "<name>"}

Set "action" to null if the command is a greeting, a question, a help request, or otherwise doesn't map to one of the actions above.

The "transform" object mirrors the action for the studio canvas using only these keys when relevant: "fullTransform" (bool), "template", "addComponent", "themeChange", "responsive" (bool), "animations" (bool), "enhance" (bool). Set "transform" to null when "action" is null.

Always return valid, parseable JSON and nothing else."""

async def interpret_command_with_anthropic(
    command: str, context: str, studio_state: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    if not anthropic_client:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key not configured on the server (set ANTHROPIC_API_KEY).",
        )

    user_message = (
        f'Current page context: {context}\n'
        f'Current studio state: {json.dumps(studio_state or {})}\n'
        f'User command: "{command}"'
    )

    raw_text = ""
    try:
        response = anthropic_client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=500,
            system=VOICE_ASSISTANT_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw_text = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        ).strip()

        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip())

        parsed = json.loads(raw_text)
        return {
            "reply": parsed.get("reply") or "Done!",
            "action": parsed.get("action"),
            "transform": parsed.get("transform"),
        }
    except json.JSONDecodeError:
        logger.error(f"Anthropic returned non-JSON response for voice command: {raw_text!r}")
        return {
            "reply": raw_text or "I understood that, but I'm not sure how to apply it yet.",
            "action": None,
            "transform": None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Anthropic voice command error: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to reach the Anthropic API")

@app.post("/api/ai/voice-command", response_model=VoiceCommandResponse)
@limiter.limit("30/minute")
async def voice_command(request: Request, payload: VoiceCommandRequest):
    if not payload.command or not payload.command.strip():
        raise HTTPException(status_code=400, detail="Command cannot be empty")

    result = await interpret_command_with_anthropic(
        payload.command.strip(), payload.context or "home", payload.studio_state
    )
    return VoiceCommandResponse(**result)

# ==================== WebSocket for Real-time ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket
        logger.info(f"WebSocket connected for user: {user_id}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]
        logger.info(f"WebSocket disconnected for user: {user_id}")
    
    async def send_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")
    
    async def send_to_user(self, user_id: str, data: Dict):
        if user_id in self.user_connections:
            await self.send_message(json.dumps(data), self.user_connections[user_id])

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    
    # Send connection confirmation
    await manager.send_message(
        json.dumps({"type": "connection", "status": "connected", "user_id": user_id}),
        websocket
    )
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            logger.info(f"WebSocket message from {user_id}: {message.get('type')}")
            
            if message["type"] == "voice_command":
                # Process voice command
                command = message.get("command", "")
                context = message.get("context", "home")
                studio_state = message.get("studio_state", {})
                
                # Process the command
                response = await process_voice_command_with_ai(command, context, studio_state)
                
                # Send response back
                await manager.send_message(
                    json.dumps({
                        "type": "command_response",
                        "command": command,
                        "response": response.get("reply", "Command processed"),
                        "action": response.get("action"),
                        "transform": response.get("transform")
                    }),
                    websocket
                )
                
            elif message["type"] == "selection":
                # Process selection
                selection = message.get("selection", {})
                response = await process_selection(selection, user_id)
                await manager.send_message(json.dumps(response), websocket)
                
            elif message["type"] == "merge_designs":
                # Process merge request
                design_ids = message.get("design_ids", [])
                response = await merge_designs_ws(design_ids, user_id)
                await manager.send_message(json.dumps(response), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id)

async def process_voice_command_with_ai(command: str, context: str, studio_state: Dict) -> Dict:
    """Process voice command with AI or fallback to local processing"""
    try:
        # Try Anthropic first
        if anthropic_client:
            result = await interpret_command_with_anthropic(command, context, studio_state)
            return result
        else:
            # Fallback to local processing
            return process_voice_command_local(command)
    except Exception as e:
        logger.error(f"Error processing voice command: {e}")
        return process_voice_command_local(command)

def process_voice_command_local(command: str) -> Dict:
    """Local fallback processing for voice commands"""
    lower = command.lower().strip()
    
    # Color changes
    if "change color" in lower or "blue" in lower:
        return {
            "reply": "✅ Changing primary color to blue",
            "action": {"type": "update_style", "property": "primary_color", "value": "#3B82F6"},
            "transform": {"themeChange": "blue"}
        }
    elif "green" in lower and "color" in lower:
        return {
            "reply": "✅ Changing primary color to green",
            "action": {"type": "update_style", "property": "primary_color", "value": "#10B981"},
            "transform": {"themeChange": "green"}
        }
    elif "purple" in lower and "color" in lower:
        return {
            "reply": "✅ Changing primary color to purple",
            "action": {"type": "update_style", "property": "primary_color", "value": "#8B5CF6"},
            "transform": {"themeChange": "purple"}
        }
    
    # Add sections
    elif "add section" in lower or "add component" in lower:
        component_type = "features"
        if "hero" in lower:
            component_type = "hero"
        elif "gallery" in lower:
            component_type = "gallery"
        elif "contact" in lower or "form" in lower:
            component_type = "contact"
        elif "pricing" in lower:
            component_type = "pricing"
        
        return {
            "reply": f"✅ Adding {component_type} section",
            "action": {"type": "add_component", "component": component_type},
            "transform": {"addComponent": component_type}
        }
    
    # Layout changes
    elif "change layout" in lower:
        layout_type = "grid"
        if "list" in lower:
            layout_type = "list"
        
        return {
            "reply": f"✅ Changing layout to {layout_type}",
            "action": {"type": "change_layout", "layout_type": layout_type}
        }
    
    # Theme changes
    elif "dark" in lower and "theme" in lower:
        return {
            "reply": "🌙 Switching to dark theme",
            "action": {"type": "changeTheme", "theme": "dark"},
            "transform": {"themeChange": "dark"}
        }
    elif "light" in lower and "theme" in lower:
        return {
            "reply": "☀️ Switching to light theme",
            "action": {"type": "changeTheme", "theme": "light"},
            "transform": {"themeChange": "light"}
        }
    
    # Create templates
    elif "create" in lower or "build" in lower or "new" in lower:
        template_type = "modern"
        if "business" in lower or "company" in lower:
            template_type = "business"
        elif "portfolio" in lower:
            template_type = "portfolio"
        elif "ecommerce" in lower or "shop" in lower:
            template_type = "ecommerce"
        
        return {
            "reply": f"✨ Creating a {template_type} website",
            "action": {"type": "createTemplate", "template": template_type},
            "transform": {"fullTransform": True, "template": template_type}
        }
    
    # Help command
    elif "help" in lower:
        return {
            "reply": """🤖 I'm Nova, your AI design assistant! Here's what I can do:

🎨 CREATE: "Create a business website", "Build a portfolio"

🎨 STYLE: "Change color to blue", "Dark theme", "Light theme"

➕ ADD: "Add hero section", "Add contact form", "Add pricing"

📐 LAYOUT: "Change layout to grid"

Try any of these commands!"""
        }
    
    # Default response
    else:
        return {
            "reply": f"🤖 I heard: '{command}'. Try saying 'Create a business website' or 'Add hero section'",
            "action": {"type": "interpret", "command": command}
        }

async def process_selection(selection: Dict, user_id: str) -> Dict:
    """Process user selection from the UI"""
    selection_type = selection.get("type")
    
    if selection_type == "design_template":
        template_id = selection.get("template_id")
        return {
            "action": "apply_template", 
            "template": {"id": template_id},
            "response": f"✅ Applied template: {template_id}"
        }
    
    elif selection_type == "style_option":
        style_property = selection.get("property")
        style_value = selection.get("value")
        return {
            "action": "update_style", 
            "property": style_property, 
            "value": style_value,
            "response": f"✅ Updated {style_property} to {style_value}"
        }
    
    elif selection_type == "component":
        component_type = selection.get("component_type")
        return {
            "action": "add_component", 
            "type": component_type,
            "response": f"✅ Added {component_type} component"
        }
    
    return {"error": "Invalid selection", "response": "Invalid selection"}

async def merge_designs_ws(design_ids: List[str], user_id: str) -> Dict:
    """Merge multiple designs"""
    return {
        "action": "merge_complete", 
        "merged_design": {"design_ids": design_ids},
        "response": "✅ Designs merged successfully!"
    }

# ==================== AI Website Generation ====================

class WebsiteGenerationRequest(BaseModel):
    command: str
    context: Optional[str] = "home"
    studio_state: Optional[Dict[str, Any]] = None

class WebsiteGenerationResponse(BaseModel):
    tech_stack: str
    pages: List[Dict[str, Any]]
    files: List[Dict[str, Any]]
    structure: Dict[str, Any]
    dependencies: List[str]

WEBSITE_GENERATION_PROMPT = """You are an expert full-stack developer and web designer. Generate a complete modern business website based on the user's request.

The user wants: {command}

Generate a complete business website with the following requirements:
1. Choose the best modern tech stack (React, Next.js, Vue, or plain HTML/CSS/JS)
2. Create all necessary files with proper structure
3. Include responsive design
4. Add modern UI/UX patterns
5. Include all necessary business pages (Home, About, Services, Contact, etc.)
6. Add proper SEO meta tags
7. Include modern CSS with animations
8. Make it production-ready

Return the response as JSON with this structure:
{{
    "tech_stack": "React + Tailwind CSS" or "Next.js + Chakra UI" etc.,
    "pages": [
        {{"name": "Home", "route": "/", "components": ["hero", "features", "testimonials"]}},
        ...
    ],
    "files": [
        {{
            "path": "src/App.js",
            "name": "App.js",
            "content": "// file content here",
            "mime_type": "text/javascript"
        }},
        ...
    ],
    "structure": {{
        "src": {{
            "components": ["Hero.js", "Navbar.js", "Footer.js"],
            "pages": ["Home.js", "About.js", "Services.js", "Contact.js"],
            "styles": ["globals.css"]
        }}
    }},
    "dependencies": ["react", "react-dom", "tailwindcss", ...]
}}

Generate a complete, working website. All code should be clean, well-commented, and follow best practices. The website should be visually stunning and professional."""

@app.post("/api/ai/generate-website")
@limiter.limit("10/minute")
async def generate_website(
    request: Request,
    payload: WebsiteGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate a complete website using AI"""
    if not anthropic_client:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key not configured. Please set ANTHROPIC_API_KEY."
        )
    
    try:
        # Build the prompt
        prompt = WEBSITE_GENERATION_PROMPT.format(
            command=payload.command,
            context=payload.context,
            studio_state=json.dumps(payload.studio_state or {})
        )
        
        # Call Anthropic
        response = anthropic_client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=4000,
            system="You are an expert web developer who generates complete, working websites. Return only valid JSON.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse the response
        raw_text = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        ).strip()
        
        # Clean up markdown if present
        if raw_text.startswith("```"):
            raw_text = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip())
        
        parsed = json.loads(raw_text)
        
        return {
            "success": True,
            "tech_stack": parsed.get("tech_stack", "Modern Web Stack"),
            "pages": parsed.get("pages", []),
            "files": parsed.get("files", []),
            "structure": parsed.get("structure", {}),
            "dependencies": parsed.get("dependencies", [])
        }
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        logger.error(f"Website generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate website: {str(e)}")

@app.post("/api/ai/generate-files")
async def generate_website_files(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Generate actual files for the website"""
    website_data = payload.get("website_data", {})
    command = payload.get("command", "")
    
    # If no files in the data, generate them
    if not website_data.get("files"):
        # Generate files based on the structure
        files = generate_default_website_files(website_data, command)
        website_data["files"] = files
    
    return {
        "success": True,
        "tech_stack": website_data.get("tech_stack", "Modern Web Stack"),
        "files": website_data.get("files", []),
        "structure": website_data.get("structure", {})
    }

def generate_default_website_files(website_data: Dict, command: str) -> List[Dict]:
    """Generate default website files if AI didn't provide them"""
    tech_stack = website_data.get("tech_stack", "React")
    business_name = extract_business_name(command) or "MyBusiness"
    
    files = []
    
    if "React" in tech_stack or "Next" in tech_stack:
        # React/Next.js files
        files.append({
            "path": "package.json",
            "name": "package.json",
            "content": generate_package_json(tech_stack, business_name),
            "mime_type": "application/json"
        })
        
        files.append({
            "path": "src/App.js",
            "name": "App.js",
            "content": generate_react_app(business_name),
            "mime_type": "text/javascript"
        })
        
        files.append({
            "path": "src/index.js",
            "name": "index.js",
            "content": generate_react_index(),
            "mime_type": "text/javascript"
        })
        
        files.append({
            "path": "src/styles/globals.css",
            "name": "globals.css",
            "content": generate_global_styles(business_name),
            "mime_type": "text/css"
        })
        
        # Components
        files.append({
            "path": "src/components/Hero.js",
            "name": "Hero.js",
            "content": generate_hero_component(business_name),
            "mime_type": "text/javascript"
        })
        
        files.append({
            "path": "src/components/Navbar.js",
            "name": "Navbar.js",
            "content": generate_navbar_component(business_name),
            "mime_type": "text/javascript"
        })
        
        files.append({
            "path": "src/components/Footer.js",
            "name": "Footer.js",
            "content": generate_footer_component(business_name),
            "mime_type": "text/javascript"
        })
        
        files.append({
            "path": "src/components/Features.js",
            "name": "Features.js",
            "content": generate_features_component(),
            "mime_type": "text/javascript"
        })
        
        files.append({
            "path": "src/components/Contact.js",
            "name": "Contact.js",
            "content": generate_contact_component(),
            "mime_type": "text/javascript"
        })
        
        files.append({
            "path": "public/index.html",
            "name": "index.html",
            "content": generate_index_html(business_name),
            "mime_type": "text/html"
        })
        
        files.append({
            "path": "README.md",
            "name": "README.md",
            "content": generate_readme(business_name, tech_stack),
            "mime_type": "text/markdown"
        })
    
    return files

# Helper functions for generating files
def extract_business_name(command: str) -> str:
    """Extract business name from command"""
    import re
    # Try to extract business name from command
    patterns = [
        r'(?:for|called|named)\s+([A-Za-z0-9\s]+?)(?:\s+website|$)',
        r'(?:create|build)\s+.*?\s+for\s+([A-Za-z0-9\s]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, command, re.IGNORECASE)
        if match:
            return match.group(1).strip().title()
    return "MyBusiness"

def generate_package_json(tech_stack: str, business_name: str) -> str:
    return f'''{{
  "name": "{business_name.lower().replace(' ', '-')}",
  "version": "1.0.0",
  "private": true,
  "dependencies": {{
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "tailwindcss": "^3.3.0"
  }},
  "scripts": {{
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }},
  "eslintConfig": {{
    "extends": ["react-app"]
  }},
  "browserslist": {{
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }}
}}
'''

def generate_react_app(business_name: str) -> str:
    return f'''import React from 'react';
import './styles/globals.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {{
  return (
    <div className="App">
      <Navbar />
      <Hero companyName="{business_name}" />
      <Features />
      <Contact />
      <Footer />
    </div>
  );
}}

export default App;
'''

def generate_react_index() -> str:
    return '''import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
'''

def generate_global_styles(business_name: str) -> str:
    return '''/* Global Styles */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #4F6EF7;
  --primary-dark: #3B56D4;
  --secondary: #2DBCB6;
  --accent: #3ED67C;
  --dark: #0D1220;
  --light: #FAFAFA;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: var(--dark);
  color: white;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--dark);
}

::-webkit-scrollbar-thumb {
  background: var(--primary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary-dark);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.gradient-text {
  background: linear-gradient(135deg, #4F6EF7 0%, #2DBCB6 50%, #3ED67C 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
'''

def generate_hero_component(business_name: str) -> str:
    # Escape any single quotes in the business name
    escaped_name = business_name.replace("'", "\\'")
    
    return f'''import React from 'react';

const Hero = ({{ companyName = '{escaped_name}' }}) => {{
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden">
    {{/* Background gradient */}}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4F6EF7]/20 via-[#2DBCB6]/10 to-transparent" />
      
    {{/* Animated background elements */}}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#4F6EF7]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#2DBCB6]/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 fade-in-up">
          Welcome to{' '}
          <span className="gradient-text">{{companyName}}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto fade-in-up delay-100">
          We build modern, responsive, and stunning websites that help your business grow.
          Let us turn your vision into reality.
        </p>
        <div className="flex flex-wrap gap-4 justify-center fade-in-up delay-200">
          <button className="px-8 py-3 bg-gradient-to-r from-[#4F6EF7] to-[#2DBCB6] text-white rounded-full font-medium hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-[#4F6EF7]/30">
            Get Started
          </button>
          <button className="px-8 py-3 border border-white/20 text-white rounded-full font-medium hover:bg-white/10 transition-all backdrop-blur-sm">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}};

export default Hero;
'''

def generate_navbar_component(business_name: str) -> str:
    escaped_name = business_name.replace("'", "\\'")
    
    return '''import React, {{ useState }} from 'react';

const Navbar = () => {{
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState('home');

  const navItems = [
    {{ name: 'Home', href: '#home' }},
    {{ name: 'Features', href: '#features' }},
    {{ name: 'Contact', href: '#contact' }},
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D1220]/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
                    <div className="text-xl font-bold">
                        <span className="gradient-text">{BUSINESS_NAME}</span>
                    </div>

       
          <div className="hidden md:flex items-center space-x-8">
            {{navItems.map((item) => (
              <a
                key={{item.name}}
                href={{item.href}}
                className={`text-sm transition-colors ${
                  active === item.name.toLowerCase()
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={{() => setActive(item.name.toLowerCase())}}
              >
                {{item.name}}
              </a>
            ))}
            <button className="px-4 py-2 bg-gradient-to-r from-[#4F6EF7] to-[#2DBCB6] text-white rounded-full text-sm font-medium hover:opacity-90 transition-all">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={{() => setIsOpen(!isOpen)}}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {{isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={{2}} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={{2}} d="M4 6h16M4 12h16M4 18h16" />
              )}}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {{isOpen && (
          <div className="md:hidden py-4 border-t border-white/5">
            {{navItems.map((item) => (
              <a
                key={{item.name}}
                href={{item.href}}
                className={`block py-2 text-sm transition-colors ${
                  active === item.name.toLowerCase()
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={{() => {{
                  setActive(item.name.toLowerCase());
                  setIsOpen(false);
                }}}}
              >
                {{item.name}}
              </a>
            ))}
            <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-[#4F6EF7] to-[#2DBCB6] text-white rounded-full text-sm font-medium hover:opacity-90 transition-all">
              Get Started
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}};

export default Navbar;
    '''.replace('{BUSINESS_NAME}', escaped_name)

def generate_footer_component(business_name: str) -> str:
    escaped_name = business_name.replace("'", "\\'")
    
    return f'''import React from 'react';

const Footer = () => {{
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0D1220] border-t border-white/5 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4 gradient-text">{escaped_name}</h3>
            <p className="text-gray-400 text-sm">
              Building modern, responsive websites that help businesses grow online.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Web Development</a></li>
              <li><a href="#" className="hover:text-white transition-colors">UI/UX Design</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Consulting</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📧 info@{escaped_name.lower().replace(' ', '')}.com</li>
              <li>📞 +1 (555) 123-4567</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 text-center text-sm text-gray-400">
          <p>© {{currentYear}} {escaped_name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}};

export default Footer;
'''

def generate_index_html(business_name: str) -> str:
    escaped_name = business_name.replace("'", "&#39;")
    
    return f'''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0D1220" />
    <meta
      name="description"
      content="{escaped_name} - Modern business website"
    />
    <title>{escaped_name}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
'''

def generate_readme(business_name: str, tech_stack: str) -> str:
    escaped_name = business_name.replace("'", "\\'")
    
    return f'''# {escaped_name} Website

A modern, responsive business website built with {tech_stack}.

## Features

- 🚀 Modern tech stack
- 📱 Fully responsive design
- 🎨 Beautiful UI/UX
- ⚡ Fast performance
- 🔒 Secure and reliable
- 🌐 SEO optimized

## Tech Stack

- {tech_stack}
- Tailwind CSS
- Modern JavaScript/React

## Getting Started

### Installation

```bash
npm install
npm start'''


# ==================== Additional Tutorial Endpoints ====================

# ==================== Additional Tutorial Endpoints ====================
# Add these after the existing tutorial endpoints section

@app.get("/api/tutorials/progress")
async def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tutorial progress for the current user"""
    progress_records = db.query(UserTutorialProgress).filter(
        UserTutorialProgress.user_id == current_user.id
    ).all()
    
    return [
        {
            "tutorial_id": str(p.tutorial_id),
            "current_section": p.current_section,
            "completed_sections": p.completed_sections,
            "progress_percentage": p.progress_percentage,
            "started_at": p.started_at,
            "completed_at": p.completed_at,
            "last_watched_at": p.last_watched_at
        }
        for p in progress_records
    ]

@app.get("/api/tutorials/bookmarks")
async def get_user_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all bookmarked tutorials for the current user"""
    bookmarks = db.query(TutorialBookmark).filter(
        TutorialBookmark.user_id == current_user.id
    ).all()
    
    tutorial_ids = [b.tutorial_id for b in bookmarks]
    
    if not tutorial_ids:
        return []
    
    tutorials = db.query(Tutorial).filter(
        Tutorial.id.in_(tutorial_ids),
        Tutorial.status == "published"
    ).all()
    
    return [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "level": t.level,
            "duration": t.duration,
            "duration_seconds": t.duration_seconds,
            "rating": t.rating,
            "views": t.views,
            "likes": t.likes,
            "thumbnail_url": t.thumbnail_url,
            "video_url": t.video_url,
            "video_embed_code": t.video_embed_code,
            "icon": t.icon,
            "is_premium": t.is_premium,
            "sections": t.sections,
            "created_at": t.created_at,
            "is_bookmarked": True
        }
        for t in tutorials
    ]

@app.get("/api/tutorials/completed")
async def get_completed_tutorials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all completed tutorials for the current user"""
    completions = db.query(TutorialCompletion).filter(
        TutorialCompletion.user_id == current_user.id
    ).all()
    
    tutorial_ids = [c.tutorial_id for c in completions]
    
    if not tutorial_ids:
        return []
    
    tutorials = db.query(Tutorial).filter(
        Tutorial.id.in_(tutorial_ids),
        Tutorial.status == "published"
    ).all()
    
    # Get progress for each tutorial
    progress_records = db.query(UserTutorialProgress).filter(
        UserTutorialProgress.tutorial_id.in_(tutorial_ids),
        UserTutorialProgress.user_id == current_user.id
    ).all()
    
    progress_map = {str(p.tutorial_id): p for p in progress_records}
    
    return [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "level": t.level,
            "duration": t.duration,
            "duration_seconds": t.duration_seconds,
            "rating": t.rating,
            "views": t.views,
            "likes": t.likes,
            "thumbnail_url": t.thumbnail_url,
            "video_url": t.video_url,
            "video_embed_code": t.video_embed_code,
            "icon": t.icon,
            "is_premium": t.is_premium,
            "sections": t.sections,
            "completed_at": next((c.completed_at for c in completions if c.tutorial_id == t.id), None),
            "user_progress": {
                "progress_percentage": progress_map[str(t.id)].progress_percentage if str(t.id) in progress_map else 100,
                "completed_sections": progress_map[str(t.id)].completed_sections if str(t.id) in progress_map else []
            } if str(t.id) in progress_map else None,
            "created_at": t.created_at
        }
        for t in tutorials
    ]

@app.get("/api/tutorials/{tutorial_id}/progress")
async def get_tutorial_progress(
    tutorial_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get progress for a specific tutorial"""
    # Check if tutorial exists
    tutorial = db.query(Tutorial).filter(Tutorial.id == tutorial_id).first()
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    
    progress = db.query(UserTutorialProgress).filter(
        UserTutorialProgress.tutorial_id == tutorial_id,
        UserTutorialProgress.user_id == current_user.id
    ).first()
    
    # Check if completed
    completion = db.query(TutorialCompletion).filter(
        TutorialCompletion.tutorial_id == tutorial_id,
        TutorialCompletion.user_id == current_user.id
    ).first()
    
    if not progress:
        return {
            "tutorial_id": tutorial_id,
            "current_section": 0,
            "completed_sections": [],
            "progress_percentage": 0,
            "started_at": None,
            "completed_at": completion.completed_at if completion else None,
            "last_watched_at": None,
            "is_completed": bool(completion)
        }
    
    return {
        "tutorial_id": str(progress.tutorial_id),
        "current_section": progress.current_section,
        "completed_sections": progress.completed_sections,
        "progress_percentage": progress.progress_percentage,
        "started_at": progress.started_at,
        "completed_at": completion.completed_at if completion else progress.completed_at,
        "last_watched_at": progress.last_watched_at,
        "is_completed": bool(completion) or progress.progress_percentage == 100
    }

@app.delete("/api/tutorials/{tutorial_id}/like")
async def unlike_tutorial(
    tutorial_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlike a tutorial"""
    # Check if tutorial exists
    tutorial = db.query(Tutorial).filter(Tutorial.id == tutorial_id).first()
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    
    like = db.query(TutorialLike).filter(
        TutorialLike.tutorial_id == tutorial_id,
        TutorialLike.user_id == current_user.id
    ).first()
    
    if not like:
        raise HTTPException(status_code=404, detail="Like not found")
    
    # Decrement likes count on tutorial
    if tutorial.likes > 0:
        tutorial.likes -= 1
    
    db.delete(like)
    db.commit()
    
    return {
        "message": "Tutorial unliked successfully",
        "likes": tutorial.likes
    }

@app.delete("/api/tutorials/{tutorial_id}/bookmark")
async def unbookmark_tutorial(
    tutorial_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unbookmark a tutorial"""
    # Check if tutorial exists
    tutorial = db.query(Tutorial).filter(Tutorial.id == tutorial_id).first()
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    
    bookmark = db.query(TutorialBookmark).filter(
        TutorialBookmark.tutorial_id == tutorial_id,
        TutorialBookmark.user_id == current_user.id
    ).first()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    db.delete(bookmark)
    db.commit()
    
    return {
        "message": "Bookmark removed successfully",
        "is_bookmarked": False
    }

@app.get("/api/tutorials/stats")
async def get_tutorial_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tutorial statistics for the current user"""
    # Total tutorials published
    total_tutorials = db.query(Tutorial).filter(
        Tutorial.status == "published"
    ).count()
    
    # Completed tutorials
    completed_count = db.query(TutorialCompletion).filter(
        TutorialCompletion.user_id == current_user.id
    ).count()
    
    # In progress tutorials
    in_progress = db.query(UserTutorialProgress).filter(
        UserTutorialProgress.user_id == current_user.id,
        UserTutorialProgress.progress_percentage > 0,
        UserTutorialProgress.progress_percentage < 100
    ).count()
    
    # Bookmarked tutorials
    bookmarked_count = db.query(TutorialBookmark).filter(
        TutorialBookmark.user_id == current_user.id
    ).count()
    
    # Total views across all tutorials
    total_views = db.query(TutorialView).filter(
        TutorialView.user_id == current_user.id
    ).count()
    
    # Average progress
    avg_progress = db.query(func.avg(UserTutorialProgress.progress_percentage)).filter(
        UserTutorialProgress.user_id == current_user.id
    ).scalar() or 0
    
    return {
        "total_tutorials": total_tutorials,
        "completed": completed_count,
        "in_progress": in_progress,
        "bookmarked": bookmarked_count,
        "total_views": total_views,
        "average_progress": round(avg_progress, 1),
        "completion_rate": round((completed_count / total_tutorials * 100) if total_tutorials > 0 else 0, 1)
    }

@app.post("/api/tutorials/{tutorial_id}/watch")
async def track_watch_time(
    tutorial_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track watch time for a tutorial"""
    try:
        body = await request.json()
        duration_watched = body.get("duration_watched", 0)
    except:
        duration_watched = 0
    
    # Check if tutorial exists
    tutorial = db.query(Tutorial).filter(Tutorial.id == tutorial_id).first()
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    
    # Create or update view record
    view = db.query(TutorialView).filter(
        TutorialView.tutorial_id == tutorial_id,
        TutorialView.user_id == current_user.id
    ).first()
    
    if view:
        view.duration_watched += duration_watched
        view.viewed_at = datetime.now(timezone.utc)
    else:
        view = TutorialView(
            id=str(uuid.uuid4()),
            tutorial_id=tutorial_id,
            user_id=current_user.id,
            duration_watched=duration_watched,
            viewed_at=datetime.now(timezone.utc)
        )
        db.add(view)
    
    db.commit()
    
    return {
        "message": "Watch time tracked successfully",
        "duration_watched": view.duration_watched
    }

@app.get("/api/tutorials/recommended")
async def get_recommended_tutorials(
    limit: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recommended tutorials based on user's progress and interests"""
    # Get user's completed tutorials to find categories they like
    completions = db.query(TutorialCompletion).filter(
        TutorialCompletion.user_id == current_user.id
    ).all()
    
    completed_ids = [c.tutorial_id for c in completions]
    
    # Get categories from completed tutorials
    categories = []
    if completed_ids:
        completed_tutorials = db.query(Tutorial).filter(
            Tutorial.id.in_(completed_ids)
        ).all()
        categories = [t.category for t in completed_tutorials if t.category]
    
    # Get bookmarked tutorials
    bookmarks = db.query(TutorialBookmark).filter(
        TutorialBookmark.user_id == current_user.id
    ).all()
    bookmarked_ids = [b.tutorial_id for b in bookmarks]
    
    # Build query for recommendations
    query = db.query(Tutorial).filter(
        Tutorial.status == "published",
        Tutorial.id.notin_(completed_ids)  # Exclude completed
    )
    
    # Prioritize by category if user has preferences
    if categories:
        query = query.filter(Tutorial.category.in_(categories))
    
    # Exclude bookmarked ones (they're already saved)
    if bookmarked_ids:
        query = query.filter(Tutorial.id.notin_(bookmarked_ids))
    
    # Order by rating and views
    query = query.order_by(desc(Tutorial.rating), desc(Tutorial.views))
    
    recommendations = query.limit(limit).all()
    
    # If not enough recommendations, get popular ones
    if len(recommendations) < limit:
        existing_ids = [t.id for t in recommendations]
        additional = db.query(Tutorial).filter(
            Tutorial.status == "published",
            Tutorial.id.notin_(existing_ids),
            Tutorial.id.notin_(completed_ids)
        ).order_by(desc(Tutorial.views)).limit(limit - len(recommendations)).all()
        recommendations.extend(additional)
    
    return [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "level": t.level,
            "duration": t.duration,
            "duration_seconds": t.duration_seconds,
            "rating": t.rating,
            "views": t.views,
            "likes": t.likes,
            "thumbnail_url": t.thumbnail_url,
            "video_url": t.video_url,
            "video_embed_code": t.video_embed_code,
            "icon": t.icon,
            "is_premium": t.is_premium,
            "sections": t.sections,
            "created_at": t.created_at,
            "is_bookmarked": t.id in bookmarked_ids
        }
        for t in recommendations
    ]

@app.get("/api/tutorials/popular")
async def get_popular_tutorials(
    limit: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most popular tutorials"""
    tutorials = db.query(Tutorial).filter(
        Tutorial.status == "published"
    ).order_by(desc(Tutorial.views), desc(Tutorial.likes)).limit(limit).all()
    
    # Get user's bookmarks
    bookmarks = db.query(TutorialBookmark).filter(
        TutorialBookmark.user_id == current_user.id
    ).all()
    bookmarked_ids = [b.tutorial_id for b in bookmarks]
    
    return [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "level": t.level,
            "duration": t.duration,
            "duration_seconds": t.duration_seconds,
            "rating": t.rating,
            "views": t.views,
            "likes": t.likes,
            "thumbnail_url": t.thumbnail_url,
            "video_url": t.video_url,
            "video_embed_code": t.video_embed_code,
            "icon": t.icon,
            "is_premium": t.is_premium,
            "sections": t.sections,
            "created_at": t.created_at,
            "is_bookmarked": t.id in bookmarked_ids
        }
        for t in tutorials
    ]

@app.get("/api/tutorials/recent")
async def get_recent_tutorials(
    limit: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get most recently added tutorials"""
    tutorials = db.query(Tutorial).filter(
        Tutorial.status == "published"
    ).order_by(desc(Tutorial.created_at)).limit(limit).all()
    
    # Get user's bookmarks
    bookmarks = db.query(TutorialBookmark).filter(
        TutorialBookmark.user_id == current_user.id
    ).all()
    bookmarked_ids = [b.tutorial_id for b in bookmarks]
    
    return [
        {
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "level": t.level,
            "duration": t.duration,
            "duration_seconds": t.duration_seconds,
            "rating": t.rating,
            "views": t.views,
            "likes": t.likes,
            "thumbnail_url": t.thumbnail_url,
            "video_url": t.video_url,
            "video_embed_code": t.video_embed_code,
            "icon": t.icon,
            "is_premium": t.is_premium,
            "sections": t.sections,
            "created_at": t.created_at,
            "is_bookmarked": t.id in bookmarked_ids
        }
        for t in tutorials
    ]

@app.post("/api/tutorials/{tutorial_id}/rate")
async def rate_tutorial(
    tutorial_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rate a tutorial"""
    try:
        body = await request.json()
        rating = body.get("rating", 0)
    except:
        raise HTTPException(status_code=400, detail="Invalid request body")
    
    if rating < 0 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 0 and 5")
    
    # Check if tutorial exists
    tutorial = db.query(Tutorial).filter(Tutorial.id == tutorial_id).first()
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    
    # Store rating in a simple way - we'll add a ratings table later if needed
    # For now, update the average rating
    # This is a simplified approach - in production, use a separate ratings table
    
    # For now, just return success
    # You can add a Rating model if you want to track individual ratings
    return {
        "message": "Rating submitted successfully",
        "rating": rating
    }
    
# Add to app.py - Updated tutorial endpoints using the service

from tutorial_service import TutorialService
from typing import Optional
from fastapi import Request, Query, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

@app.get('/api/tutorials')
async def get_tutorials(
    request: Request,
    category: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    views: Optional[int] = Query(None, ge=0),
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    in_progress: bool = Query(False),
    ids: Optional[str] = Query(None),
    order_by: str = Query("created_at", regex="^(created_at|views|rating|likes)$"),
    order_direction: str = Query("desc", regex="^(asc|desc)$"),
    is_premium: Optional[bool] = Query(None),  # ADD THIS PARAMETER
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get tutorials with filtering, pagination, and user progress
    """
    try:
        # Parse IDs if provided
        id_list = None
        if ids:
            id_list = ids.split(',')
        
        service = TutorialService(db)
       
        result = service.get_tutorials(
            user_id=str(current_user.id),
            category=category,
            level=level,
            search=search,
            limit=limit or limit,
            offset=offset or offset,
            in_progress=in_progress,
            ids=id_list,  # Pass the list
            views=views,
            order_by=order_by,
            order_direction=order_direction,
            is_premium=is_premium  # PASS THE PARAMETER
        )
        return result
    except Exception as e:
        logger.error(f"Error in get_tutorials: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.get('/api/tutorials/categories')
async def get_tutorials_category(
    request: Request,
    category: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    views: Optional[int] = Query(None, ge=0),
    limit: int = Query(9, ge=1, le=50),
    offset: int = Query(0, ge=0),
    in_progress: bool = Query(False),
    ids: Optional[str] = Query(None),
    order_by: str = Query("created_at", regex="^(created_at|views|rating|likes)$"),
    order_direction: str = Query("desc", regex="^(asc|desc)$"),
    is_premium: Optional[bool] = Query(None),  # ADD THIS PARAMETER
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get tutorials with filtering, pagination, and user progress
    """
    try:
        # Parse IDs if provided
        id_list = None
        if ids:
            id_list = ids.split(',')
        
        service = TutorialService(db)
        
        result = service.get_tutorials(
            user_id=str(current_user.id),
            category=category,
            level=level,
            search=search,
            limit=limit,
            offset=offset,
            in_progress=in_progress,
            ids=id_list,  # Pass the list
            views=views,
            order_by=order_by,
            order_direction=order_direction,
            is_premium=is_premium  # PASS THE PARAMETER
        )
        return result
    except Exception as e:
        logger.error(f"Error in get_tutorials: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    
    

    
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=3001, log_level="info")
