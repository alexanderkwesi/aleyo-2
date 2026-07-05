# models.py - Complete Fixed Version (NO DUPLICATES)
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Table, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
import enum
from database import Base

# Enums
class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class DesignCategory(str, enum.Enum):
    BUSINESS = "business"
    CREATIVE = "creative"
    PERSONAL = "personal"
    ECOMMERCE = "ecommerce"
    PORTFOLIO = "portfolio"
    BLOG = "blog"
    LANDING = "landing"
    CORPORATE = "corporate"

# Association table for many-to-many relationship between projects and designs
project_designs = Table(
    'project_designs',
    Base.metadata,
    Column('project_id', String, ForeignKey('projects.id'), primary_key=True),
    Column('design_id', String, ForeignKey('designs.id'), primary_key=True),
    Column('merged_order', Integer, default=0)
)

# Association table for favorites (many-to-many between users and designs)
favorites = Table(
    'favorites',
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id'), primary_key=True),
    Column('design_id', String, ForeignKey('designs.id'), primary_key=True),
    Column('created_at', DateTime, default=lambda: datetime.now(timezone.utc))
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    credits_balance = Column(Integer, default=50)
    subscription_tier = Column(String, default="free")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)
    password_reset_token = Column(String, nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    
    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    credit_transactions = relationship("CreditTransaction", back_populates="user", cascade="all, delete-orphan")
    favorite_designs = relationship("Design", secondary=favorites, back_populates="favorited_by_users")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    voice_commands = relationship("VoiceCommand", back_populates="user", cascade="all, delete-orphan")

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="sessions")

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    key = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    last_used = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="api_keys")

class Design(Base):
    __tablename__ = "designs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    category = Column(String, default="business")
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    rating = Column(Float, default=4.5)
    reviews = Column(Integer, default=0)
    features = Column(JSON, default=[])
    popular = Column(Boolean, default=False)
    icon = Column(String, default="DesignServices")
    styles = Column(JSON, default={})
    layout = Column(JSON, default={})
    is_predefined = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    components = relationship("Component", back_populates="design", cascade="all, delete-orphan")
    projects = relationship("Project", secondary=project_designs, back_populates="designs")
    favorited_by_users = relationship("User", secondary=favorites, back_populates="favorite_designs")

class Component(Base):
    __tablename__ = "components"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    design_id = Column(String, ForeignKey('designs.id', ondelete='CASCADE'), nullable=False)
    type = Column(String, nullable=False)
    styles = Column(JSON, default={})
    content = Column(JSON, default={})
    order = Column(Integer, default=0)
    
    # Relationships
    design = relationship("Design", back_populates="components")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    global_styles = Column(JSON, default={})
    layout_config = Column(JSON, default={})
    html_code = Column(Text, nullable=True)
    published_url = Column(String, nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="projects")
    designs = relationship("Design", secondary=project_designs, back_populates="projects")
    integrations = relationship("Integration", back_populates="project", cascade="all, delete-orphan")
    slugs = relationship("Slug", back_populates="project", cascade="all, delete-orphan")
    versions = relationship("ProjectVersion", back_populates="project", cascade="all, delete-orphan")

class ProjectVersion(Base):
    __tablename__ = "project_versions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    version_number = Column(Integer, nullable=False)
    html_code = Column(Text, nullable=True)
    changes = Column(JSON, default={})
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    project = relationship("Project", back_populates="versions")

class Slug(Base):
    __tablename__ = "slugs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String, unique=True, nullable=False, index=True)
    project_id = Column(String, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    project = relationship("Project", back_populates="slugs")

class Integration(Base):
    __tablename__ = "integrations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    type = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    api_key = Column(String, nullable=True)
    settings = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    project = relationship("Project", back_populates="integrations")

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    amount = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="credit_transactions")

