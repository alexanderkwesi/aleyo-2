# database.py — Cloud SQL with Python Connector (Best for Render)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from google.cloud.sql.connector import Connector
import os

# ─────────────────────────────────────────────
# Configuration from environment variables
# ─────────────────────────────────────────────
INSTANCE_CONNECTION_NAME = "aleyo-501110:us-central1:free-trial-first-project"
DB_USER = "free-trial-first-project"                   # e.g. postgres
DB_PASS = ""                    # your database password
DB_NAME = "aleyo.db"                   # e.g. aleyo_db

# Validate required env vars
required_vars = ["INSTANCE_CONNECTION_NAME", "DB_USER", "DB_PASS", "DB_NAME"]
missing = [v for v in required_vars if not os.getenv(v)]
if missing:
    raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

# ─────────────────────────────────────────────
# Cloud SQL Connector Setup
# ─────────────────────────────────────────────
connector = Connector()

def getconn():
    """Create a new database connection using the Cloud SQL Python Connector."""
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",  # PostgreSQL driver — pure Python, works well with SQLAlchemy
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME,
        ip_type="public",  # Use "private" if you have a private IP configured
    )
    return conn

# ─────────────────────────────────────────────
# SQLAlchemy Engine & Session
# ─────────────────────────────────────────────
engine = create_engine(
    "postgresql+pg8000://",  # dialect+driver — connection is handled by `creator`
    creator=getconn,
    pool_pre_ping=True,      # verifies connections before using them from the pool
    pool_recycle=3600,       # recycle connections after 1 hour
    echo=False               # set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ─────────────────────────────────────────────
# Dependency for FastAPI
# ─────────────────────────────────────────────
def get_db():
    """Yield a database session for FastAPI dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─────────────────────────────────────────────
# Database Initialization
# ─────────────────────────────────────────────
def init_db():
    """Create all tables defined in your models."""
    Base.metadata.create_all(bind=engine)
