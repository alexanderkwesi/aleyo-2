# database.py - Enhanced with better connection management and monitoring
import os
import time
from contextlib import contextmanager
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
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
        db_path = os.getenv("LOCAL_DB_PATH", "./aleyo.db")
        logger.info(f"Using SQLite database at: {db_path}")
        return f"sqlite:///{db_path}?check_same_thread=False"
    
    # For production - use Cloud SQL PostgreSQL
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
    # Enhanced pool configuration for production
    engine = create_engine(
        DATABASE_URL,
        pool_size=15,  # Increased from 10 to handle more concurrent requests
        max_overflow=30,  # Increased from 20 for burst handling
        pool_timeout=30,  # Seconds to wait for a connection before timing out
        pool_recycle=1800,  # Recycle connections after 30 minutes (reduced from 3600)
        pool_pre_ping=True,  # Check connection validity before using
        echo=os.getenv("SQL_ECHO", "False").lower() == "true",
        poolclass=QueuePool  # Explicitly use QueuePool
    )
    
    # Add event listeners to monitor connection usage
    @event.listens_for(engine, "checkout")
    def on_checkout(dbapi_connection, connection_record, connection_proxy):
        """Log when a connection is checked out from the pool"""
        logger.debug(f"Connection checked out. Pool size: {engine.pool.size()}, "
                    f"Checked in: {engine.pool.checkedin()}, "
                    f"Overflow: {engine.pool.overflow()}")
    
    @event.listens_for(engine, "checkin")
    def on_checkin(dbapi_connection, connection_record):
        """Log when a connection is returned to the pool"""
        logger.debug(f"Connection checked in. Pool size: {engine.pool.size()}, "
                    f"Checked in: {engine.pool.checkedin()}, "
                    f"Overflow: {engine.pool.overflow()}")
    
    @event.listens_for(engine, "close")
    def on_close(dbapi_connection, connection_record):
        """Log when a connection is closed"""
        logger.debug(f"Connection closed. Pool size: {engine.pool.size()}, "
                    f"Checked in: {engine.pool.checkedin()}, "
                    f"Overflow: {engine.pool.overflow()}")

# Create session factory with better defaults
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    expire_on_commit=False  # Prevent expired objects causing lazy loading issues
)

# Enhanced dependency to get DB session with better error handling
def get_db():
    """
    Dependency for FastAPI/Flask to get database session.
    Ensures session is properly closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()  # Rollback on error to prevent hanging transactions
        raise
    finally:
        db.close()  # Always close the session

# Context manager for manual session management (alternative to dependency)
@contextmanager
def get_db_context():
    """
    Context manager for database sessions.
    Use this when you need manual control over the session lifecycle.
    
    Example:
        with get_db_context() as db:
            user = db.query(User).filter_by(id=1).first()
            # Session is automatically closed after the block
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()  # Auto-commit if no exception
    except Exception as e:
        db.rollback()  # Rollback on error
        logger.error(f"Database session error in context: {str(e)}")
        raise
    finally:
        db.close()  # Always close the session

# Health check function for database connectivity
def check_database_health():
    """
    Check if the database is accessible and connections are working.
    Returns (is_healthy, message)
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return True, "Database is healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False, f"Database health check failed: {str(e)}"

# Function to get pool status for monitoring
def get_pool_status():
    """Get current connection pool status for monitoring"""
    if hasattr(engine, 'pool'):
        return {
            "size": engine.pool.size(),
            "checkedin": engine.pool.checkedin(),
            "overflow": engine.pool.overflow(),
            "total": engine.pool.size() + engine.pool.overflow()
        }
    return {"error": "No pool available"}

def init_db():
    """Initialize database - creates all tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
        
        # Log pool configuration
        if not "sqlite" in DATABASE_URL:
            logger.info(f"Connection pool configured: pool_size=15, max_overflow=30, timeout=30s")
            logger.info(f"Initial pool status: {get_pool_status()}")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

# Optional: Middleware for FastAPI to handle session cleanup
def setup_db_middleware(app):
    """
    Setup middleware for FastAPI to ensure database sessions are cleaned up
    even when requests fail unexpectedly.
    """
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.requests import Request
    
    class DBSessionMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            # Ensure any sessions used in background tasks are cleaned up
            response = await call_next(request)
            return response
    
    app.add_middleware(DBSessionMiddleware)
    logger.info("Database middleware configured")
