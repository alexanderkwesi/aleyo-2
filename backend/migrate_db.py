# migrate_db.py - Simplified version
from sqlalchemy import text, inspect
from database import engine, SessionLocal, Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_database():
    """Run database migrations"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("All tables created/verified successfully!")
    except Exception as e:
        logger.error(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate_database()