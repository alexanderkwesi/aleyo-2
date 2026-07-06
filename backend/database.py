# database.py - Ultra-simple version
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Anchor the DB file to this file's own directory, not the process's
# current working directory — avoids "unable to open database file"
# errors that depend on where the script happens to be launched from.
#BASE_DIR = os.path.dirname(os.path.abspath(__file__))
#DB_PATH = os.path.join(BASE_DIR, "aleyo.db")
DATABASE_URL = f"sqlite:///gs://aleyo-bucket/aleyo.db"

# Create engine
connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()

def get_db():
    """Dependency for FastAPI to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database - create all tables"""
    from models import Base
    Base.metadata.create_all(bind=engine)
    print(f"Database initialized successfully at: {DB_PATH}")
    