class Template(Base):
    __tablename__ = "templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    category = Column(String, default="business")
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    styles = Column(JSON, default={})
    layout = Column(JSON, default={})
    html_code = Column(Text, nullable=True)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    event_type = Column(String, nullable=False)
    event_data = Column(JSON, default={})
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class VoiceCommand(Base):
    __tablename__ = "voice_commands"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    command = Column(String, nullable=False)
    response = Column(JSON, default={})
    executed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="voice_commands")

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    tier = Column(SQLEnum(SubscriptionTier), nullable=False, unique=True)
    description = Column(String, nullable=True)
    price_monthly = Column(Float, default=0)
    price_yearly = Column(Float, default=0)
    monthly_credits = Column(Integer, default=50)
    additional_credit_price = Column(Float, default=0.05)
    max_projects = Column(Integer, default=1)
    max_custom_domains = Column(Integer, default=0)
    team_members = Column(Integer, default=1)
    priority_support = Column(Boolean, default=False)
    custom_integrations = Column(Boolean, default=False)
    white_label = Column(Boolean, default=False)
    api_access = Column(Boolean, default=False)
    features = Column(JSON, default={})
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    status = Column(String, default="pending")
    invoice_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    due_date = Column(DateTime, nullable=True)
    paid_date = Column(DateTime, nullable=True)
    items = Column(JSON, default=[])
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class DailyStats(Base):
    __tablename__ = "daily_stats"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(DateTime, nullable=False, unique=True)
    new_users = Column(Integer, default=0)
    new_projects = Column(Integer, default=0)
    total_users = Column(Integer, default=0)
    total_projects = Column(Integer, default=0)
    credits_used = Column(Integer, default=0)
    credits_purchased = Column(Integer, default=0)
    revenue = Column(Float, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ==================== TUTORIAL MODELS ====================

class TutorialCategory(Base):
    __tablename__ = "tutorial_categories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    icon = Column(String(50), default="VideoLibrary")
    color = Column(String(20), default="#4F6EF7")
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class TutorialTag(Base):
    __tablename__ = "tutorial_tags"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False, index=True)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TutorialTagMapping(Base):
    __tablename__ = "tutorial_tag_mapping"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String, ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False, index=True)
    tag_id = Column(String, ForeignKey('tutorial_tags.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Relationships - set up after Tutorial class is defined


class Tutorial(Base):
    __tablename__ = "tutorials"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
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
    sections = Column(JSON, default=[])
    icon = Column(String(50), default="PlayCircle")
    tags = Column(JSON, default=[])
    prerequisites = Column(JSON, default=[])
    is_premium = Column(Boolean, default=False)
    status = Column(String(20), default="published")
    created_by = Column(String, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
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
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String, ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    tutorial = relationship("Tutorial", back_populates="completions")
    user = relationship("User")


class UserTutorialProgress(Base):
    __tablename__ = "user_tutorial_progress"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String, ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    current_section = Column(Integer, default=0)
    completed_sections = Column(JSON, default=[])
    progress_percentage = Column(Integer, default=0)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    last_watched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    tutorial = relationship("Tutorial", back_populates="user_progress")
    user = relationship("User")


class TutorialView(Base):
    __tablename__ = "tutorial_views"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String, ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    duration_watched = Column(Integer, default=0)
    viewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    tutorial = relationship("Tutorial", back_populates="views_log")
    user = relationship("User")


class TutorialComment(Base):
    __tablename__ = "tutorial_comments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String, ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    tutorial = relationship("Tutorial", back_populates="comments")
    user = relationship("User")


class TutorialLike(Base):
    __tablename__ = "tutorial_likes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String, ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    liked = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    tutorial = relationship("Tutorial", back_populates="likes_log")
    user = relationship("User")


class TutorialBookmark(Base):
    __tablename__ = "tutorial_bookmarks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tutorial_id = Column(String, ForeignKey('tutorials.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    tutorial = relationship("Tutorial", back_populates="bookmarks")
    user = relationship("User")


# Fix the back-references for TutorialTag and TutorialTagMapping
TutorialTagMapping.tutorial = relationship("Tutorial", back_populates="tag_mappings")
TutorialTagMapping.tag = relationship("TutorialTag", back_populates="tutorials")
TutorialTag.tutorials = relationship("TutorialTagMapping", back_populates="tag", cascade="all, delete-orphan")


"""
Pricing model — add this to app.py (or your models module) alongside
your existing SQLAlchemy models.

Adjust the `Base` import to match how it's defined elsewhere in app.py,
e.g.:
    from database import Base
or, if Base is defined in app.py itself, just drop this import and use
that Base directly.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    JSON,
    DateTime,
    func,
)
from sqlalchemy.orm import relationship

from database import Base  # adjust to your project's actual import


class Pricing(Base):
    __tablename__ = "pricing"

    id = Column(Integer, primary_key=True, index=True)
    plan_code = Column(String(50), unique=True, nullable=False, index=True)  # 'starter' | 'pro' | 'enterprise'
    name = Column(String(100), nullable=False)
    icon = Column(String(50), nullable=True)  # e.g. 'Rocket', 'Business', 'Apartment'
    price_monthly = Column(Numeric(10, 2), nullable=False)
    price_yearly = Column(Numeric(10, 2), nullable=False)
    credits = Column(Integer, nullable=False)
    features = Column(JSON, nullable=False, default=list)  # list[str]
    is_popular = Column(Boolean, nullable=False, default=False)
    color = Column(String(20), nullable=True)  # hex color used in the UI
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        """Serialize to the shape Pricing.js expects from GET /api/payment/plans."""
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
    """Optional companion table for the add-ons offered at checkout."""

    __tablename__ = "pricing_addons"

    id = Column(Integer, primary_key=True, index=True)
    addon_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    icon = Column(String(50), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "id": self.addon_code,
            "name": self.name,
            "price": float(self.price),
            "icon": self.icon,
        }

    def __repr__(self):
        return f"<PricingAddon {self.addon_code} ${self.price}>"