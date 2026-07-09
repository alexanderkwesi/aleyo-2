# database.py - Fixed to work locally and in production
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger(__name__)

# Create Base for models
Base = declarative_base()

# Determine if we're running locally or in production
IS_PRODUCTION = os.getenv("GAE_ENV", "").startswith("standard") or os.getenv("CLOUD_SQL_INSTANCE") is not None

def get_database_url():
    """Get the database URL based on environment"""
    
    # For local development - use SQLite or local PostgreSQL
    if not IS_PRODUCTION:
        # Use SQLite for local development (no env vars needed)
        db_path = os.getenv("LOCAL_DB_PATH", "./aleyo.db")
        logger.info(f"Using SQLite database at: {db_path}")
        return f"sqlite:///{db_path}?check_same_thread=False"
    
    # For production - use Cloud SQL PostgreSQL
    # These env vars MUST be set in production
    instance_connection_name = os.getenv("INSTANCE_CONNECTION_NAME", "aleyo-501110:us-central1:free-trial-first-project")
    db_user = os.getenv("DB_USER", "free-trial-first-project")
    db_pass = os.getenv("DB_PASS", "")
    db_name = os.getenv("DB_NAME", "aleyo")
    
    if not all([instance_connection_name, db_user, db_pass, db_name]):
        missing = []
        if not instance_connection_name: missing.append("INSTANCE_CONNECTION_NAME")
        if not db_user: missing.append("DB_USER")
        if not db_pass: missing.append("DB_PASS")
        if not db_name: missing.append("DB_NAME")
        raise ValueError(f"Missing required environment variables for Cloud SQL: {', '.join(missing)}")
    
    # For Cloud SQL with Unix socket (Google App Engine)
    if os.getenv("GAE_ENV", "").startswith("standard"):
        # GAE Standard uses Unix socket
        return f"postgresql+pg8000://{db_user}:{db_pass}@/{db_name}?unix_sock=/cloudsql/{instance_connection_name}/.s.PGSQL.5432"
    
    # For Cloud SQL with TCP (Cloud Run, Compute Engine, or local testing)
    db_host = os.getenv("DB_HOST", "127.0.0.1")
    db_port = os.getenv("DB_PORT", "5432")
    return f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

# Create engine with appropriate settings
DATABASE_URL = get_database_url()

# Configure engine based on database type
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=os.getenv("SQL_ECHO", "False").lower() == "true"
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=os.getenv("SQL_ECHO", "False").lower() == "true"
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database - creates all tables"""
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")
