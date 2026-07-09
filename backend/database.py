# database.py - Modified to use Google Cloud SQL Connector
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging
import json

logger = logging.getLogger(__name__)

# Create Base for models
Base = declarative_base()

def get_cloud_sql_connection_params():
    """Get Cloud SQL connection parameters from environment"""
    # Try to get connection name from environment
    connection_name = os.getenv("CLOUD_SQL_CONNECTION_NAME")
    if not connection_name:
        # Try to construct from GCP project and region
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        region = os.getenv("CLOUD_SQL_REGION", "us-central1")
        instance = os.getenv("CLOUD_SQL_INSTANCE", "aleyo-db")
        if project_id:
            connection_name = f"{project_id}:{region}:{instance}"
    
    return connection_name

def get_database_url():
    """Get the database URL based on environment"""
    
    # 1. Check if we're running on Google Cloud
    is_gcp = os.getenv("GOOGLE_CLOUD_PROJECT") is not None
    connection_name = get_cloud_sql_connection_params()
    
    if is_gcp and connection_name:
        # Use Cloud SQL Connector
        db_user = os.getenv("DB_USER", "postgres")
        db_pass = os.getenv("DB_PASSWORD", "")
        db_name = os.getenv("DB_NAME", "aleyo_db")
        
        logger.info(f"Using Google Cloud SQL Connector for: {connection_name}")
        
        # For Cloud SQL Connector (using Cloud SQL Python Connector)
        # The URL format for the connector
        return f"postgresql+pg8000://{db_user}:{db_pass}@/{db_name}?unix_sock=/cloudsql/{connection_name}/.s.PGSQL.5432"
    
    # 2. Check if DATABASE_URL is provided (Render, Heroku, etc.)
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        logger.info("Using DATABASE_URL from environment")
        return database_url
    
    # 3. Check if we're using Cloud SQL with TCP (fallback)
    cloud_sql_host = os.getenv("CLOUD_SQL_HOST")
    if cloud_sql_host:
        db_user = os.getenv("DB_USER", "postgres")
        db_pass = os.getenv("DB_PASSWORD", "")
        db_name = os.getenv("DB_NAME", "aleyo_db")
        db_port = os.getenv("DB_PORT", "5432")
        logger.info(f"Using Cloud SQL TCP connection at {cloud_sql_host}:{db_port}")
        return f"postgresql://{db_user}:{db_pass}@{cloud_sql_host}:{db_port}/{db_name}"
    
    # 4. For local development - use SQLite
    db_path = os.getenv("LOCAL_DB_PATH", "./aleyo.db")
    logger.info(f"Using SQLite database at: {db_path}")
    return f"sqlite:///{db_path}?check_same_thread=False"

def create_cloud_sql_engine():
    """Create engine with Cloud SQL Connector support"""
    try:
        # Try to import the Cloud SQL Connector
        from google.cloud.sql.connector import Connector, IPTypes
        import pg8000
        
        connection_name = get_cloud_sql_connection_params()
        if not connection_name:
            logger.warning("No Cloud SQL connection name found, falling back to standard connection")
            return None
        
        db_user = os.getenv("DB_USER", "postgres")
        db_pass = os.getenv("DB_PASSWORD", "")
        db_name = os.getenv("DB_NAME", "aleyo_db")
        
        logger.info(f"Initializing Cloud SQL Connector for: {connection_name}")
        
        # Initialize Connector object
        connector = Connector()
        
        def getconn():
            conn = connector.connect(
                connection_name,
                "pg8000",
                user=db_user,
                password=db_pass,
                db=db_name,
                ip_type=IPTypes.PUBLIC,  # Use PUBLIC for deployment, PRIVATE for VPC
            )
            return conn
        
        # Create engine with the connector
        engine = create_engine(
            "postgresql+pg8000://",
            creator=getconn,
            pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
            pool_pre_ping=True,
            pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "3600")),
            echo=os.getenv("SQL_ECHO", "False").lower() == "true"
        )
        
        logger.info("Cloud SQL Connector engine created successfully")
        return engine
        
    except ImportError as e:
        logger.warning(f"Cloud SQL Connector not available: {e}")
        return None
    except Exception as e:
        logger.error(f"Error creating Cloud SQL Connector engine: {e}")
        return None

# Create engine
def create_engine_with_fallback():
    """Create engine with fallback options"""
    # First try Cloud SQL Connector
    engine = create_cloud_sql_engine()
    if engine:
        return engine
    
    # Fallback to standard connection
    DATABASE_URL = get_database_url()
    logger.info(f"Using fallback connection: {DATABASE_URL[:50]}...")
    
    # Configure engine based on database type
    if "sqlite" in DATABASE_URL:
        return create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
            echo=os.getenv("SQL_ECHO", "False").lower() == "true"
        )
    else:
        return create_engine(
            DATABASE_URL,
            pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
            pool_pre_ping=True,
            pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "3600")),
            echo=os.getenv("SQL_ECHO", "False").lower() == "true"
        )

# Create the engine
engine = create_engine_with_fallback()

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
