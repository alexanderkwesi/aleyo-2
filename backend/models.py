# models.py — MySQL-compatible changes
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Table, Text, Enum as SQLEnum, Numeric
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone
import uuid
import enum

from database import Base

def now_utc():
    return datetime.now(timezone.utc)

# ── MySQL: Use JSON type (requires MySQL 5.7+ or MariaDB 10.2+) ──
# If using older MySQL, replace JSON with Text and handle serialization manually

# Association Tables
project_designs = Table(
    'project_designs',
    Base.metadata,
    Column('project_id', String(36), ForeignKey('projects.id'), primary_key=True),
    Column('design_id', String(36), ForeignKey('designs.id'), primary_key=True),
    Column('merged_order', Integer, default=0)
)

favorites = Table(
    'favorites',
    Base.metadata,
    Column('user_id', String(36), ForeignKey('users.id'), primary_key=True),
    Column('design_id', String(36), ForeignKey('designs.id'), primary_key=True),
    Column('created_at', DateTime, default=now_utc)
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    company = Column(String(255), nullable=True)
    website = Column(String(500), nullable=True)
    credits_balance = Column(Integer, default=50)
    total_credits_purchased = Column(Integer, default=0)
    total_credits_used = Column(Integer, default=0)
    subscription_tier = Column(String(20), default="free")
    subscription_status = Column(String(20), default="trial")
    subscription_start = Column(DateTime, nullable=True)
    subscription_end = Column(DateTime, nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    preferred_language = Column(String(10), default="en")
    timezone = Column(String(50), default="UTC")
    email_notifications = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(255), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    last_ip = Column(String(45), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    credit_transactions = relationship("CreditTransaction", back_populates="user", cascade="all, delete-orphan")
    favorite_designs = relationship("Design", secondary=favorites, back_populates="favorited_by_users")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    voice_commands = relationship("VoiceCommand", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=now_utc)
    last_activity = Column(DateTime, default=now_utc)
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="sessions")


class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    key = Column(String(255), unique=True, nullable=False)
    permissions = Column(JSON, default=list)
    last_used = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="api_keys")


class Design(Base):
    __tablename__ = "designs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    category = Column(String(20), default="business")
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    rating = Column(Float, default=4.5)
    reviews = Column(Integer, default=0)
    features = Column(JSON, default=list)
    popular = Column(Boolean, default=False)
    icon = Column(String(50), default="DesignServices")
    styles = Column(JSON, default=dict)
    layout = Column(JSON, default=dict)
    is_predefined = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    popularity_score = Column(Float, default=0)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    
    components = relationship("Component", back_populates="design", cascade="all, delete-orphan")
    projects = relationship("Project", secondary=project_designs, back_populates="designs")
    favorited_by_users = relationship("User", secondary=favorites, back_populates="favorite_designs")


class Component(Base):
    __tablename__ = "components"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    design_id = Column(String(36), ForeignKey('designs.id', ondelete='CASCADE'), nullable=False)
    type = Column(String(50), nullable=False)
    styles = Column(JSON, default=dict)
    content = Column(JSON, default=dict)
    order = Column(Integer, default=0)
    
    design = relationship("Design", back_populates="components")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    slug = Column(String(255), unique=True, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="draft")
    global_styles = Column(JSON, default=dict)
    layout_config = Column(JSON, default=dict)
    responsive_settings = Column(JSON, default=dict)
    seo_title = Column(String(255), nullable=True)
    seo_description = Column(Text, nullable=True)
    seo_keywords = Column(Text, nullable=True)
    favicon_url = Column(String(500), nullable=True)
    view_count = Column(Integer, default=0)
    last_viewed = Column(DateTime, nullable=True)
    html_code = Column(Text, nullable=True)
    css_code = Column(Text, nullable=True)
    js_code = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    published_version = Column(Integer, nullable=True)
    customizations = Column(JSON, default=dict)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    
    user = relationship("User", back_populates="projects")
    designs = relationship("Design", secondary=project_designs, back_populates="projects")
    integrations = relationship("Integration", back_populates="project", cascade="all, delete-orphan")
    slugs = relationship("Slug", back_populates="project", cascade="all, delete-orphan")
    versions = relationship("ProjectVersion", back_populates="project", cascade="all, delete-orphan")


class ProjectVersion(Base):
    __tablename__ = "project_versions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    version_number = Column(Integer, nullable=False)
    html_code = Column(Text, nullable=True)
    snapshot = Column(JSON, default=dict)
    changes = Column(JSON, default=dict)
    created_at = Column(DateTime, default=now_utc)
    created_by = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    project = relationship("Project", back_populates="versions")


class Slug(Base):
    __tablename__ = "slugs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(255), unique=True, nullable=False, index=True)
    project_id = Column(String(36), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    
    project = relationship("Project", back_populates="slugs")


class Integration(Base):
    __tablename__ = "integrations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    type = Column(String(20), nullable=False)
    provider = Column(String(50), nullable=False)
    name = Column(String(255), nullable=True)
    api_key = Column(String(500), nullable=True)
    api_secret = Column(String(500), nullable=True)
    settings = Column(JSON, default=dict)
    webhook_url = Column(String(500), nullable=True)
    webhook_secret = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    last_sync = Column(DateTime, nullable=True)
    sync_status = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    
    project = relationship("Project", back_populates="integrations")


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    amount = Column(Integer, nullable=False)
    type = Column(String(20), nullable=False)
    description = Column(String(255), nullable=True)
    reference_id = Column(String(255), nullable=True)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=now_utc)
    
    user = relationship("User", back_populates="credit_transactions")


class Template(Base):
    __tablename__ = "templates"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    category = Column(String(20), default="business")
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    styles = Column(JSON, default=dict)
    layout = Column(JSON, default=dict)
    components = Column(JSON, default=list)
    html_code = Column(Text, nullable=True)
    is_premium = Column(Boolean, default=False)
    price = Column(Float, default=0)
    is_public = Column(Boolean, default=False)
    download_count = Column(Integer, default=0)
    preview_url = Column(String(500), nullable=True)
    demo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    project_id = Column(String(36), ForeignKey('projects.id', ondelete='SET NULL'), nullable=True)
    event_type = Column(String(100), nullable=False)
    event_data = Column(JSON, default=dict)
    session_id = Column(String(255), nullable=True)
    page_path = Column(Text, nullable=True)
    referrer = Column(Text, nullable=True)
    device_type = Column(String(20), nullable=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    country_code = Column(String(2), nullable=True)
    city = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=now_utc)


class VoiceCommand(Base):
    __tablename__ = "voice_commands"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    project_id = Column(String(36), ForeignKey('projects.id', ondelete='SET NULL'), nullable=True)
    command = Column(Text, nullable=False)
    command_type = Column(String(20), nullable=True)
    processed_command = Column(JSON, default=dict)
    confidence_score = Column(Float, nullable=True)
    response = Column(JSON, default=dict)
    success = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    processing_time = Column(Float, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    
    user = relationship("User", back_populates="voice_commands")


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    tier = Column(String(20), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    price_monthly = Column(Float, default=0)
    price_yearly = Column(Float, default=0)
    currency = Column(String(3), default="USD")
    monthly_credits = Column(Integer, default=50)
    additional_credit_price = Column(Float, default=0.05)
    max_projects = Column(Integer, default=1)
    max_custom_domains = Column(Integer, default=0)
    team_members = Column(Integer, default=1)
    priority_support = Column(Boolean, default=False)
    custom_integrations = Column(Boolean, default=False)
    white_label = Column(Boolean, default=False)
    api_access = Column(Boolean, default=False)
    features = Column(JSON, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)


class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    subscription_plan_id = Column(String(36), ForeignKey('subscription_plans.id', ondelete='SET NULL'), nullable=True)
    invoice_number = Column(String(100), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    paid_at = Column(DateTime, nullable=True)
    payment_method = Column(String(50), nullable=True)
    stripe_invoice_id = Column(String(255), nullable=True)
    stripe_payment_intent = Column(String(255), nullable=True)
    items = Column(JSON, default=list)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)


class DailyStats(Base):
    __tablename__ = "daily_stats"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    date = Column(DateTime, nullable=False)
    projects_created = Column(Integer, default=0)
    projects_published = Column(Integer, default=0)
    active_projects = Column(Integer, default=0)
    websites_created = Column(Integer, default=0)
    websites_published = Column(Integer, default=0)
    credits_used = Column(Integer, default=0)
    voice_commands_used = Column(Integer, default=0)
    integrations_used = Column(Integer, default=0)
    designs_viewed = Column(Integer, default=0)
    designs_merged = Column(Integer, default=0)
    avg_processing_time = Column(Float, default=0)
    created_at = Column(DateTime, default=now_utc)


# Tutorial Models
class TutorialCategory(Base):
    __tablename__ = "tutorial_categories"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    icon = Column(String(50), default="VideoLibrary")
    color = Column(String(20), default="#4F6EF7")
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)


class TutorialTag(Base):
    __tablename__ = "tutorial_tags"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False, index=True)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=now_utc)
    
    tutorials = relationship("TutorialTagMapping", back_populates="tag", cascade="all, delete-orphan")


