import sys
from pathlib import Path
import logging
from sqlalchemy import text

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from app.database.database import engine, init_db
from app.database.models import Base

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def reset_database():
    """Drop all tables and recreate them."""
    try:
        logger.info("Dropping all existing tables...")
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        logger.info("All tables dropped successfully")

        # Create tables
        logger.info("Initializing database with new schema...")
        init_db()
        logger.info("Database initialization completed successfully")

    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

if __name__ == "__main__":
    logger.info("Starting database reset...")
    reset_database()
    logger.info("Database reset completed successfully") 