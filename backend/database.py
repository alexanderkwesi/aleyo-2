# database.py - Modified to work without google-cloud-sql-connector
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

logger = logging.getLogger(__name__)

# Create Base for models
Base = declarative_base()

def get_database_url():
    """Get the database URL based on environment"""
    
    # 1. Check if DATABASE_URL is provided (Render PostgreSQL)
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        logger.info("Using DATABASE_URL from environment (Render PostgreSQL)")
        return database_url
    
    # 2. For local development - use SQLite
    db_path = os.getenv("LOCAL_DB_PATH", "./aleyo.db")
    logger.info(f"Using SQLite database at: {db_path}")
    return f"sqlite:///{db_path}?check_same_thread=False"

# Create engine
DATABASE_URL = get_database_url()

# Configure engine based on database type
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=os.getenv("SQL_ECHO", "False").lower() == "true"
    )
else:
    # For PostgreSQL (Render or Cloud SQL without connector)
    engine = create_engine(
        DATABASE_URL,
        pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
        pool_pre_ping=True,
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "3600")),
        echo=os.getenv("SQL_ECHO", "False").lower() == "true"
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