class TutorialTagMapping(Base):
    __tablename__ = "tutorial_tag_mapping"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String(36), ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False, index=True)
    tag_id = Column(String(36), ForeignKey('tutorial_tags.id', ondelete='CASCADE'), nullable=False, index=True)
    
    tutorial = relationship("Tutorial", back_populates="tag_mappings")
    tag = relationship("TutorialTag", back_populates="tutorials")


class Tutorial(Base):
    __tablename__ = "tutorials"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=True)
    category = Column(String(50), nullable=False)
    level = Column(String(20), default="Beginner")
    duration = Column(String(20), nullable=True)
    duration_seconds = Column(Integer, default=0)
    rating = Column(Float, default=4.5)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    thumbnail_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    video_embed_code = Column(Text, nullable=True)
    video_file_path = Column(String(500), nullable=True)
    sections = Column(JSON, default=list)
    icon = Column(String(50), default="PlayCircle")
    tags = Column(JSON, default=list)
    prerequisites = Column(JSON, default=list)
    is_premium = Column(Boolean, default=False)
    status = Column(String(20), default="published")
    created_by = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    
    creator = relationship("User", foreign_keys=[created_by])
    completions = relationship("TutorialCompletion", back_populates="tutorial", cascade="all, delete-orphan")
    user_progress = relationship("UserTutorialProgress", back_populates="tutorial", cascade="all, delete-orphan")
    views_log = relationship("TutorialView", back_populates="tutorial", cascade="all, delete-orphan")
    comments = relationship("TutorialComment", back_populates="tutorial", cascade="all, delete-orphan")
    likes_log = relationship("TutorialLike", back_populates="tutorial", cascade="all, delete-orphan")
    bookmarks = relationship("TutorialBookmark", back_populates="tutorial", cascade="all, delete-orphan")
    tag_mappings = relationship("TutorialTagMapping", back_populates="tutorial", cascade="all, delete-orphan")


