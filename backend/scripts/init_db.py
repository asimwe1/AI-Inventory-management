import os
import sys
import logging
from pathlib import Path
from sqlalchemy import text

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.database.database import init_db, check_db_connection
from app.database.models import Base, Product, InventoryTransaction
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database():
    """Create the database if it doesn't exist."""
    try:
        # Get database URL from environment
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            logger.error("DATABASE_URL environment variable not set")
            sys.exit(1)

        # Extract database name from URL
        db_name = database_url.split("/")[-1]
        
        # Create a connection to the default 'postgres' database
        postgres_url = database_url.rsplit("/", 1)[0] + "/postgres"
        engine = create_engine(postgres_url)
        
        # Check if database exists using text() for raw SQL
        with engine.connect() as conn:
            result = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
            )
            exists = result.scalar()
            
            if not exists:
                # Create database
                conn.execute(text("commit"))  # Close any open transactions
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                logger.info(f"Database '{db_name}' created successfully")
            else:
                logger.info(f"Database '{db_name}' already exists")

    except Exception as e:
        logger.error(f"Error creating database: {e}")
        sys.exit(1)

def main():
    """Initialize the database and create tables."""
    try:
        # Create database if it doesn't exist
        create_database()
        
        # Check database connection
        if not check_db_connection():
            logger.error("Database connection check failed")
            sys.exit(1)
        
        # Initialize database tables
        init_db()
        
        logger.info("Database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 