class TutorialCompletion(Base):
    __tablename__ = "tutorial_completions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String(36), ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    completed_at = Column(DateTime, default=now_utc)
    
    tutorial = relationship("Tutorial", back_populates="completions")
    user = relationship("User")


class UserTutorialProgress(Base):
    __tablename__ = "user_tutorial_progress"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String(36), ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    current_section = Column(Integer, default=0)
    completed_sections = Column(JSON, default=list)
    progress_percentage = Column(Integer, default=0)
    started_at = Column(DateTime, default=now_utc)
    completed_at = Column(DateTime, nullable=True)
    last_watched_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    
    tutorial = relationship("Tutorial", back_populates="user_progress")
    user = relationship("User")


class TutorialView(Base):
    __tablename__ = "tutorial_views"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String(36), ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    duration_watched = Column(Integer, default=0)
    viewed_at = Column(DateTime, default=now_utc)
    
    tutorial = relationship("Tutorial", back_populates="views_log")
    user = relationship("User")


class TutorialComment(Base):
    __tablename__ = "tutorial_comments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String(36), ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    
    tutorial = relationship("Tutorial", back_populates="comments")
    user = relationship("User")


class TutorialLike(Base):
    __tablename__ = "tutorial_likes"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String(36), ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    liked = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)
    
    tutorial = relationship("Tutorial", back_populates="likes_log")
    user = relationship("User")


class TutorialBookmark(Base):
    __tablename__ = "tutorial_bookmarks"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String(36), ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=now_utc)
    
    tutorial = relationship("Tutorial", back_populates="bookmarks")
    user = relationship("User")


# Hosting & Publishing Models
class Website(Base):
    __tablename__ = "websites"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    project_id = Column(String(36), ForeignKey('projects.id', ondelete='SET NULL'), nullable=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String(255), unique=True, nullable=True)
    custom_domain = Column(String(255), unique=True, nullable=True)
    domain_verified = Column(Boolean, default=False)
    ssl_enabled = Column(Boolean, default=False)
    ssl_cert_expires = Column(DateTime, nullable=True)
    target = Column(String(20), default="production")
    status = Column(String(20), default="draft")
    is_private = Column(Boolean, default=False)
    password_hash = Column(Text, nullable=True)
    first_published_at = Column(DateTime, nullable=True)
    last_published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
    deleted_at = Column(DateTime, nullable=True)


class PublishHistory(Base):
    __tablename__ = "publish_history"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    website_id = Column(String(36), ForeignKey('websites.id', ondelete='CASCADE'), nullable=False)
    version_tag = Column(String(100), nullable=True)
    status = Column(String(20), default="success")
    message = Column(Text, nullable=True)
    build_id = Column(String(255), nullable=True)
    artifact_url = Column(Text, nullable=True)
    deployed_by = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    started_at = Column(DateTime, default=now_utc)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=now_utc)


class WebsiteAnalyticsDaily(Base):
    __tablename__ = "website_analytics_daily"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    website_id = Column(String(36), ForeignKey('websites.id', ondelete='CASCADE'), nullable=False)
    date = Column(DateTime, nullable=False)
    visitors = Column(Integer, default=0)
    unique_visitors = Column(Integer, default=0)
    page_views = Column(Integer, default=0)
    sessions = Column(Integer, default=0)
    avg_session_seconds = Column(Integer, default=0)
    bounce_rate = Column(Float, default=0)
    top_countries = Column(JSON, default=list)
    top_referrers = Column(JSON, default=list)
    device_breakdown = Column(JSON, default=dict)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)


class WebsiteAnalyticsHourly(Base):
    __tablename__ = "website_analytics_hourly"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    website_id = Column(String(36), ForeignKey('websites.id', ondelete='CASCADE'), nullable=False)
    hour = Column(DateTime, nullable=False)
    visits = Column(Integer, default=0)
    page_views = Column(Integer, default=0)
    unique_visitors = Column(Integer, default=0)
    created_at = Column(DateTime, default=now_utc)


class WebsiteSettings(Base):
    __tablename__ = "website_settings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    website_id = Column(String(36), ForeignKey('websites.id', ondelete='CASCADE'), nullable=False, unique=True)
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    favicon_url = Column(String(500), nullable=True)
    og_image_url = Column(String(500), nullable=True)
    cdn_enabled = Column(Boolean, default=True)
    cache_ttl = Column(Integer, default=3600)
    gzip_enabled = Column(Boolean, default=True)
    security_headers = Column(JSON, default=dict)
    custom_config = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)


class WebsiteMember(Base):
    __tablename__ = "website_members"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    website_id = Column(String(36), ForeignKey('websites.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = Column(String(50), default="editor")
    created_at = Column(DateTime, default=now_utc)


class AuditLog(Base):
    __tablename__ = "audit_log"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=True)
    action = Column(String(50), nullable=False)
    old_values = Column(JSON, default=dict)
    new_values = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    token = Column(String(255), primary_key=True)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=now_utc)


# Pricing Models
class Pricing(Base):
    __tablename__ = "pricing"

    id = Column(Integer, primary_key=True, index=True)
    plan_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), nullable=True)
    price_monthly = Column(Numeric(10, 2), nullable=False)
    price_yearly = Column(Numeric(10, 2), nullable=False)
    credits = Column(Integer, nullable=False)
    features = Column(JSON, nullable=False, default=list)
    is_popular = Column(Boolean, nullable=False, default=False)
    color = Column(String(20), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    def to_dict(self):
        return {
            "id": self.plan_code,
            "name": self.name,
            "icon": self.icon,
            "price_monthly": float(self.price_monthly),
            "price_yearly": float(self.price_yearly),
            "credits": self.credits,
            "features": self.features,
            "popular": self.is_popular,
            "color": self.color,
        }

    def __repr__(self):
        return f"<Pricing {self.plan_code} monthly=${self.price_monthly} yearly=${self.price_yearly}>"


class PricingAddon(Base):
    __tablename__ = "pricing_addons"

    id = Column(Integer, primary_key=True, index=True)
    addon_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    icon = Column(String(50), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=now_utc)

    def to_dict(self):
        return {
            "id": self.addon_code,
            "name": self.name,
            "price": float(self.price),
            "icon": self.icon,
        }

    def __repr__(self):
        return f"<PricingAddon {self.addon_code} ${self.price}>"
